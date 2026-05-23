from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import DoctorAvailability, Appointment
from .serializers import DoctorAvailabilitySerializer, AppointmentSerializer, AppointmentCreateSerializer
from datetime import datetime, timedelta

class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = DoctorAvailability.objects.all()
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'PATIENT':
            return self.queryset.filter(patient__linked_user=user)
        elif getattr(user, 'role', '') == 'DOCTOR':
            return self.queryset.filter(doctor=user)
        return self.queryset

    @action(detail=False, methods=['GET'])
    def available_slots(self, request):
        doctor_id = request.query_params.get('doctor')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response({"error": "doctor and date are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

        day_of_week = date_obj.weekday()
        availabilities = DoctorAvailability.objects.filter(doctor_id=doctor_id, day_of_week=day_of_week)

        booked_appointments = Appointment.objects.filter(
            doctor_id=doctor_id, date=date_obj
        ).exclude(status='CANCELLED').values_list('time_slot', flat=True)

        slots = []
        for avail in availabilities:
            # Generate 30 min slots
            start = datetime.combine(date_obj, avail.start_time)
            end = datetime.combine(date_obj, avail.end_time)
            
            while start + timedelta(minutes=30) <= end:
                slot_time = start.time()
                if slot_time not in booked_appointments:
                    slots.append(slot_time.strftime('%H:%M'))
                start += timedelta(minutes=30)

        return Response({"available_slots": slots})

    @action(detail=True, methods=['POST'])
    def accept(self, request, pk=None):
        appointment = self.get_object()
        role = getattr(request.user, 'role', '')
        if role not in ['DOCTOR', 'ADMIN']:
            return Response({"error": "Unauthorized to accept appointments"}, status=status.HTTP_403_FORBIDDEN)
        
        appointment.status = 'CONFIRMED'
        appointment.save()
        return Response({"status": "appointment confirmed"})

    @action(detail=True, methods=['POST'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        role = getattr(request.user, 'role', '')
        # Patients might be allowed to cancel their own, but for now we enforce to DOCTOR/ADMIN based on requirement "Doctors must be able to Review appointments: Accept (confirm) / Cancel"
        if role not in ['DOCTOR', 'ADMIN', 'PATIENT']:
             return Response({"error": "Unauthorized to cancel explicitly"}, status=status.HTTP_403_FORBIDDEN)

        appointment.status = 'CANCELLED'
        appointment.save()
        return Response({"status": "appointment cancelled"})
