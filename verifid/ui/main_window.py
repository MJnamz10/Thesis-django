import os
import cv2
from datetime import datetime
import torch
from ultralytics import YOLO

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QLabel, QPushButton,
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

        self.foot = QLabel("In production, this would use device camera for real QR code scanning")
        self.foot.setObjectName("footnote")

        left_lay.addWidget(left_title)
        left_lay.addWidget(left_desc)
        left_lay.addWidget(self.preview)
        left_lay.addWidget(self.btn_camera)
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

        self.table = QTableWidget(0, 4)
        self.table.setObjectName("table")
        self.table.setHorizontalHeaderLabels(["Student", "Program & Year", "Time", "Status"])
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setSelectionMode(QTableWidget.NoSelection)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setFocusPolicy(Qt.NoFocus)

        self.table.setColumnWidth(0, 240)
        self.table.setColumnWidth(1, 180)
        self.table.setColumnWidth(2, 100)
        self.table.setColumnWidth(3, 180)

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
        data = {"name": "", "id": "", "program": "", "year": ""}

        if "\n" not in raw and "\t" not in raw and ":" not in raw:
            data["id"] = raw.strip()
            return data

        if "\t" in raw and "\n" not in raw:
            parts = [p.strip() for p in raw.split("\t") if p.strip()]
            if len(parts) == 1:
                data["id"] = parts[0]
                return data
            if len(parts) >= 2:
                return {
                    "name": parts[0], "id": parts[1],
                    "program": parts[2] if len(parts) >= 3 else "",
                    "year": parts[3] if len(parts) >= 4 else "",
                }

        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
        if lines and lines[0].lower().startswith("qr code data:"):
            lines[0] = lines[0].split(":", 1)[-1].strip()
            if not lines[0]: lines = lines[1:]

        def pick_after_colon(s: str):
            return s.split(":", 1)[1].strip() if ":" in s else ""

        for ln in lines:
            low = ln.lower()
            if low.startswith("name"): data["name"] = pick_after_colon(ln)
            elif low.startswith("id") or "id number" in low or "student id" in low: data["id"] = pick_after_colon(ln)
            elif low.startswith("program"): data["program"] = pick_after_colon(ln)
            elif low.startswith("year"): data["year"] = pick_after_colon(ln)

        if not any(data.values()):
            if len(lines) == 1: data["id"] = lines[0]
            else:
                if len(lines) >= 1: data["name"] = lines[0]
                if len(lines) >= 2: data["id"] = lines[1]
                if len(lines) >= 3: data["program"] = lines[2]
                if len(lines) >= 4: data["year"] = lines[3]

        if not data["id"]: return None
        return data

    def insert_row_top(self, name: str, sid: str, prog: str, year: str, t: str, status: str):
        self.table.insertRow(0)
        self.table.setCellWidget(0, 0, TwoLineCell(name, sid))
        self.table.setCellWidget(0, 1, TwoLineCell(prog, year))

        time_item = QTableWidgetItem(t)
        time_item.setTextAlignment(Qt.AlignCenter)
        self.table.setItem(0, 2, time_item)

        pill = StatusPill(status)
        wrap = QWidget()
        wrap_l = QHBoxLayout(wrap)
        wrap_l.setContentsMargins(0, 0, 0, 0)
        wrap_l.addStretch(1)
        wrap_l.addWidget(pill)
        wrap_l.addStretch(1)
        self.table.setCellWidget(0, 3, wrap)
        self.table.setRowHeight(0, 64)

        if self.table.rowCount() > 200:
            self.table.removeRow(self.table.rowCount() - 1)

    def add_scan_to_table(self, parsed: dict, raw_payload: str):
        now = datetime.now().strftime("%I:%M:%S %p").lstrip("0")
        qr_name = parsed.get("name", "") or "Unknown"
        sid = (parsed.get("id", "") or "").strip()
        qr_prog = parsed.get("program", "") or "-"
        qr_year = parsed.get("year", "") or "-"

        # CHANGE HERE: Use self.api instead of self.db
        status, db_student, reason = self.api.verify_student(sid)

        name = db_student.get("name") if db_student else qr_name
        prog = db_student.get("program") if db_student else qr_prog
        year = db_student.get("year") if db_student else qr_year

        self.insert_row_top(name, sid or "-", prog, year, now, status)
        
        # CHANGE HERE: Use self.api instead of self.db
        self.api.log_scan(sid, name, prog, year, raw_payload, status, reason)

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