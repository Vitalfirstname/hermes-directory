from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.request import Request
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework.views import APIView

from .exceptions import DomainError, api_exception_handler
from .models import Office


class ErrorEnvelopeAssertionsMixin:
    def assert_error_envelope(self, response, expected_status, expected_code):
        self.assertEqual(response.status_code, expected_status)
        self.assertIn("error", response.data)
        error = response.data["error"]
        self.assertEqual(error.get("code"), expected_code)
        self.assertIn("message", error)
        self.assertIn("details", error)
        self.assertIn("trace_id", error)


class OfficePermissionsTests(ErrorEnvelopeAssertionsMixin, APITestCase):
    url = "/api/offices/"

    def setUp(self):
        self.user_model = get_user_model()
        self.office = Office.objects.create(number="11", owner="Initial Owner", tower="A")

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
            "number": "22",
            "owner": "New Owner",
            "tower": "B",
            "phone": "+375 (29) 123-45-67",
            "website": "https://example.com",
        }

    def test_anonymous_get_offices_returns_200(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_anonymous_post_office_is_rejected(self):
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assert_error_envelope(response, status.HTTP_401_UNAUTHORIZED, "not_authenticated")

    def test_anonymous_retrieve_office_returns_200(self):
        response = self.client.get(f"{self.url}{self.office.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.office.id)
        self.assertEqual(response.data["number"], self.office.number)

    def test_authenticated_non_staff_post_office_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assert_error_envelope(response, status.HTTP_403_FORBIDDEN, "permission_denied")

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
        self.assert_error_envelope(response, status.HTTP_403_FORBIDDEN, "permission_denied")

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
        self.assert_error_envelope(response, status.HTTP_403_FORBIDDEN, "permission_denied")

    def test_staff_delete_office_returns_204(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(f"{self.url}{self.office.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_not_found_endpoint_returns_unified_envelope(self):
        response = self.client.get(f"{self.url}999999/")
        self.assert_error_envelope(response, status.HTTP_404_NOT_FOUND, "not_found")


class AuthRoutesTests(ErrorEnvelopeAssertionsMixin, APITestCase):
    login_url = "/api/auth/login/"
    refresh_url = "/api/auth/refresh/"
    logout_url = "/api/auth/logout/"
    csrf_url = "/api/auth/csrf/"
    me_url = "/api/auth/me/"

    def setUp(self):
        self.user_model = get_user_model()
        self.user_model.objects.create_user(
            username="auth_user",
            password="auth-password-1",
            is_staff=False,
        )

    def test_login_route_sets_http_only_auth_cookies(self):
        response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.cookies)
        self.assertTrue(response.cookies["access_token"]["httponly"])
        self.assertEqual(response.cookies["access_token"]["samesite"], "Lax")
        self.assertIn("refresh_token", response.cookies)
        self.assertTrue(response.cookies["refresh_token"]["httponly"])
        self.assertEqual(response.cookies["refresh_token"]["samesite"], "Lax")
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_login_with_invalid_credentials_returns_authentication_failed_envelope(self):
        response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "wrong-password"},
            format="json",
        )
        self.assert_error_envelope(response, status.HTTP_401_UNAUTHORIZED, "authentication_failed")

    def test_refresh_route_uses_cookie_when_body_token_absent(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        response = csrf_client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        csrf_token = csrf_client.cookies.get("csrftoken").value
        refresh_response = csrf_client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", refresh_response.cookies)

    def test_me_route_works_with_access_cookie(self):
        response = self.client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], "auth_user")
        self.assertIn("is_staff", me_response.data)
        self.assertIn("is_superuser", me_response.data)

    def test_me_route_returns_401_without_auth(self):
        response = self.client.get(self.me_url)
        self.assert_error_envelope(response, status.HTTP_401_UNAUTHORIZED, "not_authenticated")

    def test_logout_clears_auth_cookies(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        response = csrf_client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        csrf_token = csrf_client.cookies.get("csrftoken").value
        logout_response = csrf_client.post(
            self.logout_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", logout_response.cookies)
        self.assertEqual(logout_response.cookies["access_token"].value, "")
        self.assertIn("refresh_token", logout_response.cookies)
        self.assertEqual(logout_response.cookies["refresh_token"].value, "")

    def test_refresh_with_cookie_without_csrf_returns_403(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        response = csrf_client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        refresh_response = csrf_client.post(self.refresh_url, {}, format="json")
        self.assert_error_envelope(refresh_response, status.HTTP_403_FORBIDDEN, "permission_denied")

    def test_logout_with_cookie_without_csrf_returns_403(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        response = csrf_client.post(
            self.login_url,
            {"username": "auth_user", "password": "auth-password-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        logout_response = csrf_client.post(self.logout_url, {}, format="json")
        self.assert_error_envelope(logout_response, status.HTTP_403_FORBIDDEN, "permission_denied")

    def test_cookie_authenticated_unsafe_request_requires_csrf(self):
        self.user_model.objects.create_user(
            username="auth_staff",
            password="auth-password-2",
            is_staff=True,
        )
        login_response = self.client.post(
            self.login_url,
            {"username": "auth_staff", "password": "auth-password-2"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.cookies = login_response.cookies
        payload = {"number": "71", "owner": "No CSRF", "tower": "A"}
        response = csrf_client.post("/api/offices/", payload, format="json")
        self.assert_error_envelope(response, status.HTTP_403_FORBIDDEN, "permission_denied")

    def test_cookie_authenticated_unsafe_request_with_csrf_is_allowed(self):
        self.user_model.objects.create_user(
            username="auth_staff2",
            password="auth-password-3",
            is_staff=True,
        )
        login_response = self.client.post(
            self.login_url,
            {"username": "auth_staff2", "password": "auth-password-3"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.cookies = login_response.cookies
        csrf_response = csrf_client.get(self.csrf_url)
        csrf_token = csrf_response.data["csrfToken"]
        payload = {"number": "72", "owner": "With CSRF", "tower": "A"}
        response = csrf_client.post(
            "/api/offices/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class OfficeValidationTests(ErrorEnvelopeAssertionsMixin, APITestCase):
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
            "number": "51",
            "owner": "Valid Owner LLC",
            "tower": "A",
            "phone": "+375 29 123-45-67",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_post_normalizes_values_before_saving(self):
        response = self.client.post(
            self.url,
            {"tower": "b", "number": "01", "owner": "  ООО «Brand» — A, 2.  "},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        office = Office.objects.get(pk=response.data["id"])
        self.assertEqual((office.tower, office.number, office.owner), ("B", "01", "ООО «Brand» — A, 2."))
        self.assertEqual((office.phone, office.website), ("", ""))

    def test_post_rejects_invalid_field_values(self):
        cases = {
            "tower": (None, "", "C", "А", " A"),
            "number": (None, "", "123", "０１", "1a", "1 ", " 1", 1),
            "owner": (None, "   ", "Name\n", "A\tB", "A\u2028B", "a" * 101),
            "phone": (
                "+123456789", "+375 (21) 123-45-67", "+375 (29) 123-45",
                "+375291234567 +375441234567", "phone +375291234567",
            ),
            "website": ("ftp://example.com", "example.com example.org", "example.com/" + "x" * 181),
        }
        for field, invalid_values in cases.items():
            for value in invalid_values:
                with self.subTest(field=field, value=value):
                    payload = {"tower": "A", "number": "1", "owner": "Owner", field: value}
                    response = self.client.post(self.url, payload, format="json")
                    self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
                    self.assertIn(field, response.data["error"]["details"])
        self.assertFalse(Office.objects.exists())

    def test_put_requires_tower_and_normalizes_supplied_values(self):
        office = Office.objects.create(tower="A", number="1", owner="Owner")
        url = f"{self.url}{office.pk}/"
        payload = {"number": "02", "owner": " Updated ", "phone": "+375171234567"}
        response = self.client.put(url, payload, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("tower", response.data["error"]["details"])
        response = self.client.put(url, {**payload, "tower": "b", "website": "http://example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        office.refresh_from_db()
        self.assertEqual((office.tower, office.number, office.owner), ("B", "02", "Updated"))
        self.assertEqual(office.phone, "+375 (17) 123-45-67")
        self.assertEqual(office.website, "http://example.com")

    def test_patch_rejects_invalid_number_and_can_clear_optional_fields(self):
        office = Office.objects.create(
            tower="A", number="1", owner="Owner",
            phone="+375 (44) 123-45-67", website="https://example.com",
        )
        url = f"{self.url}{office.pk}/"
        response = self.client.patch(url, {"number": "1 "}, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("number", response.data["error"]["details"])
        response = self.client.patch(url, {"phone": None, "website": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        office.refresh_from_db()
        self.assertEqual((office.tower, office.number, office.owner), ("A", "1", "Owner"))
        self.assertEqual((office.phone, office.website), ("", ""))

    def test_model_validation_uses_same_normalization(self):
        office = Office(tower="a", number="05", owner=" Owner ", phone="+375331234567", website="example.com")
        office.full_clean()
        self.assertEqual((office.tower, office.number, office.owner), ("A", "05", "Owner"))
        self.assertEqual((office.phone, office.website), ("+375 (33) 123-45-67", "https://example.com"))

    def test_database_rejects_invalid_tower_but_allows_duplicate_offices(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Office.objects.create(tower="C", number="1", owner="Owner")
        Office.objects.create(tower="A", number="1", owner="First")
        Office.objects.create(tower="A", number="1", owner="Second")
        self.assertEqual(Office.objects.filter(tower="A", number="1").count(), 2)

    def test_owner_length_is_checked_after_trimming(self):
        owner = "a" * 99 + "Z"
        payload = {"tower": "A", "number": "1", "owner": f" {owner} "}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Office.objects.get(pk=response.data["id"]).owner, owner)

        response = self.client.post(self.url, {**payload, "owner": f" {owner}X "}, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("owner", response.data["error"]["details"])

    def test_website_rejects_invalid_raw_hosts_and_ports(self):
        for website in (
            "127.1", "https://0x7f.1", "https://0177.0.0.1", "https://%31%32%37.0.0.1",
            "https:///example.org", "https://example.org\\path", "example.org:",
            "example.org:0", "example.org:65536", "https://[::1]:65536",
        ):
            with self.subTest(website=website):
                payload = {"tower": "A", "number": "1", "owner": "Owner", "website": website}
                response = self.client.post(self.url, payload, format="json")
                self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
                self.assertIn("website", response.data["error"]["details"])
        self.assertFalse(Office.objects.exists())

    def test_website_accepts_ipv4_ipv6_and_port_boundaries(self):
        for website, expected in (
            ("127.0.0.1:1", "https://127.0.0.1:1"),
            ("https://[::1]:65535", "https://[::1]:65535"),
            ("example.org:65535", "https://example.org:65535"),
        ):
            with self.subTest(website=website):
                payload = {"tower": "A", "number": "1", "owner": "Owner", "website": website}
                response = self.client.post(self.url, payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(response.data["website"], expected)

    def test_website_without_scheme_gets_https(self):
        payload = {
            "number": "52",
            "owner": "Invalid Website Inc",
            "tower": "B",
            "phone": "+375291234567",
            "website": "example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["website"], "https://example.com")

    def test_invalid_website_unsafe_scheme_is_rejected(self):
        payload = {
            "number": "53",
            "owner": "Unsafe Scheme Ltd",
            "tower": "B",
            "phone": "+375291234567",
            "website": "javascript:alert(1)",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("website", response.data["error"]["details"])

    def test_invalid_phone_is_rejected(self):
        payload = {
            "number": "54",
            "owner": "Invalid Phone Co",
            "tower": "A",
            "phone": "call-me-maybe",
            "website": "https://example.org",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("phone", response.data["error"]["details"])

    def test_missing_required_owner_is_rejected(self):
        payload = {
            "number": "55",
            "tower": "A",
            "phone": "+375291234567",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("owner", response.data["error"]["details"])

    def test_blank_required_number_is_rejected(self):
        payload = {
            "number": "",
            "owner": "Blank Number Ltd",
            "tower": "A",
            "phone": "+375291234567",
            "website": "https://example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "validation_error")
        self.assertIn("number", response.data["error"]["details"])

    def test_malformed_json_returns_parse_error_envelope(self):
        response = self.client.generic(
            "POST",
            self.url,
            '{"owner":"Broken",',
            content_type="application/json",
        )
        self.assert_error_envelope(response, status.HTTP_400_BAD_REQUEST, "parse_error")


class HealthEndpointTests(APITestCase):
    def test_liveness_endpoint_returns_200(self):
        response = self.client.get("/api/health/live/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertIn("service", response.data)
        self.assertIn("timestamp", response.data)
        self.assertEqual(response.data.get("checks"), {})

    def test_readiness_endpoint_returns_200_when_dependencies_are_ok(self):
        response = self.client.get("/api/health/ready/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "ok")
        self.assertIn("database", response.data["checks"])
        self.assertIn("cache", response.data["checks"])
        self.assertEqual(response.data["checks"]["database"]["status"], "ok")

    def test_health_alias_maps_to_readiness(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("checks", response.data)
        self.assertIn("database", response.data["checks"])

    @patch("api_hermes.views._check_database", return_value={"status": "failed"})
    def test_readiness_returns_503_when_database_fails(self, _mock_db):
        response = self.client.get("/api/health/ready/")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "not_ready")
        self.assertEqual(response.data["checks"]["database"]["status"], "failed")

    @patch("api_hermes.views._check_cache", return_value={"status": "failed"})
    def test_readiness_returns_degraded_when_optional_cache_fails(self, _mock_cache):
        response = self.client.get("/api/health/ready/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "degraded")
        self.assertEqual(response.data["checks"]["cache"]["status"], "failed")

    @patch("api_hermes.views._check_storage", return_value={"status": "failed"})
    def test_deep_health_reports_degraded_when_storage_fails(self, _mock_storage):
        response = self.client.get("/api/health/deep/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "degraded")
        self.assertEqual(response.data["checks"]["storage"]["status"], "failed")


class VersionedRoutingTests(APITestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.user_model.objects.create_user(
            username="versioned_auth_user",
            password="versioned-pass-1",
            is_staff=False,
        )
        Office.objects.create(number="81", owner="Versioned Owner", tower="A")

    def test_versioned_offices_endpoint_is_accessible(self):
        response = self.client.get("/api/v1/offices/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_legacy_offices_endpoint_remains_accessible(self):
        response = self.client.get("/api/offices/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_version_namespace_reverse_resolution(self):
        self.assertEqual(reverse("v1:health"), "/api/v1/health/")
        self.assertEqual(reverse("v1:auth_me"), "/api/v1/auth/me/")
        self.assertEqual(reverse("v1:token_obtain_pair"), "/api/v1/auth/login/")

    def test_versioned_auth_login_endpoint_is_accessible(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "versioned_auth_user", "password": "versioned-pass-1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.cookies)

    def test_swagger_ui_is_available_after_versioning(self):
        response = self.client.get("/swagger/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PaginationStrategyTests(ErrorEnvelopeAssertionsMixin, APITestCase):
    offices_url = "/api/offices/"

    def setUp(self):
        for i in range(1, 131):
            Office.objects.create(
                number=f"{i % 100:02d}",
                owner=f"Owner {i:03d}",
                tower="A" if i % 2 else "B",
            )

    def test_default_pagination_is_applied_to_list_endpoint(self):
        response = self.client.get(self.offices_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 130)
        self.assertEqual(len(response.data["results"]), 20)

    def test_page_size_query_param_changes_page_size_within_limit(self):
        response = self.client.get(f"{self.offices_url}?page_size=5")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_next_and_previous_links_are_present(self):
        response = self.client.get(f"{self.offices_url}?page=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["previous"])
        self.assertIsNotNone(response.data["next"])

    def test_invalid_page_parameter_returns_not_found_envelope(self):
        response = self.client.get(f"{self.offices_url}?page=invalid")
        self.assert_error_envelope(response, status.HTTP_404_NOT_FOUND, "not_found")

    def test_max_page_size_is_enforced(self):
        response = self.client.get(f"{self.offices_url}?page_size=1000")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 100)

    def test_health_endpoint_is_intentionally_not_paginated(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("results", response.data)
        self.assertIn("status", response.data)


class ExceptionHandlerStrategyTests(ErrorEnvelopeAssertionsMixin, APITestCase):
    def test_domain_exception_uses_unified_envelope(self):
        class DomainView(APIView):
            def get(self, request):
                raise DomainError("Owner already exists.")

        request = APIRequestFactory().get("/fake/")
        response = DomainView.as_view()(request)
        self.assert_error_envelope(response, status.HTTP_409_CONFLICT, "domain_error")
        self.assertEqual(response.data["error"]["message"], "Owner already exists.")

    def test_unhandled_exception_returns_safe_500_envelope(self):
        class CrashView(APIView):
            def get(self, request):
                raise ValueError("sensitive debug details")

        request = APIRequestFactory().get("/fake/")
        response = CrashView.as_view()(request)
        self.assert_error_envelope(response, status.HTTP_500_INTERNAL_SERVER_ERROR, "server_error")
        self.assertEqual(response.data["error"]["message"], "Internal server error.")
        self.assertIsNone(response.data["error"]["details"])

    def test_handler_includes_trace_id_when_request_header_provided(self):
        raw_request = APIRequestFactory().get("/fake/", HTTP_X_REQUEST_ID="trace-123")
        response = api_exception_handler(ParseError("bad payload"), {"request": Request(raw_request)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["trace_id"], "trace-123")


