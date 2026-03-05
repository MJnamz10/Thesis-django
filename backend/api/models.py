from django.db import models


class Student(models.Model):

    class YearLevel(models.TextChoices):
        FIRST = "1", "1st Year"
        SECOND = "2", "2nd Year"
        THIRD = "3", "3rd Year"
        FOURTH = "4", "4th Year"
        FIFTH = "5", "5th Year"

    class ValidityStatus(models.TextChoices):
        NOT_VERIFIED = "NOT_VERIFIED", "Not Verified"
        VERIFIED = "VERIFIED", "Verified"
        INVALID = "INVALID", "Invalid"

    id_number = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=150)
    program = models.CharField(max_length=100)
    year_level = models.CharField(max_length=1, choices=YearLevel.choices)
    validity_status = models.CharField(
        max_length=20,
        choices=ValidityStatus.choices,
        default=ValidityStatus.NOT_VERIFIED
    )

    # For now simple text field (can upgrade to ImageField later)
    photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id_number} - {self.full_name}"