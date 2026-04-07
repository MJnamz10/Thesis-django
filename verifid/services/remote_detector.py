# remote_detector.py
import cv2
import json
import websocket

# 🔥 Notice the ws:// instead of http://
SERVER_URL = "ws://192.168.89.160:8000/ws/detect/" 

class RemoteDetector:
    def __init__(self):
        self.ws = None
        self.connect()

    def connect(self):
        try:
            print("Connecting to YOLO Server...")
            # Create a persistent connection
            self.ws = websocket.create_connection(SERVER_URL, timeout=3)
            print("Connected!")
        except Exception as e:
            print("Failed to connect to WS:", e)

    def detect(self, frame_4k):
        # Reconnect if the connection drops
        if not self.ws or not self.ws.connected:
            self.connect()
            if not self.ws:
                return []

        try:
            h4k, w4k = frame_4k.shape[:2]

            # 1. Resize BEFORE sending to save bandwidth
            frame_small = cv2.resize(frame_4k, (416, 416))
            #frame_small = cv2.resize(frame_4k, (640, 640))

            # 2. Compress to JPEG
            _, img_encoded = cv2.imencode(".jpg", frame_small, [int(cv2.IMWRITE_JPEG_QUALITY), 80])

            # 3. 🔥 Send raw bytes down the WebSocket (No HTTP Headers!)
            self.ws.send_binary(img_encoded.tobytes())

            # 4. 🔥 Instantly receive the JSON response
            response = self.ws.recv()
            data = json.loads(response)
            detections = data.get("detections", [])

            # 5. Scale back to 4K
            scale_x = w4k / 416
            scale_y = h4k / 416

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
            print("WebSocket YOLO error:", e)
            # Close dead connection so it reconnects next frame
            self.ws.close()
            self.ws = None
            return []