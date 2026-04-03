import time
import cv2
from PySide6.QtCore import QObject, Signal, Slot

from services.detector_service import DetectorService
from services.decoder_service import DecoderService
from config import (
    CROP_MARGIN,
    MIN_QR_WIDTH,
    MIN_QR_HEIGHT,
    MIN_SHARPNESS,
    MAX_DETECTIONS_TO_DECODE,
)


class DetectionWorker(QObject):
    finished = Signal(dict)
    error = Signal(str)

    def __init__(self):
        super().__init__()
        self.detector = DetectorService()
        self.decoder = DecoderService()

    def _expand_bbox(self, bbox, frame_shape):
        x1, y1, x2, y2 = bbox
        h, w = frame_shape[:2]

        x1 = max(0, x1 - CROP_MARGIN)
        y1 = max(0, y1 - CROP_MARGIN)
        x2 = min(w, x2 + CROP_MARGIN)
        y2 = min(h, y2 + CROP_MARGIN)

        return x1, y1, x2, y2

    def _is_good_crop(self, crop):
        if crop is None or crop.size == 0:
            print("[WORKER] Crop rejected: empty")
            return False

        h, w = crop.shape[:2]
        if w < MIN_QR_WIDTH or h < MIN_QR_HEIGHT:
            print(f"[WORKER] Crop rejected: too small ({w}x{h})")
            return False

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()

        if sharpness < MIN_SHARPNESS:
            print(f"[WORKER] Crop rejected: blurry (sharpness={sharpness:.2f})")
            return False

        print(f"[WORKER] Crop accepted: size={w}x{h}, sharpness={sharpness:.2f}")
        return True

    def _parse_qr_payload(self, payload: str):
        if not payload:
            return None

        import re

        # Normalize whitespace and remove odd characters like backticks
        raw = payload.strip().replace("\r\n", "\n").replace("\r", "\n")
        normalized = " ".join(raw.replace("`", " ").split())

        data = {"name": "", "id": "", "course": ""}

        # -----------------------------
        # 1) Try labeled format first
        # -----------------------------
        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]

        def pick_after_colon(s: str):
            return s.split(":", 1)[1].strip() if ":" in s else ""

        for ln in lines:
            low = ln.lower()
            if low.startswith("name"):
                data["name"] = pick_after_colon(ln)
            elif low.startswith("id") or "id number" in low or "student id" in low:
                data["id"] = pick_after_colon(ln)
            elif low.startswith("course") or low.startswith("program"):
                data["course"] = pick_after_colon(ln)

        if data["id"]:
            print(f"[WORKER] Parsed labeled QR payload: {data}")
            return data

        # -----------------------------
        # 2) Fallback: unlabeled format
        # Example:
        # APRIL ROSE V. ESPIRITU 2022301128 BSCpE
        # -----------------------------
        id_match = re.search(r"\b\d{8,12}\b", normalized)
        if not id_match:
            print("[WORKER] Decoded text found but no ID parsed")
            return None

        student_id = id_match.group(0)

        before_id = normalized[:id_match.start()].strip()
        after_id = normalized[id_match.end():].strip()

        data["id"] = student_id
        data["name"] = before_id
        data["course"] = after_id

        print(f"[WORKER] Parsed unlabeled QR payload: {data}")
        return data

    @Slot(object)
    def process_frame(self, frame_4k):
        try:
            start = time.time()
            print("[WORKER] Detection started")

            detections = self.detector.detect(frame_4k)
            print(f"[WORKER] YOLO detections found: {len(detections)}")

            if detections:
                detections = sorted(
                    detections,
                    key=lambda d: d.get("conf", 0.0),
                    reverse=True
                )[:MAX_DETECTIONS_TO_DECODE]

            scans = []

            for i, det in enumerate(detections):
                bbox = self._expand_bbox(det["bbox_4k"], frame_4k.shape)
                x1, y1, x2, y2 = bbox
                print(f"[WORKER] Detection {i+1}: bbox={bbox}, conf={det.get('conf', 0.0):.2f}")

                crop = frame_4k[y1:y2, x1:x2]

                if not self._is_good_crop(crop):
                    continue

                decode_result = self.decoder.decode_adaptive(crop)

                if not decode_result["success"]:
                    print("[WORKER] Decode failed after all preprocessing stages")
                    continue

                decoded_text = decode_result["decoded_text"]
                print(f"[WORKER] Decode success at stage={decode_result['stage']}")
                print(f"[WORKER] Decoded text: {decoded_text}")

                parsed = self._parse_qr_payload(decoded_text)

                if not parsed:
                    parsed = {
                        "id": "",
                        "name": "",
                        "course": "",
                    }

                    scans.append({
                        "parsed": parsed,
                        "decoded_text": decoded_text,
                        "decoded_stage": decode_result["stage"],
                        "invalid": True,
                    })

                    continue

                scans.append({
                    "parsed": parsed,
                    "decoded_text": decoded_text,
                    "decoded_stage": decode_result["stage"],
                })

            elapsed = time.time() - start
            print(f"[WORKER] Detection finished in {elapsed:.2f}s | scans={len(scans)}")

            self.finished.emit({
                "detections": detections,
                "scans": scans,
                "finished_at": time.time(),
            })

        except Exception as e:
            self.error.emit(str(e))