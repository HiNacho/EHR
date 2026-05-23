from django.db import models
from django.conf import settings

class MessageThread(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='message_threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    subject = models.CharField(max_length=255, blank=True)
    is_group_chat = models.BooleanField(default=False)

    def __str__(self):
        return f"Thread {self.id} - {self.subject}"

class Message(models.Model):
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)

    def __str__(self):
        return f"Message from {self.sender.email} at {self.timestamp}"
