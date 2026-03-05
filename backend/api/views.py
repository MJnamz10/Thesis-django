from rest_framework import viewsets
from .models import Student
from .serializers import StudentSerializer # Update this import

class StudentViewSet(viewsets.ModelViewSet): # Renamed for clarity
    queryset = Student.objects.all()         # Update this to Student
    serializer_class = StudentSerializer     # Update this to StudentSerializer