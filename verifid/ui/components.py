from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame
from PySide6.QtCore import Qt

def create_card():
    f = QFrame()
    f.setObjectName("card")
    f.setFrameShape(QFrame.NoFrame)
    lay = QVBoxLayout(f)
    lay.setContentsMargins(18, 18, 18, 18)
    lay.setSpacing(12)
    return f, lay

class TwoLineCell(QWidget):
    def __init__(self, top: str, bottom: str, top_center=False):
        super().__init__()
        self.setObjectName("twoLineCell")
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(4)

        self.top = QLabel(top)
        self.top.setObjectName("cellTop")

        self.bottom = QLabel(bottom)
        self.bottom.setObjectName("cellBottom")

        if top_center:
            self.top.setAlignment(Qt.AlignCenter)
            self.bottom.setAlignment(Qt.AlignCenter)
        else:
            self.top.setAlignment(Qt.AlignLeft)
            self.bottom.setAlignment(Qt.AlignLeft)

        lay.addWidget(self.top)
        lay.addWidget(self.bottom)

class StatusPill(QLabel):
    def __init__(self, text: str):
        super().__init__((text or "").lower())
        self.setAlignment(Qt.AlignCenter)
        t = (text or "").lower().strip()
        self.setObjectName("pillGranted" if t == "granted" else "pillDenied")
        self.setMinimumWidth(92)
        self.setFixedHeight(30)

class SegmentButton(QPushButton):
    def __init__(self, text: str, checked=False):
        super().__init__(text)
        self.setCheckable(True)
        self.setChecked(checked)
        self.setCursor(Qt.PointingHandCursor)
        self.setObjectName("segBtn")