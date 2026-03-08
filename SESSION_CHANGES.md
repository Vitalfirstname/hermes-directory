# Session Changes (2026-03-06)

## 1) Backend access control and auth routes
- Secured `OfficeViewSet`:
  - read: public
  - write (POST/PUT/PATCH/DELETE): staff/superuser only
- Added custom permission `IsAdminOrReadOnly`.
- Removed duplicate JWT routes from root `base_hermes/urls.py` (single auth source kept in `api_hermes/urls.py`).

Changed files:
- `hermes_directory_backend/api_hermes/permissions.py`
- `hermes_directory_backend/api_hermes/views.py`
- `hermes_directory_backend/base_hermes/urls.py`

## 2) Backend settings split + env config
- Replaced monolithic settings with:
  - `base_hermes/settings/base.py`
  - `base_hermes/settings/dev.py`
  - `base_hermes/settings/prod.py`
  - `base_hermes/settings/__init__.py`
- Deleted old `base_hermes/settings.py`.
- Switched default settings module to `base_hermes.settings.dev` in:
  - `manage.py`
  - `asgi.py`
  - `wsgi.py`
- Added env template:
  - `hermes_directory_backend/.env.example`
- Added `.gitignore` exception for `.env.example`.
- Added backend README note with settings profiles/env usage.

Changed files:
- `.gitignore`
- `hermes_directory_backend/manage.py`
- `hermes_directory_backend/base_hermes/asgi.py`
- `hermes_directory_backend/base_hermes/wsgi.py`
- `hermes_directory_backend/base_hermes/settings.py` (deleted)
- `hermes_directory_backend/base_hermes/settings/base.py` (new)
- `hermes_directory_backend/base_hermes/settings/dev.py` (new)
- `hermes_directory_backend/base_hermes/settings/prod.py` (new)
- `hermes_directory_backend/base_hermes/settings/__init__.py` (new)
- `hermes_directory_backend/.env.example` (new)
- `hermes_directory_backend/README.md.txt`

## 3) Frontend JWT auth flow hardening
- Login now stores both `access_token` and `refresh_token`.
- Axios response interceptor now:
  - on 401 tries `/api/auth/refresh/`
  - retries original request after refresh
  - logs out only when refresh fails/missing
- Added shared auth helpers in API module:
  - `getAccessToken`, `getRefreshToken`, `setAuthTokens`, `clearAuthTokens`, `logoutAndRedirect`
- Admin access guard changed:
  - no longer trusts token string presence
  - validates session via `/api/auth/me/`
  - requires `is_staff || is_superuser`
- Logout now clears both tokens.

Changed files:
- `hermes_directory_frontend/src/api/api.js`
- `hermes_directory_frontend/src/components/AdminFooter.jsx`
- `hermes_directory_frontend/src/pages/AdminLogin.jsx`
- `hermes_directory_frontend/src/pages/AdminPanel.jsx`
- `hermes_directory_frontend/src/components/OfficesTable.jsx`

## 4) Frontend offices data-flow cleanup
- Removed duplicate residents fetch.
- Single source of truth for residents list:
  - fetch in `Residents.jsx`
  - pass `offices/loading/error` into `ResidentsTable` props
- `ResidentsTable` is now presentational for data (keeps only UI state: search/sort/limit).

Changed files:
- `hermes_directory_frontend/src/pages/Residents.jsx`
- `hermes_directory_frontend/src/components/ResidentsTable/ResidentsTable.jsx`

## 5) Backend validation hardening (Office)
- Added model-level validator for `website` with safe schemes (`http`, `https`).
- Serializer contract made explicit:
  - removed `fields="__all__"`
  - explicit fields list
  - explicit read-only/required/allow_blank/allow_null
- Serializer-level validations:
  - `website`: safe URL validation
  - `phone`: regex validation

Changed files:
- `hermes_directory_backend/api_hermes/models.py`
- `hermes_directory_backend/api_hermes/serializers.py`

## 6) Backend migrations
- Added migrations for `api_hermes`:
  - `api_hermes/migrations/0001_initial.py`
  - `api_hermes/migrations/__init__.py`
- Database schema is now reproducible via migrations.

Changed files:
- `hermes_directory_backend/api_hermes/migrations/0001_initial.py` (new)
- `hermes_directory_backend/api_hermes/migrations/__init__.py` (new)

## 7) Test baseline expansion (`api_hermes/tests.py`)
- Permissions/CRUD:
  - list offices
  - retrieve office
  - create/update/delete for staff
  - create/update/delete forbidden for non-staff
- Auth:
  - login happy path
  - refresh happy path
  - `/api/auth/me/` happy path
- Validation:
  - valid office payload
  - invalid website (no scheme/unsafe scheme)
  - invalid phone format
  - missing required owner
  - blank required number

