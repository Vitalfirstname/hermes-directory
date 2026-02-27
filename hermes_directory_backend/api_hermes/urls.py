from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import OfficeViewSet, MeView

router = DefaultRouter()
router.register(r'offices', OfficeViewSet, basename='office')

urlpatterns = [
    # CRUD по офисам
    path('', include(router.urls)),

    # JWT авторизация
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # текущий пользователь
    path('auth/me/', MeView.as_view(), name='auth_me'),
]
