from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, PatientViewSet, AdmissionViewSet, VitalsViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'list', PatientViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'vitals', VitalsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
