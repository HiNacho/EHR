from django.db.models.signals import post_save
from django.dispatch import receiver
from appointments.models import Appointment
from billing.models import Invoice
from .models import NotificationLog
import json

@receiver(post_save, sender=Appointment)
def send_appointment_notifications(sender, instance, created, **kwargs):
    if created:
        NotificationLog.objects.create(
            recipient_email=instance.patient.linked_user.email,
            subject="Appointment Confirmation",
            message_body=f"Your appointment with {instance.doctor.first_name} on {instance.date} at {instance.time_slot} is confirmed."
        )
    elif instance.status == 'CANCELLED':
        NotificationLog.objects.create(
            recipient_email=instance.patient.linked_user.email,
            subject="Appointment Cancelled",
            message_body=f"Your appointment on {instance.date} was cancelled."
        )

@receiver(post_save, sender=Invoice)
def send_invoice_notifications(sender, instance, created, **kwargs):
    if created:
        NotificationLog.objects.create(
            recipient_email=instance.patient.linked_user.email,
            subject="New Invoice Generated",
            message_body=f"A new invoice for ${instance.amount} ({instance.service_type}) has been posted to your account."
        )
