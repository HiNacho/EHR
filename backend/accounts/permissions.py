from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsDoctorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')

class IsNurseUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'NURSE')

class IsPatientUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PATIENT')

class IsDoctorOrNurse(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['DOCTOR', 'NURSE'])

class ReadOnlyUnlessStaff(permissions.BasePermission):
    """
    Patients can read, but only Staff (Admin, Doctor, Nurse) can write.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') != 'PATIENT')

class ReadOnlyUnlessDoctor(permissions.BasePermission):
    """
    Anyone authenticated can read (with query isolation), but only Doctors can write.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'DOCTOR')
