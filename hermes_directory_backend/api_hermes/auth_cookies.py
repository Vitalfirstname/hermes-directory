from django.conf import settings
from rest_framework_simplejwt.settings import api_settings


def set_auth_cookies(response, access_token: str | None, refresh_token: str | None):
    common = {
        "secure": settings.AUTH_COOKIE_SECURE,
        "httponly": True,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
        "domain": settings.AUTH_COOKIE_DOMAIN,
    }

    if access_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS,
            value=access_token,
            path=settings.AUTH_COOKIE_PATH,
            max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
            **common,
        )

    if refresh_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value=refresh_token,
            path=settings.AUTH_COOKIE_REFRESH_PATH,
            max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
            **common,
        )


def clear_auth_cookies(response):
    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS,
        path=settings.AUTH_COOKIE_PATH,
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH,
        path=settings.AUTH_COOKIE_REFRESH_PATH,
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
