import cv2
import requests

# 🔥 CHANGE THIS TO YOUR LAPTOP IP
SERVER_URL = "http://192.168.1.18:8000/detect/"


class RemoteDetector:
    def detect(self, frame_4k):
        try:
            h4k, w4k = frame_4k.shape[:2]

            # resize BEFORE sending
            frame_small = cv2.resize(frame_4k, (640, 640))

            _, img_encoded = cv2.imencode(".jpg", frame_small, [int(cv2.IMWRITE_JPEG_QUALITY), 80])

            response = requests.post(
                SERVER_URL,
                files={"image": img_encoded.tobytes()},
                timeout=3
            )

            detections = response.json().get("detections", [])

            # 🔥 scale back to 4K
            scale_x = w4k / 640
            scale_y = h4k / 640

            results = []
            for det in detections:
                x1, y1, x2, y2 = det["bbox"]

                results.append({
                    "bbox_4k": (
                        int(x1 * scale_x),
                        int(y1 * scale_y),
                        int(x2 * scale_x),
                        int(y2 * scale_y),
                    ),
                    "conf": det["conf"]
                })

            return results

        except Exception as e:
            print("Remote YOLO error:", e)
            return []