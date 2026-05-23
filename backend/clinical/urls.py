from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiagnosisViewSet, ClinicalNotesViewSet

router = DefaultRouter()
router.register(r'diagnoses', DiagnosisViewSet)
router.register(r'notes', ClinicalNotesViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
