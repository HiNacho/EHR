from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        DOCTOR = "DOCTOR", "Doctor"
        NURSE = "NURSE", "Nurse"
        PATIENT = "PATIENT", "Patient"

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.PATIENT)
    email = models.EmailField(unique=True)

    # Allow login with email
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} - {self.get_role_display()}"
