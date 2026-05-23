from rest_framework import serializers
from .models import DoctorAvailability, Appointment
from accounts.serializers import UserSerializer

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('status',) # Only admin or doctor can update status typically, handle in views

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('patient', 'doctor', 'department', 'date', 'time_slot', 'reason')

    def validate(self, data):
        # Prevent double booking
        doctor = data['doctor']
        date = data['date']
        time_slot = data['time_slot']
        
        if Appointment.objects.filter(doctor=doctor, date=date, time_slot=time_slot).exclude(status='CANCELLED').exists():
            raise serializers.ValidationError("This time slot is already booked for this doctor.")
        
        # Check if doctor is available on this day and time
        day_of_week = date.weekday()
        availabilities = DoctorAvailability.objects.filter(doctor=doctor, day_of_week=day_of_week)
        
        if not availabilities.exists():
            raise serializers.ValidationError("Doctor is not available on this day.")
            
        # Check against start and end times
        is_valid_time = False
        for avail in availabilities:
            if avail.start_time <= time_slot <= avail.end_time: # Simplistic check
                is_valid_time = True
                break
                
        if not is_valid_time:
            raise serializers.ValidationError("Time slot is outside of doctor's working hours.")
            
        return data
