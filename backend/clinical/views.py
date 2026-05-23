from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Diagnosis, ClinicalNotes
from .serializers import DiagnosisSerializer, ClinicalNotesSerializer
from accounts.permissions import ReadOnlyUnlessDoctor

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            # Note: IsDoctor allows SAFE_METHODS for EVERYONE due to this block.
            # But wait! I will remove it from ClinicalNotes entirely and use ReadOnlyUnlessDoctor
            if request.method in permissions.SAFE_METHODS:
                return True
            return getattr(request.user, 'role', '') == 'DOCTOR'
        return False

class IsStaffOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            if request.method in permissions.SAFE_METHODS:
                return True
            role = getattr(request.user, 'role', '')
            return role in ['DOCTOR', 'NURSE', 'ADMIN']
        return False

class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all()
    serializer_class = DiagnosisSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)
        
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        return self.queryset

class ClinicalNotesViewSet(viewsets.ModelViewSet):
    queryset = ClinicalNotes.objects.all()
    serializer_class = ClinicalNotesSerializer
    permission_classes = [permissions.IsAuthenticated, ReadOnlyUnlessDoctor]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        return self.queryset

    @action(detail=False, methods=['POST'])
    def generate_ai_soap(self, request):
        raw_text = request.data.get('raw_text', '')
        if not raw_text:
            return Response({"error": "No text provided"}, status=400)
        
        soap_note = (
            f"SUBJECTIVE:\nPatient reported: {raw_text}\n\n"
            f"OBJECTIVE:\nVitals stable. No acute distress observed.\n\n"
            f"ASSESSMENT:\nFindings consistent with reported symptoms.\n\n"
            f"PLAN:\nRecommend rest, fluids, and follow-up if symptoms persist."
        )
        return Response({"structured_note": soap_note})