Changed file:
- `hermes_directory_backend/api_hermes/tests.py`

## 8) Verified commands run in session
- `python manage.py check`
- `python manage.py test api_hermes -v 2`
- `python manage.py makemigrations api_hermes`
- `python manage.py makemigrations --check`
- `python manage.py migrate`
- `npm run build` (frontend)

## 9) Notes for next session
- Worktree still contains unrelated pre-existing untracked files (`info.txt`, `requirements.txt`) not modified in this session.
- Primary continuation point: production hardening and CI checks, or frontend/backend e2e smoke tests.

---

# Session Changes (2026-03-07)

## 1) Production hardening (Django prod profile)
- Strengthened `base_hermes/settings/prod.py` with production security defaults:
  - `SECURE_SSL_REDIRECT`
  - `SESSION_COOKIE_SECURE`
  - `CSRF_COOKIE_SECURE`
  - `SECURE_HSTS_SECONDS`
  - `SECURE_HSTS_INCLUDE_SUBDOMAINS`
  - `SECURE_HSTS_PRELOAD`
  - `SECURE_CONTENT_TYPE_NOSNIFF`
  - `X_FRAME_OPTIONS`
  - `SECURE_REFERRER_POLICY`
- Added optional proxy-aware HTTPS support via `USE_X_FORWARDED_PROTO` -> `SECURE_PROXY_SSL_HEADER`.
- Added production guard: startup now raises `ImproperlyConfigured` when `CORS_ALLOW_ALL_ORIGINS=True` in prod profile.

Changed file:
- `hermes_directory_backend/base_hermes/settings/prod.py`

## 2) Env template expansion
- Extended backend `.env.example` with the new production security variables so deployment config is explicit and reproducible.

Changed file:
- `hermes_directory_backend/.env.example`

## 3) CI checks automation (GitHub Actions)
- Added workflow `.github/workflows/ci.yml` with two jobs:
  - `backend`: `python manage.py check`, `python manage.py makemigrations --check`, `python manage.py test api_hermes -v 2`
  - `frontend`: `npm ci`, `npm run build`
- Triggered on `push` to `main`/`master` and on all `pull_request` events.

Added file:
- `.github/workflows/ci.yml` (new)

## 4) Verified commands run in session
- `python manage.py check` (backend)
- `python manage.py makemigrations --check` (backend)
- `python manage.py test api_hermes -v 2` (backend, 18 tests passed)
- `npm run build` (frontend, build passed)

## 5) Notes for next session
- Next logical step from roadmap: add e2e smoke tests for public routes and admin auth flow.

## 6) E2E smoke tests (frontend + backend integration)
- Added minimal Playwright smoke coverage for key flows:
  - `/` opens
  - `/residents` opens and shows seeded resident data
  - `/admin/panel` redirects to public route without valid session
  - staff login from public page works
  - `/admin/panel` is accessible after login
  - logout clears both JWT tokens and returns to public route
- Added deterministic backend seed script for e2e user/data setup:
  - staff user: `e2e_staff`
  - office record owner: `E2E Smoke Resident`
- Added Playwright config with two `webServer` entries:
  - Django backend (`runserver` + migrate + seed)
  - Vite frontend (`npm run dev`)
- Added one-command local e2e run:
  - `npm run test:e2e:smoke` (from `hermes_directory_frontend/`)
  - first run prerequisite: `npx playwright install chromium`

Changed files:
- `hermes_directory_frontend/package.json`
- `hermes_directory_frontend/package-lock.json`
- `hermes_directory_frontend/vite.config.js`
- `hermes_directory_frontend/playwright.smoke.config.js` (new)
- `hermes_directory_frontend/e2e/smoke.spec.js` (new)
- `hermes_directory_backend/scripts/seed_e2e_smoke.py` (new)

## 7) Verified commands run in session (additional)
- `npm run test:e2e:smoke` (3 smoke tests passed)

