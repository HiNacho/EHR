from django.db import models
from django.conf import settings
from patients.models import Patient

class Diagnosis(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='diagnoses')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagnoses_given')
    diagnosis_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Diagnosis for {self.patient.full_name} by {self.doctor.email}"

class ClinicalNotes(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='clinical_notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_notes')
    note_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note for {self.patient.full_name} by {self.author.email}"
