from rest_framework import serializers
from .models import MessageThread, Message
from accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'read_by', 'timestamp')

    def get_is_me(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.sender

class MessageThreadSerializer(serializers.ModelSerializer):
    recent_message = serializers.SerializerMethodField()
    participant_emails = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = '__all__'

    def get_recent_message(self, obj):
        msg = obj.messages.order_by('-timestamp').first()
        return MessageSerializer(msg, context=self.context).data if msg else None

    def get_participant_emails(self, obj):
        return [p.email for p in obj.participants.all()]
