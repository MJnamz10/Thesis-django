from django.urls import path
from . import views

urlpatterns = [
    path("api/verifid/verify", views.verify_student, name="verify_student"),
    path("api/verifid/dashboard-data", views.dashboard_data, name="dashboard_data"),
    path("api/verifid/scanner-heartbeat", views.scanner_heartbeat, name="scanner_heartbeat"),
    path("api/verifid/scanner-offline", views.scanner_offline, name="scanner_offline"),
]  