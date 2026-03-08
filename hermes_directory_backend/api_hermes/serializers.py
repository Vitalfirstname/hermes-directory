import re
from django.core.validators import URLValidator

from rest_framework import serializers

from .models import Office


SAFE_URL_VALIDATOR = URLValidator(schemes=["http", "https"])

PHONE_PATTERN = re.compile(r"^\+?[0-9\s().-]{5,20}$")


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = ["id", "tower", "number", "owner", "phone", "website"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "tower": {"required": False, "allow_blank": True, "allow_null": True},
            "number": {"required": True, "allow_blank": False, "allow_null": False},
            "owner": {"required": True, "allow_blank": False, "allow_null": False},
            "phone": {"required": False, "allow_blank": True, "allow_null": True},
            "website": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def validate_website(self, value):
        if value in (None, ""):
            return value

        SAFE_URL_VALIDATOR(value)
        return value

    def validate_phone(self, value):
        if value in (None, ""):
            return value

        if not PHONE_PATTERN.fullmatch(value):
            raise serializers.ValidationError(
                "Phone format is invalid. Use digits, spaces and +()- symbols."
            )

        return value
