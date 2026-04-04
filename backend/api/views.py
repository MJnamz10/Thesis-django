from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from .models import Student
from .serializers import StudentSerializer 
import csv
import io
from django.http import HttpResponse
User = get_user_model()

class StudentViewSet(viewsets.ModelViewSet): 
    queryset = Student.objects.all()         
    serializer_class = StudentSerializer     

@api_view(['POST'])
@permission_classes([AllowAny]) 
def forgot_password(request):
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"message": "If that email exists, a reset link was sent."})

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"
    
    subject = "VerifID - Password Reset Request"
    message = f"Hello,\n\nYou requested a password reset for your VerifID Admin account.\n\nClick the link below to set a new password:\n{reset_link}\n\nIf you did not request this, please ignore this email."
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER, 
        [user.email],             
        fail_silently=False,
    )
    
    return Response({"message": "Password reset email sent."})

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    uid_b64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    try:
        # 1. Decode the user ID and find the user
        uid = force_bytes(urlsafe_base64_decode(uid_b64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    # 2. Verify the token is real and belongs to this user
    if user is not None and default_token_generator.check_token(user, token):
        # 3. Save the new password securely!
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset successfully."})
    else:
        return Response(
            {"error": "This reset link is invalid or has expired."}, 
            status=400
        )
    
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_admin_password(request):
    password = request.data.get('password')
    
    # Grab the main superuser account (your admin account)
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if admin_user and admin_user.check_password(password):
        return Response({"message": "Password verified."})
    else:
        return Response({"error": "Incorrect password."}, status=403)
    
@api_view(['POST'])
@permission_classes([AllowAny]) # You can change this later to restrict access
def bulk_import_students(request):
    # 1. Check if a file was actually sent
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded."}, status=400)

    csv_file = request.FILES['file']
    
    # 2. Make sure it's a CSV
    if not csv_file.name.endswith('.csv'):
        return Response({"error": "Please upload a valid .csv file."}, status=400)

    try:
        # 3. Read the file into memory
        file_data = csv_file.read().decode('utf-8')
        io_string = io.StringIO(file_data)
        
        # DictReader automatically uses the first row of your CSV as the column names!
        reader = csv.DictReader(io_string)
        
        success_count = 0
        error_list = []

       # 4. Loop through every row in the Excel/CSV file
        for row_num, row in enumerate(reader, start=1):
            try:
                # 1. Translate the Year Level
                raw_year = row.get('year_level', '').strip()
                year_mapping = {
                    "1st Year": "1", "2nd Year": "2", 
                    "3rd Year": "3", "4th Year": "4", "5th Year": "5"
                }
                clean_year = year_mapping.get(raw_year, raw_year)

                # 👉 2. NEW: Clean the Validity Status! 
                # This turns "Not Verified" into "NOT_VERIFIED" automatically
                raw_status = row.get('validity_status', '').strip().upper()
                clean_status = raw_status.replace(" ", "_")
                
                # If the cell was completely blank, default to NOT_VERIFIED
                if not clean_status:
                    clean_status = 'NOT_VERIFIED'

                # 3. Save to database
                student, created = Student.objects.update_or_create(
                    id_number=row.get('id_number', '').strip(),
                    defaults={
                        'full_name': row.get('full_name', '').strip(),
                        'program': row.get('program', '').strip(),
                        'year_level': clean_year, 
                        'gender': row.get('gender', '').strip() or None,
                        'age': row.get('age', '').strip() or None,
                        'validity_status': clean_status # <--- Use the cleaned status here!
                    }
                )
                
                if created:
                    success_count += 1
                    
            except Exception as e:
                error_list.append(f"Row {row_num} failed: {str(e)}")

        return Response({
            "message": f"Successfully imported {success_count} students.",
            "errors": error_list
        })

    except Exception as e:
        return Response({"error": f"Error processing file: {str(e)}"}, status=500)
    
@api_view(['GET'])
@permission_classes([AllowAny]) 
def export_students_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="VerifID_Student_Records.csv"'

    writer = csv.writer(response)

    # 1. We added 'Photo URL' and 'QR Code URL' to the very end of the header!
    writer.writerow(['ID Number', 'Full Name', 'Program', 'Year Level', 'Gender', 'Age', 'Validity Status', 'Photo URL', 'QR Code URL'])

    students = Student.objects.all()
    for student in students:
        # 2. Check if the image exists. If it does, build the full clickable link!
        photo_link = request.build_absolute_uri(student.photo.url) if student.photo else 'No Photo'
        qr_link = request.build_absolute_uri(student.qr_code.url) if student.qr_code else 'No QR'

        writer.writerow([
            student.id_number,
            student.full_name,
            student.program,
            student.year_level,
            student.gender if student.gender else 'N/A',
            student.age if student.age else 'N/A',
            student.validity_status,
            photo_link, # 👉 Added to the row
            qr_link     # 👉 Added to the row
        ])

    return response