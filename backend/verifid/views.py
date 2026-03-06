from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import Student, ScanLog

EXPECTED_API_KEY = getattr(settings, 'GATE_API_KEY', 'your_secure_gate_api_key')

def is_authorized(request):
    auth_header = request.headers.get('Authorization')
    return auth_header == f"Bearer {EXPECTED_API_KEY}"

@api_view(['GET'])
def verify_student(request, sid):
    if not is_authorized(request):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        student = Student.objects.get(student_id=sid)
        student_data = {
            "id": student.student_id,
            "name": student.full_name,
            "program": student.program or "",
            "year": student.year_level or "",
            "active": student.active
        }

        if not student.active:
            return Response({"status": "denied", "student": student_data, "reason": "inactive"}, status=status.HTTP_200_OK)
        
        return Response({"status": "granted", "student": student_data, "reason": "ok"}, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"status": "denied", "reason": "not_found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def log_scan(request):
    if not is_authorized(request):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    ScanLog.objects.create(
        student_id=data.get('student_id'),
        full_name=data.get('full_name'),
        program=data.get('program'),
        year_level=data.get('year_level'),
        qr_payload=data.get('qr_payload'),
        gate=data.get('gate', 'Main Gate'),
        status=data.get('status', 'unknown'),
        reason=data.get('reason')
    )
    
    return Response({"message": "Log saved"}, status=status.HTTP_201_CREATED)