from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Office


class OfficePermissionsTests(APITestCase):
    url = "/api/offices/"

    def setUp(self):
        self.user_model = get_user_model()
        self.office = Office.objects.create(number="101", owner="Initial Owner", tower="A")

        self.regular_user = self.user_model.objects.create_user(
            username="regular_user",
            password="strong-password-1",
            is_staff=False,
        )
        self.staff_user = self.user_model.objects.create_user(
            username="staff_user",
            password="strong-password-2",
            is_staff=True,
        )

        self.valid_payload = {
            "number": "202",
            "owner": "New Owner",
            "tower": "B",
            "phone": "+10000000000",
            "website": "https://example.com",
        }

    def test_anonymous_get_offices_returns_200(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_anonymous_post_office_is_rejected(self):
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )

    def test_anonymous_retrieve_office_returns_200(self):
        response = self.client.get(f"{self.url}{self.office.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.office.id)
        self.assertEqual(response.data["number"], self.office.number)

    def test_authenticated_non_staff_post_office_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_post_office_returns_201(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_authenticated_non_staff_patch_office_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"{self.url}{self.office.id}/",
            {"owner": "Updated By Regular"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_patch_office_returns_200(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(
            f"{self.url}{self.office.id}/",
            {"owner": "Updated By Staff"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["owner"], "Updated By Staff")
        self.office.refresh_from_db()
        self.assertEqual(self.office.owner, "Updated By Staff")

    def test_authenticated_non_staff_delete_office_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(f"{self.url}{self.office.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_delete_office_returns_204(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(f"{self.url}{self.office.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class AuthRoutesTests(APITestCase):
    login_url = "/api/auth/login/"
    refresh_url = "/api/auth/refresh/"

    def setUp(self):
        self.user_model = get_user_model()
        self.user_model.objects.create_user(
            username="auth_user",
            password="auth-password-1",
            is_staff=False,
        )

    def test_login_route_returns_access_and_refresh(self):
        response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_refresh_route_returns_new_access(self):
        login_response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        refresh_token = login_response.data["refresh"]

        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

    def test_me_route_happy_path_returns_current_user(self):
        login_response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        access_token = login_response.data["access"]

        me_response = self.client.get(
            "/api/auth/me/",
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], "auth_user")
        self.assertIn("is_staff", me_response.data)
        self.assertIn("is_superuser", me_response.data)


class OfficeValidationTests(APITestCase):
    url = "/api/offices/"

    def setUp(self):
        self.user_model = get_user_model()
        self.staff_user = self.user_model.objects.create_user(
            username="validation_staff",
            password="strong-password-3",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.staff_user)

    def test_valid_payload_is_created(self):
        payload = {
            "number": "501",
            "owner": "Valid Owner LLC",
            "tower": "A",
            "phone": "+375 29 123-45-67",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_invalid_website_without_scheme_is_rejected(self):
        payload = {
            "number": "502",
            "owner": "Invalid Website Inc",
            "tower": "B",
            "phone": "+375291234567",
            "website": "example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("website", response.data)

    def test_invalid_website_unsafe_scheme_is_rejected(self):
        payload = {
            "number": "503",
            "owner": "Unsafe Scheme Ltd",
            "tower": "C",
            "phone": "+375291234567",
            "website": "javascript:alert(1)",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("website", response.data)

    def test_invalid_phone_is_rejected(self):
        payload = {
            "number": "504",
            "owner": "Invalid Phone Co",
            "tower": "D",
            "phone": "call-me-maybe",
            "website": "https://example.org",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_missing_required_owner_is_rejected(self):
        payload = {
            "number": "505",
            "tower": "A",
            "phone": "+375291234567",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("owner", response.data)

    def test_blank_required_number_is_rejected(self):
        payload = {
            "number": "",
            "owner": "Blank Number Ltd",
            "tower": "A",
            "phone": "+375291234567",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("number", response.data)


class HealthEndpointTests(APITestCase):
    def test_health_endpoint_returns_200_with_database_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertEqual(response.data.get("database"), "ok")
