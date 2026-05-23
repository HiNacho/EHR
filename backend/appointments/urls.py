from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorAvailabilityViewSet, AppointmentViewSet

router = DefaultRouter()
router.register(r'availability', DoctorAvailabilityViewSet)
router.register(r'list', AppointmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
