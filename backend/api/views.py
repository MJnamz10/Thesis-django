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