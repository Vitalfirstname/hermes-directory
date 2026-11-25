from collections.abc import Mapping

from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import Office
from .office_validation import normalize_office_value


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = ["id", "tower", "number", "owner", "phone", "website"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "number": {"trim_whitespace": False},
        }

    def to_internal_value(self, data):
        if not isinstance(data, Mapping):
            return super().to_internal_value(data)

        normalized = data.copy()
        errors = {}
        for name in self.Meta.fields:
            if name == "id" or name not in data:
                continue
            try:
                normalized[name] = normalize_office_value(name, data[name])
            except ValidationError as exc:
                errors[name] = exc.messages

        try:
            values = super().to_internal_value(normalized)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({**exc.detail, **errors}) from exc
        if errors:
            raise serializers.ValidationError(errors)
        return values
