from django.db import models

class Student(models.Model):
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    program = models.CharField(max_length=100, blank=True, null=True)
    year_level = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"

class ScanLog(models.Model):
    student_id = models.CharField(max_length=50, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    program = models.CharField(max_length=100, blank=True, null=True)
    year_level = models.CharField(max_length=50, blank=True, null=True)
    qr_payload = models.TextField(blank=True, null=True)
    scanned_at = models.DateTimeField(auto_now_add=True)
    gate = models.CharField(max_length=100, default='Main Gate')
    status = models.CharField(max_length=50)
    reason = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.student_id} - {self.status}"