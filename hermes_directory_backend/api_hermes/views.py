from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.middleware.csrf import get_token

from .models import Office
from .serializers import OfficeSerializer
from .permissions import IsAdminOrReadOnly
from .auth_cookies import set_auth_cookies, clear_auth_cookies


def enforce_csrf(request):
    check = CSRFCheck(lambda r: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise PermissionDenied(f"CSRF Failed: {reason}")


class OfficeViewSet(ModelViewSet):
    queryset = Office.objects.all().order_by('tower', 'number')
    serializer_class = OfficeSerializer
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['number', 'owner', 'tower', 'phone', 'website']
    ordering_fields = ['number', 'owner', 'tower']
    filterset_fields = ['tower']


# ========================
#   ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
# ========================

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        })


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        response_data = {"detail": "Login successful"}
        if settings.AUTH_RETURN_TOKENS_IN_BODY:
            response_data.update({"access": access, "refresh": refresh})

        response = Response(response_data, status=status.HTTP_200_OK)
        set_auth_cookies(response, access, refresh)
        get_token(request)  # ensure csrftoken exists for browser clients
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        body_refresh = request.data.get("refresh")
        cookie_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)

        if cookie_refresh:
            enforce_csrf(request)

        refresh_token = body_refresh or cookie_refresh
        if not refresh_token:
            return Response({"detail": "Refresh token is required"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        access = serializer.validated_data["access"]
        rotated_refresh = serializer.validated_data.get("refresh", refresh_token)

        response_data = {"detail": "Token refreshed"}
        if settings.AUTH_RETURN_TOKENS_IN_BODY:
            response_data.update({"access": access})
            if "refresh" in serializer.validated_data:
                response_data["refresh"] = rotated_refresh

        response = Response(response_data, status=status.HTTP_200_OK)
        set_auth_cookies(response, access, rotated_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        body_refresh = request.data.get("refresh")
        cookie_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)

        if cookie_refresh:
            enforce_csrf(request)

        refresh_token = body_refresh or cookie_refresh

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, AttributeError):
                pass

        response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


class CsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = get_token(request)
        return Response({"csrfToken": token}, status=status.HTTP_200_OK)


def _check_database():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {"status": "ok"}
    except Exception:
        return {"status": "failed"}


def _check_cache():
    probe_key = "health:cache:probe"
    probe_value = "ok"
    try:
        cache.set(probe_key, probe_value, timeout=5)
        observed = cache.get(probe_key)
        cache.delete(probe_key)
        if observed == probe_value:
            return {"status": "ok"}
        return {"status": "failed", "detail": "cache probe mismatch"}
    except Exception:
        return {"status": "failed"}


def _check_storage():
    try:
        default_storage.exists("")
        return {"status": "ok"}
    except Exception:
        return {"status": "failed"}


def _base_health_payload(checks, overall_status):
    return {
        "status": overall_status,
        "service": getattr(settings, "HEALTH_SERVICE_NAME", "backend-api"),
        "timestamp": timezone.now().isoformat(),
        "checks": checks,
    }


class HealthLiveView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        payload = _base_health_payload(checks={}, overall_status="ok")
        return Response(payload, status=status.HTTP_200_OK)


class HealthReadyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        checks = {
            "database": _check_database(),
            "cache": _check_cache(),  # optional dependency by default
        }

        if checks["database"]["status"] != "ok":
            payload = _base_health_payload(checks=checks, overall_status="not_ready")
            return Response(payload, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if checks["cache"]["status"] != "ok":
            payload = _base_health_payload(checks=checks, overall_status="degraded")
            return Response(payload, status=status.HTTP_200_OK)

        payload = _base_health_payload(checks=checks, overall_status="ok")
        return Response(payload, status=status.HTTP_200_OK)


class HealthDeepView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        checks = {
            "database": _check_database(),
            "cache": _check_cache(),
            "storage": _check_storage(),
        }

        if checks["database"]["status"] != "ok":
            payload = _base_health_payload(checks=checks, overall_status="not_ready")
            return Response(payload, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        non_critical_ok = checks["cache"]["status"] == "ok" and checks["storage"]["status"] == "ok"
        if not non_critical_ok:
            payload = _base_health_payload(checks=checks, overall_status="degraded")
            return Response(payload, status=status.HTTP_200_OK)

        payload = _base_health_payload(checks=checks, overall_status="ok")
        return Response(payload, status=status.HTTP_200_OK)


class HealthView(HealthReadyView):
    """
    Backward-compatible alias for readiness probes.
    """
