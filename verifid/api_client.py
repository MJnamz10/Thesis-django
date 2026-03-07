import requests
from config import API_BASE_URL, API_KEY


class APIClient:
    def __init__(self):
        self.base_url = API_BASE_URL.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

    def verify_student(self, qr_data: dict):
        scanned_id = (qr_data.get("id") or "").strip()
        scanned_name = (qr_data.get("name") or "").strip()
        scanned_course = (qr_data.get("course") or "").strip()
        gate = (qr_data.get("gate") or "Main Gate").strip()
        qr_payload = qr_data.get("qr_payload") or ""

        if not scanned_id:
            return {
                "status": "denied",
                "student": None,
                "reason": "missing_id",
                "mismatches": {},
            }

        payload = {
            "id": scanned_id,
            "name": scanned_name,
            "course": scanned_course,
            "gate": gate,
            "qr_payload": qr_payload,
        }

        try:
            response = requests.post(
                f"{self.base_url}/students/{scanned_id}/verify",
                headers=self.headers,
                json=payload,
                timeout=5,
            )

            if response.status_code in (200, 404, 400):
                data = response.json()
                return {
                    "status": data.get("status", "denied"),
                    "student": data.get("student"),
                    "reason": data.get("reason", "api_error"),
                    "mismatches": data.get("mismatches", {}),
                }

            print(f"API Error {response.status_code}: {response.text}")
            return {
                "status": "denied",
                "student": None,
                "reason": "api_error",
                "mismatches": {},
            }

        except requests.exceptions.RequestException as e:
            print("API connection error:", e)
            return {
                "status": "denied",
                "student": None,
                "reason": "network_error",
                "mismatches": {},
            }

    def close(self):
        pass