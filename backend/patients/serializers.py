from rest_framework import serializers
from .models import Department, Patient, Admission, Vitals
from accounts.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    department_ids = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='departments', many=True, write_only=True, required=False
    )
    linked_user_detail = UserSerializer(source='linked_user', read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'

class AdmissionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = Admission
        fields = '__all__'

class VitalsSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.email', read_only=True)

    class Meta:
        model = Vitals
        fields = '__all__'
        read_only_fields = ('recorded_by',)
