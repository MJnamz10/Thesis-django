from rest_framework import serializers
from .models import Student # Update this import to match your model name and location

class StudentSerializer(serializers.ModelSerializer): # Renamed for clarity
    class Meta:
        model = Student # Update this to match your model name
        fields = '__all__'