from datetime import datetime
import time
import cv2
import os

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QLabel, QPushButton, QLineEdit,
    QHBoxLayout, QVBoxLayout, QFrame, QTableWidget, QTableWidgetItem,
    QSizePolicy
)
from PySide6.QtCore import Qt, QTimer, QThread, Signal
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtSvgWidgets import QSvgWidget

from config import (
    SVG_PATH,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
    PROCESS_EVERY_N_FRAMES,
    MEDIA_DIR,
    STUDENT_PHOTOS_DIR,
)
from api_client import APIClient
from services.camera_service import CameraService
from services.scan_manager import ScanManager
from services.detection_worker import DetectionWorker
from ui.components import create_card, TwoLineCell, StatusPill, StudentPhotoCell


class MainWindow(QMainWindow):
    submit_frame = Signal(object)

    def __init__(self):
        super().__init__()
        self.setWindowTitle("VerifID - QR Scanner")
        self.resize(1180, 760)

        self.last_submitted_frame = None
        self.last_display_frame = None

        self.api = APIClient()
        self.camera = CameraService()
        self.scan_manager = ScanManager(self.api)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_frame)

        self.frame_counter = 0
        self.latest_detections = []
        self.latest_source_shape = None
        self.worker_busy = False
        self.latest_detection_time = 0.0
        self.detection_box_ttl = 0.6

        self._setup_worker()

        self.setup_ui()
        self.apply_styles()

    def _setup_worker(self):
        self.worker_thread = QThread(self)
        self.worker = DetectionWorker()
        self.worker.moveToThread(self.worker_thread)

        self.submit_frame.connect(self.worker.process_frame)
        self.worker.finished.connect(self.on_worker_result)
        self.worker.error.connect(self.on_worker_error)

        self.worker_thread.start()

    def setup_ui(self):
        root = QWidget()
        root.setObjectName("root")
        self.setCentralWidget(root)

        root_layout = QVBoxLayout(root)
        root_layout.setContentsMargins(18, 16, 18, 16)
        root_layout.setSpacing(14)

        header = QWidget()
        header_lay = QHBoxLayout(header)
        header_lay.setContentsMargins(6, 0, 6, 0)
        header_lay.setSpacing(10)

        brand_col = QWidget()
        brand_lay = QVBoxLayout(brand_col)
        brand_lay.setContentsMargins(0, 0, 0, 0)
        brand_lay.setSpacing(2)

        logo_svg = QSvgWidget(SVG_PATH)
        logo_svg.setObjectName("logoSvg")
        logo_svg.setFixedSize(120, 34)
        logo_svg.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Fixed)

        subtitle = QLabel("University of Science and Technology of Southern Philippines | Cagayan de Oro Campus")
        subtitle.setObjectName("subtitle")

        brand_lay.addWidget(logo_svg)
        brand_lay.addWidget(subtitle)
        header_lay.addWidget(brand_col)
        header_lay.addStretch(1)
        root_layout.addWidget(header)

        content = QWidget()
        content_lay = QHBoxLayout(content)
        content_lay.setContentsMargins(0, 0, 0, 0)
        content_lay.setSpacing(14)

        left_card, left_lay = create_card()

        left_title = QLabel("QR Code Scanner - Main Gate")
        left_title.setObjectName("cardTitle")

        left_desc = QLabel("Scan student QR codes for campus entry verification")
        left_desc.setObjectName("cardDesc")

        self.preview = QLabel("Camera Preview")
        self.preview.setAlignment(Qt.AlignCenter)
        self.preview.setObjectName("preview")
        self.preview.setMinimumHeight(420)
        self.preview.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

        self.btn_camera = QPushButton("Open Camera")
        self.btn_camera.setCursor(Qt.PointingHandCursor)
        self.btn_camera.setObjectName("primaryBtn")
        self.btn_camera.clicked.connect(self.toggle_camera)

        self.id_input = QLineEdit()
        self.id_input.setPlaceholderText("Enter ID number")
        self.id_input.setObjectName("idInput")
        self.id_input.returnPressed.connect(self.search_typed_id)

        self.btn_test = QPushButton("Search ID")
        self.btn_test.setCursor(Qt.PointingHandCursor)
        self.btn_test.setObjectName("secondaryBtn")
        self.btn_test.clicked.connect(self.search_typed_id)

        self.foot = QLabel("Threaded preview mode: smooth UI + background detection")
        self.foot.setObjectName("footnote")

        left_lay.addWidget(left_title)
        left_lay.addWidget(left_desc)
        left_lay.addWidget(self.preview)
        left_lay.addWidget(self.btn_camera)
        left_lay.addWidget(self.id_input)
        left_lay.addWidget(self.btn_test)
        left_lay.addWidget(self.foot)

        right_card, right_lay = create_card()

        right_title = QLabel("Verification Result")
        right_title.setObjectName("cardTitle")

        right_desc = QLabel("Access decision and student information")
        right_desc.setObjectName("cardDesc")

        table_wrap = QFrame()
        table_wrap.setObjectName("tableWrap")

        table_wrap_lay = QVBoxLayout(table_wrap)
        table_wrap_lay.setContentsMargins(0, 0, 0, 0)
        table_wrap_lay.setSpacing(0)

        self.table = QTableWidget(0, 5)
        self.table.setObjectName("table")
        self.table.setHorizontalHeaderLabels(["Student", "Name & ID No.", "Program & Year", "Time", "Status"])
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setSelectionMode(QTableWidget.NoSelection)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setFocusPolicy(Qt.NoFocus)
        self.table.setAlternatingRowColors(False)

        self.table.setColumnWidth(0, 120)    # photo
        self.table.setColumnWidth(1, 230)   # name + id
        self.table.setColumnWidth(2, 150)   # program + year
        self.table.setColumnWidth(3, 110)    # time
        self.table.setColumnWidth(4, 110)    # status

        table_wrap_lay.addWidget(self.table)

        right_lay.addWidget(right_title)
        right_lay.addWidget(right_desc)
        right_lay.addWidget(table_wrap)

        content_lay.addWidget(left_card, 1)
        content_lay.addWidget(right_card, 1)
        root_layout.addWidget(content, 1)

    def insert_row_top(
        self,
        timestamp: str,
        sid: str,
        name: str,
        program: str,
        year_level: str,
        status_text: str,
        image_path: str | None = None,
    ):
        self.table.insertRow(0)

        # Student photo
        photo_widget = StudentPhotoCell(image_path=image_path)
        self.table.setCellWidget(0, 0, photo_widget)

        # Name + ID
        name_id_widget = TwoLineCell(name, sid)
        self.table.setCellWidget(0, 1, name_id_widget)

        # Program + Year
        prog_year_widget = TwoLineCell(program, year_level)
        self.table.setCellWidget(0, 2, prog_year_widget)

        # Time
        time_widget = TwoLineCell(timestamp, "", top_center=True)
        time_widget.bottom.hide()
        self.table.setCellWidget(0, 3, time_widget)

        # Status
        status_wrap = QWidget()
        status_lay = QHBoxLayout(status_wrap)
        status_lay.setContentsMargins(0, 0, 0, 0)
        status_lay.setAlignment(Qt.AlignCenter)
        status_lay.addWidget(StatusPill(status_text))
        self.table.setCellWidget(0, 4, status_wrap)

        self.table.setRowHeight(0, 120)

        if self.table.rowCount() > 200:
            self.table.removeRow(self.table.rowCount() - 1)

    def resolve_student_image_path(self, db_student):
        candidates = [
            db_student.get("student_photos"),
            db_student.get("photo"),
            db_student.get("image"),
            db_student.get("student_photo"),
        ]

        for value in candidates:
            if not value:
                continue

            value = str(value).strip()
            if not value:
                continue

            # If already absolute and exists
            if os.path.isabs(value) and os.path.exists(value):
                return value

            # If value is like "student_photos/file.png"
            media_joined = os.path.join(MEDIA_DIR, value)
            if os.path.exists(media_joined):
                return media_joined

            # If value is just filename like "file.png"
            filename_joined = os.path.join(STUDENT_PHOTOS_DIR, value)
            if os.path.exists(filename_joined):
                return filename_joined

        return None

    def handle_scan_result(self, scan):
        now = datetime.now().strftime("%I:%M:%S %p").lstrip("0")

        result = scan["verification"]
        parsed = scan["parsed"]

        db_student = result.get("student")
        reason = result.get("reason", "unknown")
        status = result.get("status", "denied")

        if db_student:
            display_sid = str(db_student.get("id_number") or parsed["id"] or "-")
            display_name = db_student.get("full_name") or "Unknown"
            display_prog = db_student.get("program") or "Unknown"
            display_year = f"{db_student.get('year_level', '-')}" + (
                "th Year" if str(db_student.get("year_level", "")).isdigit() else ""
            )

            # Change this field name if your DB uses a different one
            image_path = self.resolve_student_image_path(db_student)
            print("Resolved image path:", image_path)
            status_text = "granted" if status == "verified" else "denied"

        else:
            display_name = "Not in Masterlist"
            display_prog = reason.replace("_", " ").title()
            display_sid = parsed["id"] or "-"
            display_year = "-"
            image_path = None
            status_text = "denied"

        self.insert_row_top(
            now,
            display_sid,
            display_name,
            display_prog,
            display_year,
            status_text,
            image_path=image_path,
        )

    def search_typed_id(self):
        typed_id = self.id_input.text().strip()
        if not typed_id:
            print("Please enter an ID number.")
            return

        result = self.scan_manager.process_manual_id(typed_id)
        if result:
            self.handle_scan_result(result)

        self.id_input.clear()

    def toggle_camera(self):
        if self.camera.cap is None:
            self.start_camera()
        else:
            self.stop_camera()

    def start_camera(self):
        ok = self.camera.start()
        if not ok:
            self.preview.setText("Camera not found.\nTry another CAMERA_INDEX in config.py")
            return

        self.btn_camera.setText("Stop Camera")
        self.timer.start(30)

    def stop_camera(self):
        self.timer.stop()
        self.camera.stop()
        self.preview.setPixmap(QPixmap())
        self.preview.setText("Camera Preview")
        self.btn_camera.setText("Open Camera")

    def update_frame(self):
        ret, frame_4k = self.camera.read()
        if not ret or frame_4k is None:
            self.preview.setText("Failed to read camera frame.")
            return

        self.frame_counter += 1
        self.latest_source_shape = frame_4k.shape

        display_frame = cv2.resize(
            frame_4k,
            (DISPLAY_WIDTH, DISPLAY_HEIGHT),
            interpolation=cv2.INTER_AREA
        )

        box_age = time.time() - self.latest_detection_time
        if self.latest_detections and box_age <= self.detection_box_ttl:
            display_frame = self.scan_manager.draw_boxes(
                display_frame,
                self.latest_detections,
                frame_4k.shape
            )

        frame_rgb = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
        h, w, ch = frame_rgb.shape
        bytes_per_line = ch * w
        qimg = QImage(frame_rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)

        pix = QPixmap.fromImage(qimg).scaled(
            self.preview.size(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation
        )
        self.preview.setPixmap(pix)

        should_submit = (self.frame_counter % PROCESS_EVERY_N_FRAMES == 0)

        if should_submit and not self.worker_busy:
            self.worker_busy = True

            self.last_submitted_frame = frame_4k.copy()
            self.last_display_frame = display_frame.copy()

            self.submit_frame.emit(self.last_submitted_frame)

    def on_worker_result(self, result):
        self.worker_busy = False

        self.latest_detections = result.get("detections", [])
        self.latest_detection_time = time.time()

        # 🔥 FORCE SYNC: draw boxes on stored frame
        if self.last_display_frame is not None and self.last_submitted_frame is not None:
            synced_frame = self.scan_manager.draw_boxes(
                self.last_display_frame.copy(),
                self.latest_detections,
                self.last_submitted_frame.shape
            )

            frame_rgb = cv2.cvtColor(synced_frame, cv2.COLOR_BGR2RGB)
            h, w, ch = frame_rgb.shape
            qimg = QImage(frame_rgb.data, w, h, ch * w, QImage.Format_RGB888)

            pix = QPixmap.fromImage(qimg).scaled(
                self.preview.size(),
                Qt.KeepAspectRatio,
                Qt.FastTransformation
            )

            self.preview.setPixmap(pix)

        print(f"[UI] Worker returned {len(self.latest_detections)} detections")

        scans = result.get("scans", [])
        print(f"[UI] Worker returned {len(scans)} decoded scans")

        for raw_scan in scans:
            verified = self.scan_manager.verify_scan(raw_scan)
            if verified:
                print(f"[UI] Adding scan result for ID: {verified['parsed'].get('id')}")
                self.handle_scan_result(verified)

    def on_worker_error(self, message):
        self.worker_busy = False
        print("Worker error:", message)

    def closeEvent(self, event):
        self.stop_camera()
        self.api.close()

        self.worker_thread.quit()
        self.worker_thread.wait()

        super().closeEvent(event)

    def apply_styles(self):
        self.setStyleSheet("""
        QWidget#root { background: #f5f7fb; font-family: Arial; }
        QSvgWidget#logoSvg { background: transparent; }
        QLabel#subtitle { font-size: 11px; color: #6b7280; }
        QFrame#card { background: white; border: 1px solid #e6ebf5; border-radius: 14px; }
        QLabel#cardTitle { font-size: 12px; font-weight: 700; color: #374151; }
        QLabel#cardDesc { font-size: 11px; color: #6b7280; }
        QLabel#preview { background: #f3f6fb; border: 1px solid #e6ebf5; border-radius: 12px; color: #94a3b8; font-size: 12px; }
        QPushButton#primaryBtn { background: #111827; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; font-size: 12px; }
        QPushButton#primaryBtn:hover { background: #0b1220; }
        QPushButton#primaryBtn:pressed { background: #000000; }
        QPushButton#secondaryBtn { background: #e5e7eb; color: #111827; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; font-size: 12px; }
        QPushButton#secondaryBtn:hover { background: #d1d5db; }
        QLineEdit#idInput { background: white; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; font-size: 12px; }
        QLabel#footnote { font-size: 10px; color: #9ca3af; }
        QFrame#tableWrap {
            background: #ffffff;
            border: 1px solid #cfd5df;
            border-radius: 12px;
        }

        QTableWidget#table {
            background: transparent;
            border: none;
            outline: none;
        }

        QHeaderView::section {
            background: transparent;
            border: none;
            border-bottom: 1px solid #d7dbe2;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 700;
            color: #3f3f46;
        }

        QTableWidget::item {
            border: none;
            border-bottom: 1px solid #eceff3;
            padding: 0px;
        }

        QWidget#twoLineCell QLabel#cellTop {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
        }

        QWidget#twoLineCell QLabel#cellBottom {
            font-size: 13px;
            color: #111111;
            margin-top: -1px;
        }

        QWidget#studentPhotoCell {
            background: transparent;
        }

        QLabel#studentPhoto {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            color: #6b7280;
            font-size: 8px;
        }

        QLabel#pillGranted {
            background: #22c55e;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 10px;
            font-weight: 700;
        }

        QLabel#pillDenied {
            background: #e11d48;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 10px;
            font-weight: 700;
        }
        """)