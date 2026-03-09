from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OfficeViewSet,
    MeView,
    HealthView,
    HealthLiveView,
    HealthReadyView,
    HealthDeepView,
    LoginView,
    RefreshView,
    LogoutView,
    CsrfView,
)

app_name = "api"

router = DefaultRouter()
router.register(r'offices', OfficeViewSet, basename='office')

urlpatterns = [
    # CRUD по офисам
    path('', include(router.urls)),

    # JWT авторизация
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', RefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/csrf/', CsrfView.as_view(), name='auth_csrf'),

    # текущий пользователь
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('health/live/', HealthLiveView.as_view(), name='health_live'),
    path('health/ready/', HealthReadyView.as_view(), name='health_ready'),
    path('health/deep/', HealthDeepView.as_view(), name='health_deep'),
    path('health/', HealthView.as_view(), name='health'),
]
