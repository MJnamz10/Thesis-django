import requests

BASE_URL = "http://127.0.0.1:8000/api"
HEADERS = {
    "Authorization": "Bearer USTP_Gate_Scanner_Key_9x8B2vL5y",
    "Content-Type": "application/json"
}

print("--- TESTING GET (Verify Student) ---")
# Testing the student we just created in the shell
response = requests.get(f"{BASE_URL}/students/12345/verify", headers=HEADERS)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}\n")

print("--- TESTING POST (Log Scan) ---")
log_data = {
    "student_id": "12345",
    "full_name": "Jane Doe",
    "program": "Computer Engineering",
    "year_level": "4th Year",
    "qr_payload": "Name: Jane Doe\nID: 12345",
    "gate": "Main Gate",
    "status": "granted",
    "reason": "ok"
}

post_response = requests.post(f"{BASE_URL}/scans", json=log_data, headers=HEADERS)
print(f"Status Code: {post_response.status_code}")
print(f"Response: {post_response.json()}")