from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from api.models import Student
from .models import ScanLog, ScannerStatus,  QRRawScan

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

    QRRawScan.objects.create(
        id_number=scanned_id or "",
        full_name=scanned_name or "",
        program=scanned_course or "",
    )

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
    

def get_student_photo_url(student):
    if not student:
        return None

    photo = getattr(student, "photo", None)
    if photo:
        try:
            return photo.url
        except Exception:
            return None

    return None

@api_view(["GET"])
def dashboard_data(request):
    today = timezone.localdate()
    now = timezone.now()
    stale_after = now - timedelta(seconds=10)

    scanner = ScannerStatus.objects.filter(scanner_name="main_window").first()
    scanner_online = bool(
        scanner and scanner.is_online and scanner.last_seen >= stale_after
    )

    today_logs = ScanLog.objects.filter(created_at__date=today).order_by("-created_at")

    if scanner_online:
        # Same source as main_window.py
        recent_logs = today_logs[:200]

        total_students = (
            today_logs
            .values("id_number")
            .exclude(id_number__isnull=True)
            .exclude(id_number="")
            .distinct()
            .count()
        )

        #granted_today = 0
        #denied_today = 0
        traffic_today = today_logs.count()

        verifiedToday = (today_logs.filter(status="verified").values("id_number").distinct().count()) # Count unique verified IDs
        unverifiedToday = today_logs.filter(status="not_verified").values("id_number").distinct().count() # Count unique not verified IDs
        #invalid_id = today_logs.filter(status="invalid").values("id_number").distinct().count() # Count unique invalid IDs

        recent_scans = []

        for log in recent_logs:
            student = Student.objects.filter(id_number=log.id_number).first()

            #if student and student.validity_status == Student.ValidityStatus.VERIFIED:
            #    validity = "VERIFIED"
            #else:
            #    validity = "NOT VERIFIED"

            if not log.id_number or log.status == "invalid":
                validity = "INVALID"
            elif log.status == "verified":
                validity = "VERIFIED"
            elif log.status == "not_verified":
                validity = "NOT VERIFIED"

            local_created_at = timezone.localtime(log.created_at)
            photo_url = get_student_photo_url(student)

            recent_scans.append({
                "id": log.id,
                "timestamp": local_created_at.strftime("%I:%M:%S %p").lstrip("0"),
                "id_number": log.id_number or "",
                "full_name": log.full_name or "",
                "program": log.program or "",
                "year_level": log.year_level or "",
                "validity": validity,
                "status": log.status,
                "reason": log.reason or "",
                "gate": log.gate,
                "qr_payload": log.qr_payload,
                "created_at": local_created_at.isoformat(),
                "photo": photo_url,

            })
    else:
        total_students = 0
        #granted_today = 0
        #denied_today = 0
        verifiedToday = 0
        unverifiedToday = 0
        #invalid_id = 0
        traffic_today = 0
        recent_scans = []

    return Response({
        "scannerOnline": scanner_online,
        "stats": {
            "totalStudents": total_students,
            "verifiedToday": verifiedToday,
            "unverifiedToday": unverifiedToday,
            "trafficToday": traffic_today,
        },
        "recentScans": recent_scans,
    })

@api_view(["POST"])
def scanner_heartbeat(request):
    scanner_name = request.data.get("scanner_name", "main_window")
    gate = request.data.get("gate", "Main Gate")

    scanner, _ = ScannerStatus.objects.get_or_create(
        scanner_name=scanner_name,
        defaults={"gate": gate}
    )

    scanner.gate = gate
    scanner.is_online = True
    scanner.last_seen = timezone.now()
    scanner.save()

    return Response({"message": "heartbeat received"})

@api_view(["POST"])
def scanner_offline(request):
    scanner_name = request.data.get("scanner_name", "main_window")

    try:
        scanner = ScannerStatus.objects.get(scanner_name=scanner_name)
        scanner.is_online = False
        scanner.last_seen = timezone.now()
        scanner.save()
    except ScannerStatus.DoesNotExist:
        pass

    return Response({"message": "scanner marked offline"})

@api_view(["GET"])
def all_logs(request):
    logs = ScanLog.objects.all().order_by("-created_at")[:500]  # limit optional

    data = []
    for log in logs:

        student = Student.objects.filter(id_number=log.id_number).first()

        #if student and student.validity_status == Student.ValidityStatus.VERIFIED:
        #    status_label = "VERIFIED"
        #else:
        #    status_label = "NOT VERIFIED"

        photo_url = get_student_photo_url(student)

        local_created_at = timezone.localtime(log.created_at)

        data.append({
            "id": log.id,
            "timestamp": log.created_at.strftime("%I:%M:%S %p").lstrip("0"),
            "created_at": local_created_at.isoformat(),
            "id_number": log.id_number or "",
            "full_name": log.full_name or "",
            "program": log.program or "",
            "year_level": log.year_level or "",
            "status": "VERIFIED" if log.status == "verified" else ("NOT VERIFIED" if log.status == "not_verified" else "INVALID"),#log.status,#status_label,
            "reason": log.reason or "",
            "photo": photo_url,
        })

    return Response(data)