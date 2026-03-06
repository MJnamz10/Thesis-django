import requests
from config import API_BASE_URL, API_KEY

class APIClient:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

    def verify_student(self, sid: str):
        sid = (sid or "").strip()
        if not sid:
            return "denied", None, "missing_id"

        try:
            response = requests.get(
                f"{self.base_url}/students/{sid}/verify",
                headers=self.headers,
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("status", "denied"), data.get("student"), data.get("reason", "ok")

            elif response.status_code == 404:
                return "denied", None, "not_found"
            else:
                print(f"API Error {response.status_code}: {response.text}")
                return "denied", None, "api_error"

        except requests.exceptions.RequestException as e:
            print("API connection error:", e)
            return "denied", None, "network_error"

    def log_scan(self, sid: str, name: str, program: str, year: str, payload: str, status: str, reason: str, gate: str = "Main Gate"):
        payload_data = {
            "student_id": sid,
            "full_name": name,
            "program": program,
            "year_level": year,
            "qr_payload": payload,
            "gate": gate,
            "status": status,
            "reason": reason
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/scans",
                json=payload_data,
                headers=self.headers,
                timeout=5
            )
            if response.status_code not in (200, 201):
                print(f"Failed to log scan. API responded with {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            print("Failed to log scan due to network error:", e)

    def close(self):
        pass