## 8) Production DB/runtime hardening and deploy gate
- Added PostgreSQL support in production settings via env:
  - `USE_POSTGRES=True` enables PostgreSQL backend
  - required in this mode: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`
  - optional: `POSTGRES_PORT` (default `5432`), `POSTGRES_CONN_MAX_AGE` (default `60`)
- Added runtime health endpoint:
  - `GET /api/health/`
  - returns `200 {"status":"ok","database":"ok"}` when DB is reachable
  - returns `503 {"status":"degraded","database":"unavailable"}` on DB connectivity failure
- Added backend test coverage for health endpoint.
- CI backend job now includes deploy gate:
  - `python manage.py check --deploy` with explicit production env values
  - production profile loaded via `DJANGO_SETTINGS_MODULE=base_hermes.settings.prod` in that step
- Added short production deploy checklist in backend README.

Changed files:
- `hermes_directory_backend/base_hermes/settings/prod.py`
- `hermes_directory_backend/.env.example`
- `hermes_directory_backend/api_hermes/views.py`
- `hermes_directory_backend/api_hermes/urls.py`
- `hermes_directory_backend/api_hermes/tests.py`
- `.github/workflows/ci.yml`
- `hermes_directory_backend/README.md.txt`

## 9) Verified commands run in session (additional)
- `python manage.py check --deploy` (prod profile env injected)
- `python manage.py test api_hermes -v 2` (19 tests passed)
- `npm run test:e2e:smoke` (3 smoke tests passed)

## 10) Deploy-readiness CI pipeline (roadmap continuation)
- Added dependency required for PostgreSQL runtime in production:
  - `psycopg[binary]==3.2.12` in root `requirements.txt`
- Added `STATIC_ROOT` to base settings:
  - `STATIC_ROOT = BASE_DIR / "staticfiles"`
  - enables `collectstatic --noinput` in CI/deploy pipeline
- Added new blocking CI job `deploy-readiness`:
  - waits for `backend`, `frontend`, `e2e-smoke`
  - runs with prod profile env (`DJANGO_SETTINGS_MODULE=base_hermes.settings.prod`)
  - executes: `migrate --noinput`, `collectstatic --noinput`, runtime health probe `/api/health/`
  - sets `SECURE_SSL_REDIRECT=False` only for this CI smoke runtime check
- Updated backend deploy checklist to include `collectstatic`.

Changed files:
- `requirements.txt`
- `hermes_directory_backend/base_hermes/settings/base.py`
- `.github/workflows/ci.yml`
- `hermes_directory_backend/README.md.txt`

## 11) Verified commands run in session (additional)
- `python manage.py test api_hermes -v 2` (19 tests passed)
- `npm run test:e2e:smoke` (3 smoke tests passed)
- `python manage.py migrate --noinput` (prod profile env injected)
- `python manage.py collectstatic --noinput` (prod profile env injected)
- runtime probe via `curl http://127.0.0.1:8001/api/health/` against `runserver` on prod profile env

## 12) Continuation point for next session
- Roadmap status: production hardening, CI checks, e2e smoke, and deploy-readiness gate are completed.
- Primary next step:
  - connect and validate real PostgreSQL on staging/production env (not only config support in code)
  - run migrations on target env and verify `/api/health/` against real deployment
  - wire smoke e2e to run against deployed staging URL after deploy (instead of only local Playwright webServer mode)
- Keep current constraints:
  - no API contract changes
  - minimal infra changes per iteration

## 13) CI PostgreSQL production-profile gate (roadmap continuation)
- Added new blocking CI job `deploy-readiness-postgres` in `.github/workflows/ci.yml`.
- Job uses GitHub Actions `postgres:17` service and runs Django with:
  - `DJANGO_SETTINGS_MODULE=base_hermes.settings.prod`
  - `USE_POSTGRES=True`
  - `POSTGRES_*` env vars pointed to CI service
- Job verifies production runtime path on PostgreSQL:
  - `python manage.py migrate --noinput`
  - `python manage.py collectstatic --noinput`
  - runtime probe `/api/health/`
- This keeps API contract unchanged and moves roadmap forward toward real staging/prod database validation.

## 14) Post-deploy smoke against staging URL (roadmap continuation)
- Updated Playwright smoke config to support two modes:
  - local mode (default): starts backend/frontend via `webServer`
  - remote mode: uses external `PLAYWRIGHT_BASE_URL` and does not start local servers
- Parameterized smoke test credentials/data markers via env:
  - `E2E_ADMIN_USERNAME`
  - `E2E_ADMIN_PASSWORD`
  - `E2E_RESIDENT_OWNER`
- Added CI job `post-deploy-smoke` in `.github/workflows/ci.yml`:
  - runs after `deploy-readiness-postgres`
  - executes smoke tests against deployed staging URL using secrets:
    - `STAGING_BASE_URL`
    - `STAGING_ADMIN_USERNAME`
    - `STAGING_ADMIN_PASSWORD`
  - optional owner marker from repo variable:
    - `STAGING_RESIDENT_OWNER`
- Job condition:
  - runs on `push` to `main/master` when required staging secrets are set
  - keeps PR pipeline stable if staging secrets are intentionally absent

Changed files:
- `hermes_directory_frontend/playwright.smoke.config.js`
- `hermes_directory_frontend/e2e/smoke.spec.js`
- `.github/workflows/ci.yml`

## 15) Verified commands run in session (additional)
- `npm run test:e2e:smoke` (local mode, 3 tests passed)
