from django.urls import path
from . import views

urlpatterns = [
    path("api/verifid/verify", views.verify_student, name="verify_student"),
]