from django.db import models
from django.utils import timezone

class ScanLog(models.Model):
    id_number = models.CharField(max_length=50, null=True, blank=True)
    full_name = models.CharField(max_length=150, null=True, blank=True)
    program = models.CharField(max_length=100, null=True, blank=True)
    year_level = models.CharField(max_length=10, null=True, blank=True)

    status = models.CharField(max_length=20)
    reason = models.CharField(max_length=100, null=True, blank=True)

    gate = models.CharField(max_length=50)
    qr_payload = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id_number} - {self.status}"
    
class ScannerStatus(models.Model):
    scanner_name = models.CharField(max_length=100, unique=True, default="main_window")
    gate = models.CharField(max_length=50, default="Main Gate")
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.scanner_name} - {'online' if self.is_online else 'offline'}"