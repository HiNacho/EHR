from rest_framework import viewsets, permissions
from .models import Department, Patient, Admission, Vitals
from .serializers import DepartmentSerializer, PatientSerializer, AdmissionSerializer, VitalsSerializer
from accounts.permissions import ReadOnlyUnlessStaff

class DoctorOrAdminWriteOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        role = getattr(request.user, 'role', '')
        return role in ['DOCTOR', 'ADMIN']

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated] # Maybe Admin only for writing, read for all

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated, ReadOnlyUnlessStaff]

    def get_queryset(self):
        # Patients can only see themselves unless they are staff
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(linked_user=user)
        return self.queryset

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [permissions.IsAuthenticated, DoctorOrAdminWriteOnly]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        return self.queryset

class VitalsViewSet(viewsets.ModelViewSet):
    queryset = Vitals.objects.all()
    serializer_class = VitalsSerializer
    permission_classes = [permissions.IsAuthenticated, ReadOnlyUnlessStaff]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
