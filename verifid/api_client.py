import psycopg2
import requests
from psycopg2.extras import RealDictCursor
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


class APIClient:
    def __init__(self):
        self.conn = None
        self.base_url = "http://127.0.0.1:8000"

        try:
            self.conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                cursor_factory=RealDictCursor,
            )
            print("Connected to PostgreSQL successfully.")
        except psycopg2.Error as e:
            print("PostgreSQL connection error:", e)

    def send_heartbeat(self):
        try:
            response = requests.post(
                f"{self.base_url}/api/verifid/scanner-heartbeat",
                json={
                    "scanner_name": "main_window",
                    "gate": "Main Gate",
                },
                timeout=2,
            )
            print("Heartbeat response:", response.status_code, response.text)
        except Exception as e:
            print("Heartbeat error:", e)

    def send_offline(self):
        try:
            response = requests.post(
                f"{self.base_url}/api/verifid/scanner-offline",
                json={"scanner_name": "main_window"},
                timeout=2,
            )
            print("Offline notify response:", response.status_code, response.text)
        except Exception as e:
            print("Offline notify error:", e)

    def save_scan_log(self, qr_data: dict, result: dict):
        if self.conn is None:
            print("Cannot save scan log: database not connected")
            return

        try:
            student = result.get("student")
            status = result.get("status", "invalid")
            reason = result.get("reason")

            id_number = qr_data.get("id") or None
            full_name = None
            program = None
            year_level = None

            if student:
                id_number = student.get("id_number") or id_number
                full_name = student.get("full_name")
                program = student.get("program")
                year_level = (
                    str(student.get("year_level"))
                    if student.get("year_level") is not None
                    else None
                )

            gate = qr_data.get("gate", "Main Gate")
            qr_payload = qr_data.get("qr_payload", "")

            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO verifid_scanlog
                    (id_number, full_name, program, year_level, status, reason, gate, qr_payload, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        id_number,
                        full_name,
                        program,
                        year_level,
                        status,
                        reason,
                        gate,
                        qr_payload,
                    ),
                )
            self.conn.commit()
            print("Scan log saved.")

        except psycopg2.Error as e:
            print("Failed to save scan log:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass

    def get_today_logs(self, limit=200):
        if self.conn is None:
            print("Cannot load logs: database not connected")
            return []

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_number, full_name, program, year_level, status, created_at
                    FROM verifid_scanlog
                    WHERE DATE(created_at AT TIME ZONE 'Asia/Manila') = DATE(NOW() AT TIME ZONE 'Asia/Manila')
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
                print("Fetched today logs:", rows)
                return rows or []
        except psycopg2.Error as e:
            print("Failed to fetch today's logs:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass
            return []

    def get_recent_logs(self, limit=50):
        if self.conn is None:
            print("Cannot load logs: database not connected")
            return []

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_number, full_name, program, year_level, status, created_at
                    FROM verifid_scanlog
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
                return rows or []
        except psycopg2.Error as e:
            print("Failed to fetch recent logs:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass
            return []

    def get_student_by_id(self, student_id):
        if self.conn is None:
            print("Cannot fetch student: database not connected")
            return None

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT *
                    FROM api_student
                    WHERE id_number = %s
                    LIMIT 1
                    """,
                    (student_id,),
                )
                student = cur.fetchone()
                return dict(student) if student else None
        except psycopg2.Error as e:
            print("Failed to fetch student by id:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass
            return None

    def verify_student(self, qr_data: dict):
        scanned_id = (qr_data.get("id") or "").strip()

        if not scanned_id:
            result = {
                "status": "invalid",
                "student": None,
                "reason": "missing_id",
                "mismatches": {},
            }
            self.save_scan_log(qr_data, result)
            return result

        if self.conn is None:
            result = {
                "status": "invalid",
                "student": None,
                "reason": "database_not_connected",
                "mismatches": {},
            }
            return result

        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT *
                    FROM api_student
                    WHERE id_number = %s
                    LIMIT 1
                    """,
                    (scanned_id,),
                )
                student = cur.fetchone()

            if not student:
                result = {
                    "status": "invalid",
                    "student": None,
                    "reason": "student_not_found",
                    "mismatches": {},
                }
                self.save_scan_log(qr_data, result)
                return result
            
            student_dict = dict(student)
            validity = str(student_dict.get("validity_status") or "").strip().lower()

            if validity == "verified":
                status = "verified"
            elif validity == "not_verified":
                status = "not_verified"
            else:
                status = "invalid"

            result = {
                "status": status,
                "student": student_dict,
                "reason": None,
                "mismatches": {},
            }
            self.save_scan_log(qr_data, result)
            return result

        except psycopg2.Error as e:
            print("Database query error:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass

            result = {
                "status": "invalid",
                "student": None,
                "reason": "database_error",
                "mismatches": {},
            }
            self.save_scan_log(qr_data, result)
            return result

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None