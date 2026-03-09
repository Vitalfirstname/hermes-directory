"""
URL configuration for base_hermes project.
"""

from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from api_hermes import urls as api_urls

schema_view = get_schema_view(
    openapi.Info(
        title="Hermes API",
        default_version="v1",
        description="API documentation for Hermes Directory",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(("api_hermes.urls", "api"), namespace="v1")),
    # Legacy unversioned alias. Keep during migration window for existing clients.
    path("api/", include(api_urls.urlpatterns)),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
