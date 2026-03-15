import os
import cv2
from ultralytics import YOLO
from config import (
    MODEL_PATH,
    DEVICE,
    DETECT_WIDTH,
    DETECT_HEIGHT,
    YOLO_CONF,
    YOLO_IMGSZ,
)


class DetectorService:
    def __init__(self):
        self.model = None

        try:
            if os.path.exists(MODEL_PATH):
                self.model = YOLO(MODEL_PATH)
                self.model.to(DEVICE)
                print(f"YOLO model loaded on {DEVICE}")
            else:
                print("YOLO model file not found:", MODEL_PATH)
        except Exception as e:
            self.model = None
            print("Failed to load YOLO model:", e)

    def detect(self, frame_4k):
        if self.model is None:
            return []

        h4k, w4k = frame_4k.shape[:2]
        frame_detect = cv2.resize(frame_4k, (DETECT_WIDTH, DETECT_HEIGHT))

        try:
            results = self.model(
                frame_detect,
                conf=YOLO_CONF,
                imgsz=YOLO_IMGSZ,
                device=DEVICE,
                verbose=False
            )
        except Exception as e:
            print("YOLO inference error:", e)
            return []

        detections = []
        scale_x = w4k / DETECT_WIDTH
        scale_y = h4k / DETECT_HEIGHT

        try:
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])

                x1_4k = int(x1 * scale_x)
                y1_4k = int(y1 * scale_y)
                x2_4k = int(x2 * scale_x)
                y2_4k = int(y2 * scale_y)

                detections.append({
                    "bbox_4k": (x1_4k, y1_4k, x2_4k, y2_4k),
                    "conf": conf,
                })
        except Exception as e:
            print("Detection parsing error:", e)

        return detections

    def draw_boxes_for_display(self, display_frame, detections, source_shape):
        src_h, src_w = source_shape[:2]
        disp_h, disp_w = display_frame.shape[:2]

        scale_x = disp_w / src_w
        scale_y = disp_h / src_h

        for det in detections:
            x1, y1, x2, y2 = det["bbox_4k"]

            x1d = int(x1 * scale_x)
            y1d = int(y1 * scale_y)
            x2d = int(x2 * scale_x)
            y2d = int(y2 * scale_y)

            cv2.rectangle(display_frame, (x1d, y1d), (x2d, y2d), (0, 255, 0), 2)
            cv2.putText(
                display_frame,
                f"{det['conf']:.2f}",
                (x1d, max(20, y1d - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

        return display_frame