from django.db import models
from patients.models import Patient
from django.conf import settings

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='issued_invoices')
    service_type = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Invoice {self.id} - {self.patient.full_name} - ${self.amount}"
