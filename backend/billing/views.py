from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Invoice
from .serializers import InvoiceSerializer
from django.utils import timezone

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        return self.queryset

    @action(detail=True, methods=['POST'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        role = getattr(request.user, 'role', '')
        if role not in ['ADMIN', 'DOCTOR']:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        invoice.status = 'PAID'
        invoice.paid_at = timezone.now()
        invoice.save()
        return Response({"status": "invoice paid"})
