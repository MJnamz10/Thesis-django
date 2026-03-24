from services.remote_detector import RemoteDetector


class DetectorService:
    def __init__(self):
        print("Using REMOTE YOLO (laptop)")
        self.remote = RemoteDetector()

    def detect(self, frame_4k):
        return self.remote.detect(frame_4k)

    def draw_boxes_for_display(self, display_frame, detections, source_shape):
        import cv2

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

        return display_frame