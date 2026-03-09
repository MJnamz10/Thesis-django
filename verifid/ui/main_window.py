import os
from unittest import result
import cv2
from datetime import datetime
import torch
from ultralytics import YOLO

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QLabel, QPushButton, QLineEdit,
    QHBoxLayout, QVBoxLayout, QFrame, QTableWidget, QTableWidgetItem,
    QSizePolicy
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtSvgWidgets import QSvgWidget

from config import SVG_PATH, MODEL_PATH, DEVICE
from api_client import APIClient
from ui.components import create_card, TwoLineCell, StatusPill

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VerifID - QR Scanner")
        self.resize(1180, 760)

        # Database Init
        self.api = APIClient()

        # Camera & Processing Init
        self.cap = None
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_frame)
        self.camera_index = 1
        self.qr = cv2.QRCodeDetector()

        self.dedupe_enabled = False
        self.seen_qr = set()
        self.cooldown_ms = 1200
        self.last_insert_ms = 0

        # YOLO Init
        self.yolo_model = None
        try:
            if os.path.exists(MODEL_PATH):
                self.yolo_model = YOLO(MODEL_PATH)
                self.yolo_model.to(DEVICE)
                print(f"YOLO model loaded on {DEVICE}")
            else:
                print("YOLO model file not found:", MODEL_PATH)
        except Exception as e:
            self.yolo_model = None
            print("Failed to load YOLO model:", e)

        self.setup_ui()
        self.apply_styles()

    def setup_ui(self):
        root = QWidget()
        root.setObjectName("root")
        self.setCentralWidget(root)

        root_layout = QVBoxLayout(root)
        root_layout.setContentsMargins(18, 16, 18, 16)
        root_layout.setSpacing(14)

        # Header
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

        # Content Split
        content = QWidget()
        content_lay = QHBoxLayout(content)
        content_lay.setContentsMargins(0, 0, 0, 0)
        content_lay.setSpacing(14)

        # Left Card (Camera)
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

        self.foot = QLabel("In production, this would use device camera for real QR code scanning")
        self.foot.setObjectName("footnote")

        left_lay.addWidget(left_title)
        left_lay.addWidget(left_desc)
        left_lay.addWidget(self.preview)
        left_lay.addWidget(self.btn_camera)
        left_lay.addWidget(self.id_input)
        left_lay.addWidget(self.btn_test)
        left_lay.addWidget(self.foot)

        # Right Card (Results)
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
        self.table.setHorizontalHeaderLabels(["Timestamp", "ID Number", "Name", "Program", "Year Level"])
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setSelectionMode(QTableWidget.NoSelection)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setFocusPolicy(Qt.NoFocus)

        self.table.setColumnWidth(0, 120)  # Timestamp
        self.table.setColumnWidth(1, 120)  # ID
        self.table.setColumnWidth(2, 220)  # Name
        self.table.setColumnWidth(3, 160)  # Program
        self.table.setColumnWidth(4, 80)  # Year Level

        table_wrap_lay.addWidget(self.table)
        right_lay.addWidget(right_title)
        right_lay.addWidget(right_desc)
        right_lay.addWidget(table_wrap)

        content_lay.addWidget(left_card, 1)
        content_lay.addWidget(right_card, 1)
        root_layout.addWidget(content, 1)

    def parse_qr_payload(self, payload: str):
        if not payload: return None
        raw = payload.strip().replace("\r\n", "\n").replace("\r", "\n")
        
        # We now only expect name, id, and course from the QR code
        data = {"name": "", "id": "", "course": ""}

        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
        
        def pick_after_colon(s: str):
            return s.split(":", 1)[1].strip() if ":" in s else ""

        for ln in lines:
            low = ln.lower()
            if low.startswith("name"): data["name"] = pick_after_colon(ln)
            elif low.startswith("id") or "id number" in low or "student id" in low: data["id"] = pick_after_colon(ln)
            elif low.startswith("course") or low.startswith("program"): data["course"] = pick_after_colon(ln)

        if not data["id"]: return None
        return data

    def insert_row_top(self, timestamp: str, sid: str, name: str, program: str, year_level: str):
        self.table.insertRow(0)

        time_item = QTableWidgetItem(timestamp)
        time_item.setTextAlignment(Qt.AlignCenter)
        self.table.setItem(0, 0, time_item)

        id_item = QTableWidgetItem(sid)
        id_item.setTextAlignment(Qt.AlignCenter)
        self.table.setItem(0, 1, id_item)

        name_item = QTableWidgetItem(name)
        self.table.setItem(0, 2, name_item)

        prog_item = QTableWidgetItem(program)
        self.table.setItem(0, 3, prog_item)

        year_item = QTableWidgetItem(year_level)
        self.table.setItem(0, 4, year_item)

        self.table.setRowHeight(0, 48)

        if self.table.rowCount() > 200:
            self.table.removeRow(self.table.rowCount() - 1)

    def search_typed_id(self):
        typed_id = self.id_input.text().strip()

        if not typed_id:
            print("Please enter an ID number.")
            return

        parsed = {
            "id": typed_id,
            "name": "",
            "course": "",
        }

        self.add_scan_to_table(parsed, raw_payload=f"Manual ID Search: {typed_id}")
        self.id_input.clear()

    def add_scan_to_table(self, parsed: dict, raw_payload: str):
        now = datetime.now().strftime("%I:%M:%S %p").lstrip("0")

        qr_data = {
            "id": (parsed.get("id") or "").strip(),
            "name": (parsed.get("name") or "").strip(),
            "course": (parsed.get("course") or "").strip(),
            "gate": "Main Gate",
            "qr_payload": raw_payload,
        }

        result = self.api.verify_student(qr_data)

        status = result.get("status", "denied")
        db_student = result.get("student")
        reason = result.get("reason", "unknown")

        if db_student:
            display_sid = str(db_student.get("id_number") or qr_data["id"] or "-")
            display_name = db_student.get("full_name") or "Unknown"
            display_prog = db_student.get("program") or "Unknown"
            display_year = str(db_student.get("year_level") or "-")
        else:
            display_name = "Not in Masterlist"
            display_prog = reason.replace("_", " ").title()
            display_sid = qr_data["id"] or "-"
            display_year = "-"

        self.insert_row_top(
            now,
            display_sid,
            display_name,
            display_prog,
            display_year,
        )

    def toggle_camera(self):
        if self.cap is None:
            self.start_camera()
        else:
            self.stop_camera()

    def start_camera(self):
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.preview.setText("Camera not found \nTry camera_index = 1")
            self.cap.release()
            self.cap = None
            return
        self.btn_camera.setText("Stop Camera")
        self.timer.start(30)

    def stop_camera(self):
        self.timer.stop()
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        self.preview.setPixmap(QPixmap())
        self.preview.setText("Camera Preview")
        self.btn_camera.setText("Open Camera")

    def _handle_decoded_payload(self, data: str):
        if not data: return
        now_ms = int(datetime.now().timestamp() * 1000)

        if self.dedupe_enabled:
            if data in self.seen_qr: return
            if (now_ms - self.last_insert_ms) < self.cooldown_ms: return

        parsed = self.parse_qr_payload(data)
        if parsed:
            self.add_scan_to_table(parsed, raw_payload=data)
            if self.dedupe_enabled:
                self.seen_qr.add(data)
                self.last_insert_ms = now_ms

    def run_yolo_and_draw(self, frame):
        if self.yolo_model is None: return frame
        try:
            results = self.yolo_model(frame, conf=0.5, imgsz=640, device=DEVICE, verbose=False)
            return results[0].plot()
        except Exception:
            return frame
        
    def draw_qr_boxes(self, frame):
        try:
            ok, decoded_info, points, _ = self.qr.detectAndDecodeMulti(frame)
            if ok and points is not None:
                for i, quad in enumerate(points):
                    pts = quad.astype(int).reshape(-1, 2)
                    for j in range(4):
                        cv2.line(frame, tuple(pts[j]), tuple(pts[(j + 1) % 4]), (0, 255, 0), 2)
                    if decoded_info and i < len(decoded_info):
                        label = (decoded_info[i] if decoded_info[i] else "QR")[:30]
                        cv2.putText(frame, label, (pts[0][0], max(pts[0][1] - 10, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        except Exception:
            pass
        return frame

    def update_frame(self):
        if self.cap is None: return
        ret, frame = self.cap.read()
        if not ret:
            self.preview.setText("Failed to read camera frame.")
            return

        decoded_any = False
        try:
            ok, decoded_info, points, _ = self.qr.detectAndDecodeMulti(frame)
            if ok and decoded_info:
                for s in decoded_info:
                    if s:
                        decoded_any = True
                        self._handle_decoded_payload(s)
        except Exception: pass

        if not decoded_any:
            data, bbox, _ = self.qr.detectAndDecode(frame)
            if data: self._handle_decoded_payload(data)

        frame = self.run_yolo_and_draw(frame)
        frame = self.draw_qr_boxes(frame)
        
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = frame_rgb.shape
        bytes_per_line = ch * w
        qimg = QImage(frame_rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)

        pix = QPixmap.fromImage(qimg).scaled(self.preview.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.preview.setPixmap(pix)

    def closeEvent(self, event):
        self.stop_camera()
        self.api.close()
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
        QLabel#footnote { font-size: 10px; color: #9ca3af; }
        QFrame#tableWrap { background: #ffffff; border: 1px solid #b9c0cb; border-radius: 12px; }
        QTableWidget#table { background: transparent; border: none; outline: none; }
        QHeaderView::section { background: transparent; border: none; border-bottom: 1px solid #b9c0cb; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #111827; }
        QTableWidget::item { border: none; border-bottom: 1px solid #b9c0cb; padding: 10px 12px; font-size: 12px; color: #111827; }
        QWidget#twoLineCell QLabel#cellTop { font-size: 12px; color: #111827; }
        QWidget#twoLineCell QLabel#cellBottom { font-size: 11px; color: #6b7280; }
        QLabel#pillGranted { background: #0b1020; color: white; border: none; border-radius: 14px; padding: 4px 14px; font-size: 11px; font-weight: 700; }
        QLabel#pillDenied { background: #e11d48; color: white; border: none; border-radius: 14px; padding: 4px 14px; font-size: 11px; font-weight: 700; }
        """)
