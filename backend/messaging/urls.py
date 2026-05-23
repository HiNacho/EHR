from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageThreadViewSet

router = DefaultRouter()
router.register(r'threads', MessageThreadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
