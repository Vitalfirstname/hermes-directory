from django.core.exceptions import ValidationError
from django.db import models

from .office_validation import (
    normalize_office_value,
    validate_office_number,
    validate_office_website,
)


class Office(models.Model):
    tower = models.CharField(max_length=1, choices=[("A", "A"), ("B", "B")])
    number = models.CharField(max_length=2, validators=[validate_office_number])
    owner = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, default="")
    website = models.CharField(
        max_length=200,
        blank=True,
        default="",
        validators=[validate_office_website],
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(tower__in=("A", "B")),
                name="office_tower_a_or_b",
            ),
        ]

    def clean_fields(self, exclude=None):
        excluded = set(exclude or ())
        errors = {}
        for name in ("tower", "number", "owner", "phone", "website"):
            if name in excluded:
                continue
            try:
                setattr(self, name, normalize_office_value(name, getattr(self, name)))
            except ValidationError as exc:
                errors[name] = exc.error_list
        try:
            super().clean_fields(exclude=excluded | errors.keys())
        except ValidationError as exc:
            exc.update_error_dict(errors)
        if errors:
            raise ValidationError(errors)

    def __str__(self):
            return (f'Офис:\u00A0{self.tower}-{self.number}'
            f'\u00A0{self.owner}\u00A0тел:'
            f'\u00A0{self.phone or ""}\u00A0сайт:{self.website or ""}')
