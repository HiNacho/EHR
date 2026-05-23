from django.db import models

class NotificationLog(models.Model):
    recipient_email = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    message_body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=50, default='EMAIL')

    def __str__(self):
        return f"{self.type} to {self.recipient_email} - {self.subject}"
