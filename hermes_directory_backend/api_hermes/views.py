from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Office
from .serializers import OfficeSerializer
from .permissions import IsAdminOrReadOnly


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
