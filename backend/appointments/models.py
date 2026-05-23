from django.db import models
from django.conf import settings
from patients.models import Patient, Department

class DoctorAvailability(models.Model):
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.doctor.email} - {self.get_day_of_week_display()} ({self.start_time} to {self.end_time})"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='appointments')
    date = models.DateField()
    time_slot = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True, null=True)
    is_telehealth = models.BooleanField(default=False)
    zoom_link = models.URLField(max_length=500, blank=True, null=True)
    telehealth_metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.full_name} with {self.doctor.email} on {self.date} at {self.time_slot}"
