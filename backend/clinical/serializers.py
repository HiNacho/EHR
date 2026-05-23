from rest_framework import serializers
from .models import Diagnosis, ClinicalNotes

class DiagnosisSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.email', read_only=True)

    class Meta:
        model = Diagnosis
        fields = '__all__'
        read_only_fields = ('doctor',)

class ClinicalNotesSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    author_name = serializers.CharField(source='author.email', read_only=True)

    class Meta:
        model = ClinicalNotes
        fields = '__all__'
        read_only_fields = ('author',)
