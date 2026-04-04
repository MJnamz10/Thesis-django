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

        # Get ID or default to empty string if not present, then strip whitespace
        raw_id = (parsed.get("id") or "").strip()

        # log even if no ID found, but mark as invalid
        qr_data = {
            "id": raw_id if raw_id else "N/A",
            "name": (parsed.get("name") or "N/A").strip(),
            "course": (parsed.get("course") or "N/A").strip(),
            "gate": "Main Gate",
            "qr_payload": decoded_text,
        }

        print(f"[SCAN_MANAGER] Verifying ID: {qr_data['id']}")
        verification = self.api.verify_student(qr_data)
        print(f"[SCAN_MANAGER] Verification result: {verification.get('status')}")

        return {
            "parsed": parsed,
            "decoded_text": "decoded_text",
            "decoded_stage": scan.get("decoded_stage", "UNKNOWN"),
            "verification": verification,
        }


    def draw_boxes(self, display_frame, detections, source_shape):
        return self.drawer.draw_boxes_for_display(
            display_frame,
            detections,
            source_shape
        )