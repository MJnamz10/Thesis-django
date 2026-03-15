import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


class APIClient:
    def __init__(self):
        self.conn = None
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

    def verify_student(self, qr_data: dict):
        scanned_id = (qr_data.get("id") or "").strip()

        if not scanned_id:
            return {
                "status": "denied",
                "student": None,
                "reason": "missing_id",
                "mismatches": {},
            }

        if self.conn is None:
            return {
                "status": "denied",
                "student": None,
                "reason": "database_not_connected",
                "mismatches": {},
            }

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
                return {
                    "status": "denied",
                    "student": None,
                    "reason": "student_not_found",
                    "mismatches": {},
                }

            return {
                "status": "verified",
                "student": dict(student),
                "reason": None,
                "mismatches": {},
            }

        except psycopg2.Error as e:
            print("Database query error:", e)
            try:
                self.conn.rollback()
            except Exception:
                pass

            return {
                "status": "denied",
                "student": None,
                "reason": "database_error",
                "mismatches": {},
            }

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None