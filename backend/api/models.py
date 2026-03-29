import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
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
    gender = models.CharField(max_length=15, blank=True, null=True) 
    age = models.PositiveIntegerField(blank=True, null=True)  
    validity_status = models.CharField(
        max_length=20,
        choices=ValidityStatus.choices,
        default=ValidityStatus.NOT_VERIFIED
    )

    photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    
    # 1. New field to store the generated QR code image
    qr_code = models.ImageField(upload_to='student_qrs/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id_number} - {self.full_name}"

    # 2. Override the save method to generate the QR automatically
 # 2. Override the save method to generate the QR automatically
    def save(self, *args, **kwargs):
        if not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # --- THIS IS THE LINE YOU CHANGE ---
            # Using \t creates a "tab" space between the values. 
            # I also added .upper() to the name to match your exact example!
            qr_data = f"{self.full_name.upper()}\t{self.id_number}\t{self.program}" 
            # -----------------------------------
            
            qr.add_data(qr_data) 
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer, format='PNG')
            
            file_name = f'qr_{self.id_number}.png'
            self.qr_code.save(file_name, ContentFile(buffer.getvalue()), save=False)

        super().save(*args, **kwargs)