from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import MessageThread, Message
from .serializers import MessageThreadSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class MessageThreadViewSet(viewsets.ModelViewSet):
    queryset = MessageThread.objects.all()
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.filter(participants=user)
        
        # If the user is STAFF, legally automatically inject any active Staff Group Chats!
        if getattr(user, 'role', '') != 'PATIENT':
            group_chats = self.queryset.filter(is_group_chat=True)
            return (qs | group_chats).distinct().order_by('-updated_at')
            
        return qs.order_by('-updated_at')

    @action(detail=True, methods=['POST'])
    def add_message(self, request, pk=None):
        thread = self.get_object()
        content = request.data.get('content')
        if not content:
            return Response({"error": "Content required"}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = Message.objects.create(thread=thread, sender=request.user, content=content)
        msg.read_by.add(request.user)
        thread.save() # bump updated_at
        return Response(MessageSerializer(msg, context={'request': request}).data)

    @action(detail=True, methods=['GET'])
    def messages(self, request, pk=None):
        thread = self.get_object()
        msgs = thread.messages.all().order_by('timestamp')
        
        # Mark unread messages as read
        unread = msgs.exclude(read_by=request.user)
        for m in unread:
            m.read_by.add(request.user)
            
        return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['GET'])
    def unread_count(self, request):
        count = Message.objects.filter(thread__participants=request.user).exclude(read_by=request.user).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=['GET'])
    def directory(self, request):
        user = request.user
        if getattr(user, 'role', '') == 'PATIENT':
            # PATIENT: Only see DOCTORS
            users = User.objects.filter(role='DOCTOR')
        else:
            # STAFF: See all non-patient STAFF (Doctors, Nurses, Admins)
            users = User.objects.exclude(role='PATIENT').exclude(id=user.id)
            
        data = [{"id": u.id, "email": u.email, "role": u.role, "name": u.first_name or u.email} for u in users]
        return Response(data)

    @action(detail=False, methods=['POST'])
    def start_thread(self, request):
        recipient_id = request.data.get('recipient_id')
        subject = request.data.get('subject', 'No Subject')
        content = request.data.get('content')

        if not recipient_id or not content:
            return Response({"error": "recipient_id and content are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "Recipient not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            thread = MessageThread.objects.create(subject=subject)
            thread.participants.add(request.user, recipient)
            
            msg = Message.objects.create(thread=thread, sender=request.user, content=content)
            msg.read_by.add(request.user)

        return Response(MessageThreadSerializer(thread, context={'request': request}).data, status=status.HTTP_201_CREATED)
