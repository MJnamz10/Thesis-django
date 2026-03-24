import cv2
from config import CAMERA_INDEX, CAPTURE_WIDTH, CAPTURE_HEIGHT


class CameraService:
    def __init__(self):
        self.cap = None
        self.camera_index = CAMERA_INDEX

    def start(self):
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_V4L2)

        if not self.cap.isOpened():
            return False

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAPTURE_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAPTURE_HEIGHT)
        self.cap.set(cv2.CAP_PROP_FPS, 15)
        return True

    def read(self):
        if self.cap is None:
            return False, None
        return self.cap.read()

    def stop(self):
        if self.cap is not None:
            self.cap.release()
            self.cap = None