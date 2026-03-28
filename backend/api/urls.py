from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet
from . import views


router = DefaultRouter()
router.register(r'students', StudentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password-confirm/', views.reset_password_confirm, name='reset_password_confirm'),
    path('verify-admin-password/', views.verify_admin_password, name='verify_admin_password'),
]