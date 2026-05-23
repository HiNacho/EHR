from django.db import models
from django.conf import settings
import uuid

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Patient(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    linked_user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='patient_profile')
    hospital_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    full_name = models.CharField(max_length=200)
    age = models.PositiveIntegerField()
    sex = models.CharField(max_length=1, choices=GENDER_CHOICES)
    departments = models.ManyToManyField(Department, related_name="patients", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.hospital_id})"

class Admission(models.Model):
    STATUS_CHOICES = (
        ('ADMITTED', 'Admitted'),
        ('DISCHARGED', 'Discharged'),
        ('TRANSFERRED', 'Transferred'),
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='admissions')
    date_admitted = models.DateTimeField(auto_now_add=True)
    ward = models.CharField(max_length=50)
    bed_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ADMITTED')

    def __str__(self):
        return f"{self.patient.full_name} - {self.ward} {self.bed_number}"

class Vitals(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='vitals')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='recorded_vitals')
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    temperature = models.DecimalField(max_digits=5, decimal_places=2, help_text="Celsius")
    pulse = models.PositiveIntegerField(help_text="BPM")
    blood_pressure = models.CharField(max_length=20, help_text="Systolic/Diastolic e.g. 120/80")
    respiratory_rate = models.PositiveIntegerField(help_text="Breaths per min")
    oxygen_saturation = models.PositiveIntegerField(help_text="Percentage %")

    def __str__(self):
        return f"Vitals for {self.patient.full_name} at {self.recorded_at}"
