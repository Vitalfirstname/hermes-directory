from django.contrib.auth import get_user_model

from api_hermes.models import Office


User = get_user_model()

staff_user, _ = User.objects.get_or_create(
    username="e2e_staff",
    defaults={"is_staff": True, "is_superuser": False},
)
staff_user.is_staff = True
staff_user.is_superuser = False
staff_user.set_password("e2e_password_123")
staff_user.save(update_fields=["password", "is_staff", "is_superuser"])

Office.objects.get_or_create(
    number="91",
    tower="A",
    owner="E2E Smoke Resident",
    defaults={
        "phone": "+375 (29) 123-45-67",
        "website": "https://example.com",
    },
)
