from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/clinical/', include('clinical.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/messaging/', include('messaging.urls')),
]
