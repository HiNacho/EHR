from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.email', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = '__all__'
