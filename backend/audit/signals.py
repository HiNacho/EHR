from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from clinical.models import Diagnosis, ClinicalNotes
from appointments.models import Appointment
from patients.models import Vitals
from ehr_backend.middleware import get_current_user

def log_action(sender, instance, action, **kwargs):
    user = get_current_user()
    if user and user.is_authenticated:
        target = f"{sender.__name__} (ID: {instance.pk})"
        AuditLog.objects.create(
            user=user,
            action=action,
            target_object=target
        )

@receiver(post_save, sender=Diagnosis)
@receiver(post_save, sender=ClinicalNotes)
@receiver(post_save, sender=Appointment)
@receiver(post_save, sender=Vitals)
def log_create_update(sender, instance, created, **kwargs):
    action = "Created" if created else "Updated"
    log_action(sender, instance, action)

@receiver(post_delete, sender=Diagnosis)
@receiver(post_delete, sender=ClinicalNotes)
@receiver(post_delete, sender=Appointment)
@receiver(post_delete, sender=Vitals)
def log_delete(sender, instance, **kwargs):
    log_action(sender, instance, "Deleted")
