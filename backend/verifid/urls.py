from django.urls import path
from . import views

urlpatterns = [
    path("api/verifid/verify", views.verify_student, name="verify_student"),
    path("api/verifid/dashboard-data", views.dashboard_data, name="dashboard_data"),
]  