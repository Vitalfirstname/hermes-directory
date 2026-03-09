from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework.permissions import SAFE_METHODS
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Supports both:
    1) Bearer token in Authorization header (for non-browser clients),
    2) HttpOnly access token cookie (for browser sessions).
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        self._enforce_csrf_if_needed(request)
        return (user, validated_token)

    def _enforce_csrf_if_needed(self, request):
        if request.method in SAFE_METHODS:
            return

        check = CSRFCheck(lambda r: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")
