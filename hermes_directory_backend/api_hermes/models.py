from django.db import models
from django.core.validators import URLValidator


class Office(models.Model):
    tower = models.CharField(max_length=20, null=True, blank=True)
    number = models.CharField(max_length=20)
    owner = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, null=True, blank=True)
    website = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        validators=[URLValidator(schemes=["http", "https"])],
    )


    def __str__(self):
            return (f'Офис:\u00A0{self.tower}-{self.number}'
            f'\u00A0{self.owner}\u00A0тел:'
            f'\u00A0{self.phone or ""}\u00A0сайт:{self.website or ""}')
