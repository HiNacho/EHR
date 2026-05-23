from rest_framework import viewsets, permissions
from .models import AuditLog
from rest_framework import serializers
from django.urls import path, include
from rest_framework.routers import DefaultRouter

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'ADMIN')

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
