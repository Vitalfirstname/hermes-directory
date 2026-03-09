# Technical Audit Report

Audit basis: current git HEAD on branch `hardening/roadmap-phase-2` at commit `c655c8691c650fbc46bc2de5f5e8bc52a3be582c` (same as `main` and `origin/main` at audit time).

## 1) Repository Overview
Current architecture:
- Frontend: React + Vite SPA (`hermes_directory_frontend/src/App.jsx`).
- API client: Axios with JWT attach/refresh (`hermes_directory_frontend/src/api/api.js`).
- Backend: Django + DRF under `/api/` (`hermes_directory_backend/base_hermes/urls.py`, `hermes_directory_backend/api_hermes/urls.py`).
- DB: SQLite by default (`base.py`), PostgreSQL via prod env (`prod.py`).
- CI/CD: GitHub Actions (`.github/workflows/ci.yml`) with backend/frontend/e2e/deploy-readiness jobs.
- E2E: Playwright smoke tests (`hermes_directory_frontend/e2e/smoke.spec.js`).
- Environment config: backend `.env.example` exists (`hermes_directory_backend/.env.example`).

How it works now:
- Public users can read offices.
- Write operations are protected at API permission layer.
- Frontend admin route checks tokens and `/auth/me`.
- CI validates backend checks/tests, frontend build, e2e smoke, deploy-readiness (SQLite + PostgreSQL), and post-deploy smoke stage.

## 2) Backend Audit
Strengths:
- Split settings (`base/dev/prod`) and env-driven config.
- `IsAdminOrReadOnly` permission is applied to office CRUD.
- Explicit serializer fields + URL/phone validation.
- Health endpoint exists (`/api/health/`).
- Migrations exist.
- Backend tests cover permissions/auth/validation/health.

Issues:
- Security: token model overall still coupled to frontend localStorage usage.
- Scalability: no default DRF pagination strategy.
- Maintainability: no API versioning namespace yet.
- Error handling: no unified error envelope/exception strategy.
- Observability: health endpoint is basic (DB only).

## 3) Frontend Audit
Strengths:
- Clear routing (`/`, `/residents`, `/admin/panel`).
- Token lifecycle includes refresh flow in Axios interceptor.
- Admin access verifies user role via `/auth/me`.
- Residents flow uses page-level fetch + presentational table props.

Issues:
- Auth risk: access/refresh in localStorage (XSS blast radius).
- Accessibility: many inputs rely on placeholders; limited explicit labels.
- External-link security: several `target="_blank"` links miss `rel="noopener noreferrer"`.
- UX: header has broken anchor (`#rent` without matching section id).
- Responsive UX: large fixed/min table widths (1300px) constrain mobile usability.
- SEO: minimal metadata only; no robots/sitemap.

## 4) DevOps / CI Audit
Strengths:
- CI jobs are structured and chained:
  - `backend`
  - `frontend`
  - `e2e-smoke`
  - `deploy-readiness`
  - `deploy-readiness-postgres`
  - `post-deploy-smoke`
- `e2e-smoke` is blocking through `needs`.
- Production-profile runtime checks are present.
- Post-deploy smoke validates required secrets first.

Gaps:
- No real staging environment currently (post-deploy smoke is future stage).
- No artifact upload (Playwright traces/screenshots) on CI failures.
- No SAST/dependency-vulnerability stage.

## 5) UX / SEO Audit
- Metadata: only basic `<title>` and viewport.
- Crawlability: SPA without SSR/prerender strategy + no robots/sitemap.
- Navigation: one broken internal anchor.
- Accessibility: partial alt/labels coverage, external-link hardening incomplete.
- Mobile: horizontal-scroll-heavy tables reduce usability.

## 6) Risk Assessment
Critical risks:
- Security: localStorage token exposure; missing noopener on some external links.
- Data/API consistency: no unified error contract increases client fragility.
- Deployment: post-deploy smoke depends on staging readiness not yet established.
- Architecture: no API versioning for safe long-term evolution.

## 7) Prioritized Fix Roadmap

### P0 — Critical
1. Harden auth/token strategy (reduce localStorage exposure; move toward safer session model).
- Affected: `hermes_directory_frontend/src/api/api.js`, `hermes_directory_frontend/src/pages/AdminPanel.jsx`
- Difficulty: High
- Approach: staged hardening (XSS controls first, then auth storage/session evolution).

2. Fix all external links opened in new tab without `noopener noreferrer`.
- Affected: `hermes_directory_frontend/src/components/AdminFooter.jsx`, plus other components with `target="_blank"`
- Difficulty: Low
- Approach: systematic rel audit + lint rule.

### P1 — Important
1. Add SEO baseline (description, OG/Twitter, canonical, robots, sitemap).
- Affected: `hermes_directory_frontend/index.html`, frontend public assets
- Difficulty: Low
- Approach: static metadata + sitemap generation.

2. Improve mobile/table responsiveness.
- Affected: `hermes_directory_frontend/src/components/ResidentsTable/ResidentsTable.module.css`, `hermes_directory_frontend/src/styles/table_admin.css`
- Difficulty: Medium
- Approach: card/stack layout at narrow breakpoints.

3. Add DRF pagination defaults.
- Affected: `hermes_directory_backend/base_hermes/settings/base.py` (+ API usage)
- Difficulty: Low
- Approach: default pagination class/page size.

4. Introduce unified API error format.
- Affected: backend exception handling + frontend error mapping
- Difficulty: Medium
- Approach: DRF custom exception handler + normalized client parser.

5. Add CI diagnostics for e2e failures.
- Affected: `.github/workflows/ci.yml`, Playwright config
- Difficulty: Low
- Approach: upload traces/screenshots/videos as artifacts.

### P2 — Nice-to-have
1. Add API versioning (`/api/v1/...`).
- Affected: backend URL config + frontend endpoints
- Difficulty: Medium
- Approach: introduce alias, then migrate routes.

2. Extend health endpoint coverage.
- Affected: `hermes_directory_backend/api_hermes/views.py`
- Difficulty: Medium
- Approach: optional checks for dependencies with degraded status map.

3. Add frontend `.env.example` and align docs.
- Affected: frontend config/docs
- Difficulty: Low
- Approach: template + README section.

4. Accessibility pass for forms/controls.
- Affected: admin/resident table-related components
- Difficulty: Medium
- Approach: labels/aria/focus-state audit and fixes.

---

Report generated as analysis-only. No source code changes were applied.
