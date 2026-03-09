import logging
from collections.abc import Mapping

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    ParseError,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


logger = logging.getLogger(__name__)


class DomainError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "domain_error"
    default_detail = _("Domain rule violation.")


def _extract_trace_id(request):
    if request is None:
        return None
    return (
        getattr(request, "trace_id", None)
        or request.META.get("HTTP_X_REQUEST_ID")
        or request.META.get("HTTP_X_CORRELATION_ID")
    )


def _normalize_message_and_details(data, default_message):
    if isinstance(data, Mapping):
        detail = data.get("detail")
        if detail is not None:
            return str(detail), data
        return default_message, data
    return str(data) if data is not None else default_message, data


def _error_meta(exc, response):
    if isinstance(exc, Http404):
        return "not_found", _("Requested resource was not found.")
    if isinstance(exc, DjangoPermissionDenied):
        return "permission_denied", _("You do not have permission to perform this action.")
    if isinstance(exc, ValidationError):
        return "validation_error", _("Request validation failed.")
    if isinstance(exc, NotAuthenticated):
        return "not_authenticated", _("Authentication credentials were not provided.")
    if isinstance(exc, AuthenticationFailed):
        return "authentication_failed", _("Authentication failed.")
    if isinstance(exc, PermissionDenied):
        return "permission_denied", _("You do not have permission to perform this action.")
    if isinstance(exc, NotFound):
        return "not_found", _("Requested resource was not found.")
    if isinstance(exc, ParseError):
        return "parse_error", _("Malformed request payload.")
    if isinstance(exc, Throttled):
        return "throttled", _("Request was throttled.")
    if isinstance(exc, DomainError):
        return exc.default_code, str(exc.detail)
    if isinstance(exc, APIException):
        return getattr(exc, "default_code", "api_error"), _("Request failed.")
    if response is not None and response.status_code >= 500:
        return "server_error", _("Internal server error.")
    return "server_error", _("Internal server error.")


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    request = context.get("request")
    trace_id = _extract_trace_id(request)

    if response is None:
        logger.exception("Unhandled API exception", exc_info=exc)
        payload = {
            "error": {
                "code": "server_error",
                "message": "Internal server error.",
                "details": None,
                "trace_id": trace_id,
            }
        }
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    code, default_message = _error_meta(exc, response)
    if isinstance(exc, AuthenticationFailed):
        response.status_code = status.HTTP_401_UNAUTHORIZED
    details = response.data
    message, normalized_details = _normalize_message_and_details(details, str(default_message))

    if response.status_code >= 500:
        # Avoid exposing internals on server errors.
        message = "Internal server error."
        normalized_details = None

    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": normalized_details,
            "trace_id": trace_id,
        }
    }
    response.data = payload
    return response
