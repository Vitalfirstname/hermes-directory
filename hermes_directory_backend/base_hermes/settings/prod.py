import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403


DEBUG = env_bool("DEBUG", False)  # noqa: F405
if DEBUG:
    raise ImproperlyConfigured("DEBUG must be False in production settings")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY is required for production settings")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")  # noqa: F405
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS is required for production settings")

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", False)  # noqa: F405
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")  # noqa: F405
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")  # noqa: F405
