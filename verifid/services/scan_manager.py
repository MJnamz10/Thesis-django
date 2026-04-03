import time
from services.detector_service import DetectorService
from config import SCAN_COOLDOWN_MS


class ScanManager:
    def __init__(self, api_client):
        self.api = api_client
        self.drawer = DetectorService()
        self.last_seen = {}

    def is_duplicate(self, decoded_text):
        now_ms = int(time.time() * 1000)
        last_ms = self.last_seen.get(decoded_text)

        if last_ms is None:
            self.last_seen[decoded_text] = now_ms
            return False

        if (now_ms - last_ms) < SCAN_COOLDOWN_MS:
            print("[SCAN_MANAGER] Duplicate scan skipped")
            return True

        self.last_seen[decoded_text] = now_ms
        return False

    def verify_scan(self, scan):
        decoded_text = scan["decoded_text"]

        if self.is_duplicate(decoded_text):
            return None

        parsed = scan["parsed"]

        if not parsed.get("id"):
            print("[SCAN_MANAGER] No ID found in QR data")
            return {
                "parsed": parsed,
                "decoded_text": scan["decoded_text"],
                "decoded_stage": scan.get("decoded_stage", "UNKNOWN"),
                "verification": {
                    "status": "invalid",
                    "student": None,
                    "reason": "invalid_qr",
                    "mismatches": {},
                },
            }

        qr_data = {
            "id": (parsed.get("id") or "").strip(),
            "name": (parsed.get("name") or "").strip(),
            "course": (parsed.get("course") or "").strip(),
            "gate": "Main Gate",
            "qr_payload": decoded_text,
        }

        print(f"[SCAN_MANAGER] Verifying ID: {qr_data['id']}")
        verification = self.api.verify_student(qr_data)
        print(f"[SCAN_MANAGER] Verification result: {verification.get('status')}")

        return {
            "parsed": parsed,
            "decoded_text": decoded_text,
            "decoded_stage": scan.get("decoded_stage", "UNKNOWN"),
            "verification": verification,
        }

    def draw_boxes(self, display_frame, detections, source_shape):
        return self.drawer.draw_boxes_for_display(
            display_frame,
            detections,
            source_shape
        )