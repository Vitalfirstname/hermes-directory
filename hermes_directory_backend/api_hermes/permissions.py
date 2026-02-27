from rest_framework.permissions import BasePermission, SAFE_METHODS

class OnlyReadForCool(BasePermission):
    def has_permission(self, request, view):
        # если юзер cool и это не GET/HEAD/OPTIONS — отказываем
        if request.user.username == "cool" and request.method not in SAFE_METHODS:
            return False
        return True

