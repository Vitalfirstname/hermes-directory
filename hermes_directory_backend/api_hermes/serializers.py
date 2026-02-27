from .models import Office
from rest_framework import serializers

class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        # fields = ('number','owner','area')
        fields = '__all__'
