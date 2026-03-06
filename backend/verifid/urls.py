from django.urls import path
from . import views

urlpatterns = [
    path('api/students/<str:sid>/verify', views.verify_student),
    path('api/scans', views.log_scan),
]