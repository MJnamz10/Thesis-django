from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from api.models import Student
from .models import ScanLog

EXPECTED_API_KEY = getattr(settings, "GATE_API_KEY", "USTP_Gate_Scanner_Key_9x8B2vL5y")


def is_authorized(request):
    auth_header = request.headers.get("Authorization")
    return auth_header == f"Bearer {EXPECTED_API_KEY}"


@api_view(["POST"])
def verify_student(request):
    if not is_authorized(request):
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    scanned_id = request.data.get("id")
    scanned_name = request.data.get("name")
    scanned_course = request.data.get("course")
    gate = request.data.get("gate", "Main Gate")
    qr_payload = request.data.get("qr_payload", "")

    if not scanned_id:
        return Response(
            {
                "status": "denied",
                "reason": "missing_id"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        student = Student.objects.get(id_number=scanned_id)

        student_data = {
            "id": student.id_number,
            "name": student.full_name,
            "program": student.program,
            "year": student.get_year_level_display(),
            "validity_status": student.validity_status,
            "photo": student.photo.url if student.photo else None,
        }

        mismatches = {}

        if scanned_name and scanned_name.strip().lower() != student.full_name.strip().lower():
            mismatches["name"] = {
                "scanned": scanned_name,
                "masterlist": student.full_name
            }

        if scanned_course and scanned_course.strip().lower() != student.program.strip().lower():
            mismatches["course"] = {
                "scanned": scanned_course,
                "masterlist": student.program
            }

        if student.validity_status != Student.ValidityStatus.VERIFIED:
            scan = ScanLog.objects.create(
                student_id=student.id_number,
                full_name=student.full_name,
                program=student.program,
                year_level=student.get_year_level_display(),
                qr_payload=qr_payload,
                gate=gate,
                status="denied",
                reason="unverified_status",
            )

            return Response(
                {
                    "status": "denied",
                    "reason": "unverified_status",
                    "student": student_data,
                    "mismatches": mismatches,
                    "scan_id": scan.id,
                },
                status=status.HTTP_200_OK
            )

        scan = ScanLog.objects.create(
            student_id=student.id_number,
            full_name=student.full_name,
            program=student.program,
            year_level=student.get_year_level_display(),
            qr_payload=qr_payload,
            gate=gate,
            status="granted",
            reason="ok",
        )

        return Response(
            {
                "status": "granted",
                "reason": "ok",
                "student": student_data,
                "mismatches": mismatches,
                "scan_id": scan.id,
            },
            status=status.HTTP_200_OK
        )

    except Student.DoesNotExist:
        scan = ScanLog.objects.create(
            student_id=scanned_id,
            full_name=scanned_name,
            program=scanned_course,
            qr_payload=qr_payload,
            gate=gate,
            status="denied",
            reason="not_found",
        )

        return Response(
            {
                "status": "denied",
                "reason": "not_found",
                "student": None,
                "scan_id": scan.id,
            },
            status=status.HTTP_404_NOT_FOUND
        )