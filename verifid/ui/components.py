from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame, QSizePolicy
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QPixmap


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

        # 🔥 KEY FIXES HERE
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(2)  # smaller gap between lines
        lay.setAlignment(Qt.AlignVCenter)  # center vertically

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

        # 🔥 IMPORTANT: prevent stretching
        self.top.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Fixed)
        self.bottom.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Fixed)

        lay.addWidget(self.top)
        lay.addWidget(self.bottom)


class StatusPill(QLabel):
    def __init__(self, text: str):
        super().__init__((text or "").lower())
        self.setAlignment(Qt.AlignCenter)

        t = (text or "").lower().strip()
        self.setObjectName("pillGranted" if t == "granted" else "pillDenied")
        self.setMinimumWidth(82)
        self.setFixedHeight(26)


class StudentPhotoCell(QWidget):
    def __init__(self, image_path: str | None = None):
        super().__init__()
        self.setObjectName("studentPhotoCell")

        lay = QHBoxLayout(self)
        lay.setContentsMargins(6, 4, 6, 4)
        lay.setAlignment(Qt.AlignCenter)

        self.photo = QLabel()
        self.photo.setObjectName("studentPhoto")
        self.photo.setFixedSize(90, 110)
        self.photo.setAlignment(Qt.AlignCenter)

        pix = QPixmap(image_path) if image_path else QPixmap()
        if not pix.isNull():
            self.photo.setPixmap(
                pix.scaled(
                    self.photo.size(),
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation
                )
            )
        else:
            self.photo.setText("No\nImage")

        lay.addWidget(self.photo)


class SegmentButton(QPushButton):
    def __init__(self, text: str, checked=False):
        super().__init__(text)
        self.setCheckable(True)
        self.setChecked(checked)
        self.setCursor(Qt.PointingHandCursor)
        self.setObjectName("segBtn")