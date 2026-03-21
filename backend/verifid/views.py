from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from django.db.models import Count

from api.models import Student
from .models import ScanLog

EXPECTED_API_KEY = getattr(settings, "GATE_API_KEY", "USTP_Gate_Scanner_Key_9x8B2vL5y")


def is_authorized(request):
    auth_header = request.headers.get("Authorization")
    return auth_header == f"Bearer {EXPECTED_API_KEY}"


@api_view(["POST"])
def verify_student(request):
    #if not is_authorized(request):
    #    return Response(
    #       {"error": "Unauthorized"},
    #       status=status.HTTP_401_UNAUTHORIZED
    #   )

    scanned_id = request.data.get("id")
    scanned_name = request.data.get("name", "")
    scanned_course = request.data.get("course", "")
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
            "id_number": student.id_number,
            "full_name": student.full_name,
            "program": student.program,
            "year_level": student.get_year_level_display(),
            "validity_status": student.validity_status,
            "photo": student.photo.url if getattr(student, "photo", None) else None,
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
                id_number=student.id_number,
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
            id_number=student.id_number,
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
            id_number=scanned_id,
            full_name=scanned_name,
            program=scanned_course,
            year_level="",
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
    
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone

from api.models import Student
from .models import ScanLog


from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models import Student
from .models import ScanLog


@api_view(["GET"])
def dashboard_data(request):
    today = timezone.localdate()

    total_students = Student.objects.count()

    today_logs = ScanLog.objects.filter(created_at__date=today).order_by("-created_at")
    recent_logs = ScanLog.objects.all().order_by("-created_at")[:10]

    granted_today = today_logs.filter(status="granted").count()
    denied_today = today_logs.filter(status="denied").count()
    traffic_today = today_logs.count()

    recent_scans = [
        {
            "id": log.id,
            "timestamp": log.created_at.strftime("%I:%M:%S %p").lstrip("0"),
            "id_number": log.id_number or "",
            "full_name": log.full_name or "",
            "program": log.program or "",
            "year_level": log.year_level or "",
            "status": log.status,
            "reason": log.reason or "",
            "gate": log.gate,
            "qr_payload": log.qr_payload,
            "created_at": log.created_at.isoformat(),
        }
        for log in recent_logs
    ]

    return Response({
        "stats": {
            "totalStudents": total_students,
            "grantedToday": granted_today,
            "deniedToday": denied_today,
            "trafficToday": traffic_today,
        },
        "recentScans": recent_scans,
    })