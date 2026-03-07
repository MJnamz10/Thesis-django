from django.db import models

class ScanLog(models.Model):
    student_id = models.CharField(max_length=50, null=True, blank=True)
    full_name = models.CharField(max_length=150, null=True, blank=True)
    program = models.CharField(max_length=100, null=True, blank=True)
    year_level = models.CharField(max_length=50, null=True, blank=True)
    qr_payload = models.TextField()
    gate = models.CharField(max_length=50, default="Main Gate")
    status = models.CharField(max_length=20)
    reason = models.CharField(max_length=50, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_id} - {self.status}"