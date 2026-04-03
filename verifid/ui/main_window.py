from datetime import datetime
from zoneinfo import ZoneInfo
import time
import cv2
import os

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QLabel, QPushButton, QLineEdit,
    QHBoxLayout, QVBoxLayout, QFrame, QTableWidget, QTableWidgetItem,
    QSizePolicy, QToolButton
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

        self.heartbeat_timer = QTimer(self)
        self.heartbeat_timer.timeout.connect(self.send_heartbeat)
        self.heartbeat_timer.start(3000)  # every 3 seconds

        self.current_date = datetime.now().date()
        self.daily_refresh_timer = QTimer(self)
        self.daily_refresh_timer.timeout.connect(self.check_for_new_day)
        self.daily_refresh_timer.start(60000)

        self.frame_counter = 0
        self.latest_detections = []
        self.latest_source_shape = None
        self.worker_busy = False
        self.latest_detection_time = 0.0
        self.detection_box_ttl = 0.6

        self._setup_worker()

        self.setup_ui()
        self.apply_styles()

        self.clock_timer = QTimer(self)
        self.clock_timer.timeout.connect(self.update_clock)
        self.clock_timer.start(1000)
        self.update_clock()

        self.load_saved_logs()

    def _setup_worker(self):
        self.worker_thread = QThread(self)
        self.worker = DetectionWorker()
        self.worker.moveToThread(self.worker_thread)

        self.submit_frame.connect(self.worker.process_frame)
        self.worker.finished.connect(self.on_worker_result)
        self.worker.error.connect(self.on_worker_error)

        self.worker_thread.start()
    
    def update_clock(self):
        now = datetime.now()
        self.clock_time.setText(now.strftime("◴ %I:%M:%S %p").lstrip("0"))
        self.clock_date.setText(now.strftime("%a, %b %d, %Y"))

    def check_for_new_day(self):
        today = datetime.now().date()
        if today != self.current_date:
            self.current_date = today
            self.load_saved_logs()
            print("New day detected. Main window table refreshed.")

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

        self.clock_box = QFrame()
        self.clock_box.setObjectName("clockBox")

        clock_lay = QVBoxLayout(self.clock_box)
        clock_lay.setContentsMargins(10, 6, 10, 6)
        clock_lay.setSpacing(0)

        self.clock_time = QLabel("◴ --:--:-- --")
        self.clock_time.setObjectName("clockTime")
        self.clock_time.setAlignment(Qt.AlignCenter)

        self.clock_date = QLabel("---")
        self.clock_date.setObjectName("clockDate")
        self.clock_date.setAlignment(Qt.AlignCenter)

        clock_lay.addWidget(self.clock_time)
        clock_lay.addWidget(self.clock_date)

        header_lay.addWidget(self.clock_box)

        root_layout.addWidget(header)
        #root_layout.addWidget(top_bar)

        content = QWidget()
        content_lay = QHBoxLayout(content)
        content_lay.setContentsMargins(0, 0, 0, 0)
        content_lay.setSpacing(12)

        left_card, left_lay = create_card()

        left_title = QLabel("Multi-QR Code Scanner for Student Identification System")
        left_title.setContentsMargins(0, 0, 0, 0)
        left_title.setObjectName("cardTitle")

        left_desc = QLabel("Scan student QR codes for campus entry verification")
        left_desc.setContentsMargins(0, 0, 0, 0)
        left_desc.setObjectName("cardDesc")

        self.preview = QLabel("Camera Preview")
        self.preview.setAlignment(Qt.AlignCenter)
        #self.preview.setAlignment(Qt.AlignTop)
        self.preview.setObjectName("preview")
        #self.preview.setMinimumHeight(540)
        self.preview.setFixedSize(720, 540)
        self.preview.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

        self.btn_camera = QPushButton("Open Camera")
        self.btn_camera.setCursor(Qt.PointingHandCursor)
        self.btn_camera.setObjectName("primaryBtn")
        self.btn_camera.clicked.connect(self.toggle_camera)

        #self.id_input = QLineEdit()
        #self.id_input.setPlaceholderText("Enter ID number")
        #self.id_input.setObjectName("idInput")
        #self.id_input.returnPressed.connect(self.search_typed_id)

        #self.btn_test = QPushButton("Search ID")
        #self.btn_test.setCursor(Qt.PointingHandCursor)
        #self.btn_test.setObjectName("secondaryBtn")
        #self.btn_test.clicked.connect(self.search_typed_id)

        self.foot = QLabel("PLEASE SHOW YOUR SCHOOL ID HERE.")
        self.foot.setAlignment(Qt.AlignCenter)
        self.foot.setContentsMargins(0, 12, 0, 0)
        self.foot.setObjectName("footnote")

        self.foot2 = QLabel("AVOID COVERING THE QR CODE.")
        self.foot2.setAlignment(Qt.AlignCenter)
        self.foot2.setContentsMargins(0, 2, 0, 0)
        self.foot2.setObjectName("footnote2")

        left_lay.addWidget(left_title)
        left_lay.addWidget(left_desc)
        left_lay.addWidget(self.preview)
        left_lay.addWidget(self.btn_camera)
        #left_lay.addWidget(self.id_input)
        #left_lay.addWidget(self.btn_test)
        left_lay.addWidget(self.foot)
        left_lay.addWidget(self.foot2)

        right_card, right_lay = create_card()

        #right_title = QLabel("Verification Result")
        #right_title.setObjectName("cardTitle")

        #right_desc = QLabel("Access decision and student information")
        #right_desc.setObjectName("cardDesc")

        right_top = QWidget()
        right_top_lay = QHBoxLayout(right_top)
        right_top_lay.setContentsMargins(0, 0, 0, 0)
        right_top_lay.setSpacing(10)

        title_block = QWidget()
        title_block_lay = QVBoxLayout(title_block)
        title_block_lay.setContentsMargins(0, 0, 0, 0)
        title_block_lay.setSpacing(2)

        right_title = QLabel("Verification Result")
        right_title.setObjectName("cardTitle")

        right_desc = QLabel("Access decision and student information")
        right_desc.setObjectName("cardDesc")

        title_block_lay.addWidget(right_title)
        title_block_lay.addWidget(right_desc)

        right_actions = QWidget()
        right_actions_lay = QHBoxLayout(right_actions)
        right_actions_lay.setContentsMargins(0, 0, 0, 0)
        right_actions_lay.setSpacing(8)

        self.btn_refresh = QPushButton("Refresh ⟳")
        self.btn_refresh.setObjectName("refreshBtn")
        self.btn_refresh.setCursor(Qt.PointingHandCursor)
        self.btn_refresh.clicked.connect(self.load_saved_logs)

        right_actions_lay.addWidget(self.btn_refresh)
        #right_actions_lay.addWidget(self.clock_box)

        right_top_lay.addWidget(title_block)
        right_top_lay.addStretch(1)
        right_top_lay.addWidget(right_actions)

        table_wrap = QFrame()
        table_wrap.setObjectName("tableWrap")

        table_wrap_lay = QVBoxLayout(table_wrap)
        table_wrap_lay.setContentsMargins(0, 0, 0, 0)
        table_wrap_lay.setSpacing(0)

        self.table = QTableWidget(0, 5)
        self.table.setObjectName("table")
        self.table.setHorizontalHeaderLabels(["Student", "Name & ID No.", "Program & Year", "Time", "Validity"])
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setSelectionMode(QTableWidget.NoSelection)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setFocusPolicy(Qt.NoFocus)
        self.table.setAlternatingRowColors(False)

        self.table.setColumnWidth(0, 120)   # photo
        self.table.setColumnWidth(1, 250)   # name + id
        self.table.setColumnWidth(2, 140)   # program + year
        self.table.setColumnWidth(3, 100)   # time
        self.table.setColumnWidth(4, 100)   # status

        table_wrap_lay.addWidget(self.table)

        #right_lay.addWidget(right_title)
        #right_lay.addWidget(right_desc)
        right_lay.addWidget(right_top)
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

        if year_level == 1: ordinal_indicator = "st"
        elif year_level == 2: ordinal_indicator = "nd"
        elif year_level == 3: ordinal_indicator = "rd"
        else: ordinal_indicator = "th"

        yr_level = str(year_level) + ordinal_indicator + " Year"

        # Student photo
        photo_widget = StudentPhotoCell(image_path=image_path)
        self.table.setCellWidget(0, 0, photo_widget)

        # Name + ID
        name_id_widget = TwoLineCell(name, sid)
        self.table.setCellWidget(0, 1, name_id_widget)

        # Program + Year
        prog_year_widget = TwoLineCell(program, yr_level)
        self.table.setCellWidget(0, 2, prog_year_widget)

        # Time
        #time_widget = TwoLineCell(timestamp, "", top_center=True)
        #time_widget.bottom.hide()
        time_widget = TwoLineCell("", timestamp)
        time_widget.top.hide()
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

    def load_saved_logs(self):
        try:
            rows = self.api.get_today_logs(limit=200)
            print("\n=== TODAY LOGS ===")
            for i, row in enumerate(rows, start=1):
                print(
                    f"{i}. "
                    f"id_number={row.get('id_number')}, "
                    f"full_name={row.get('full_name')}, "
                    f"program={row.get('program')}, "
                    f"year_level={row.get('year_level')}, "
                    f"status={row.get('status')}, "
                    f"created_at={row.get('created_at')}"
                )
            print("==================\n")
            
            self.table.setRowCount(0)

            for row in reversed(rows):
                created_at = row.get("created_at")
                #timestamp = created_at.strftime("%I:%M:%S %p").lstrip("0") if created_at else ""

                if created_at:
                    # 1. Make sure Python knows the original time is UTC
                    # (Skip this line if your database already returns a timezone-aware datetime)
                    if created_at.tzinfo is None:
                        created_at = created_at.replace(tzinfo=datetime.timezone.utc)
                    
                    # 2. Convert to your desired local timezone
                    local_time = created_at.astimezone(ZoneInfo("Asia/Manila"))
                    
                    # 3. Format the new local time
                    timestamp = local_time.strftime("%I:%M:%S %p").lstrip("0")
                else:
                    timestamp = ""

                sid = str(row.get("id_number") or "")
                name = row.get("full_name") or ""
                program = row.get("program") or ""
                year_level = str(row.get("year_level") or "")
                status = row.get("status") or ""
                if status.lower() == "verified":
                    status_text = "Verified"
                elif status.lower() == "not_verified":
                    status_text = "Not Verified"
                else:             
                    status_text = "Invalid"

                # get student again for image
                student = self.api.get_student_by_id(sid)
                image_path = self.resolve_student_image_path(student) if student else None

                self.insert_row_top(
                    timestamp,
                    sid,
                    name,
                    program,
                    year_level,
                    status_text,
                    image_path=image_path,
                )

            print(f"Loaded {len(rows)} logs for today.")

        except Exception as e:
            print("Failed to load saved logs:", e)

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
        result = scan["verification"]
        parsed = scan["parsed"]

        created_at = result.get("created_at")
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at)
                now = dt.strftime("%I:%M:%S %p").lstrip("0")
            except Exception:
                now = datetime.now().strftime("%I:%M:%S %p").lstrip("0")
        else:
            now = datetime.now().strftime("%I:%M:%S %p").lstrip("0")

        db_student = result.get("student")
        status = result.get("status", "denied")

        if db_student:
            display_sid = str(db_student.get("id_number") or parsed["id"] or "-")
            display_name = db_student.get("full_name") or "Unknown"
            display_prog = db_student.get("program") or "Unknown"
            
            # Formatting year level
            y_lvl = db_student.get('year_level', '-')
            display_year = f"{y_lvl}" #+ ("th Year" if str(y_lvl).isdigit() else "")

            image_path = self.resolve_student_image_path(db_student)
            if status == "verified":
                status_text = "Verified"
            elif status == "not_verified":
                status_text = "Not Verified"
            else:
                status_text = "Invalid"
        else:
            # --- Logic for Student Not in Masterlist ---
            display_name = "N/A"
            display_sid = parsed["id"] or "N/A"
            display_prog = "N/A"
            display_year = "N/A"
            image_path = None        # No image will be displayed
            status_text = "invalid"  # This will show the "Unknown" pill
            # --------------------------------------------

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

    def send_heartbeat(self):
        try:
            self.api.send_heartbeat()
        except Exception as e:
            print("Heartbeat failed:", e)

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
        #self.preview.setAlignment(Qt.AlignTop)
        self.btn_camera.setText("Stop Camera")
        self.timer.start(30)

    def stop_camera(self):
        #self.preview.setAlignment(Qt.AlignCenter)
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
        try:
            self.heartbeat_timer.stop()
        except Exception:
            pass

        try:
            self.daily_refresh_timer.stop()
        except Exception:
            pass

        try:
            self.api.send_offline()
        except Exception as e:
            print("Failed to send offline status:", e)

        try:
            self.stop_camera()
        except Exception:
            pass

        try:
            self.api.close()
        except Exception:
            pass

        try:
            self.worker_thread.quit()
            self.worker_thread.wait()
        except Exception:
            pass

        super().closeEvent(event)

    def apply_styles(self):
        self.setStyleSheet("""
        QWidget#root { background: #DDE8EB; font-family: "Inter"; }
        QSvgWidget#logoSvg { background: transparent; }
        QLabel#subtitle { font-size: 15px; color: #6b7280; }
        QFrame#card { background: white; border: 1px solid #e6ebf5; border-radius: 14px; }
        QLabel#cardTitle { font-size: 18px; font-weight: 700; color: #281E5D; }
        QLabel#cardDesc { font-size: 15px; color: #6b7280; }
        QLabel#preview { background: #101828; border: 1px solid #e6ebf5; border-radius: 12px; color: #6a7282; font-size: 15px; }
        QPushButton#primaryBtn { background: #fbb318; color: #0f0e54; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; font-size: 12px; }
        QPushButton#primaryBtn:hover { background: #0b1220; color: white; }
        QPushButton#primaryBtn:pressed { background: #000000; }
        QPushButton#secondaryBtn { background: #e5e7eb; color: #111827; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; font-size: 12px; }
        QPushButton#secondaryBtn:hover { background: #d1d5db; }
        QLineEdit#idInput { background: white; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; font-size: 12px; }
        QLabel#footnote { font-size: 15px; font-weight: 700; color: #1b194d; }
        QLabel#footnote2 { font-size: 15px; font-weight: 700; color: #D4183D;}
        QFrame#tableWrap {
            background: #ffffff;
            border: 2px solid #cfd5df;
            border-radius: 12px;
            /* Prevent horizontal overflow */
            overflow: hidden; 
        }

        QTableWidget#table {
            background: transparent;
            border: none;
            outline: none;
        }

        QHeaderView::section {
            background: #1b194d;
            border: none;
            border-bottom: 1px solid #d7dbe2;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 700;
            color: white;
        }

        QHeaderView::section:first {
            border-top-left-radius: 12px;
        }

        QHeaderView::section:last {
            border-top-right-radius: 12px; 
        }

        QTableWidget::item {
            border: none;
            border-bottom: 2px solid #cfd5df;
            padding: 0px;
        }

        QWidget#twoLineCell QLabel#cellTop {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
        }

        QWidget#twoLineCell QLabel#cellBottom {
            font-size: 14px;
            color: #111111;
            margin-top: 2px;
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

        QLabel#statusVerified {
            background: #00a63e;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 10px;
            font-weight: 700;
        }
        QLabel#statusNotVerified {
            background: #d4183d;  /* REd color for not verified */
            color: white;
            border: none;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 10px;
            font-weight: 700;
        }

        QLabel#statusInvalid {
            background: #000000;  /* Black color for unknown */
            width: 100px;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 10px;
            font-weight: 700;
        }
        
        QPushButton#refreshBtn {
            background: #fde3ac;
            color: #fbb521;
            border: none;
            border-radius: 10px;
            padding: 8px 14px;
            font-weight: 700;
            font-size: 12px;
        }
        QPushButton#refreshBtn:hover {
            background: #fbbf24;
            color: #111827;
        }

        QFrame#clockBox {
            background: #fbbf24;
            border: none;
            border-radius: 10px;
        }

        QLabel#clockTime {
            color: #1b194d;
            font-size: 15px;
            font-weight: 800;
        }

        QLabel#clockDate {
            color: #1b194d;
            font-size: 11px;
            font-weight: 600;
        }

        """)
        