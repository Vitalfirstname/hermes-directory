# Hermes Directory (Business Center "ГЕРМЕС")

Fullstack учебный проект: публичный справочник арендаторов бизнес-центра + JWT-защищённая админ-панель для управления офисами.

---

## 🚀 Stack

- Django REST Framework
- SimpleJWT (JWT authentication via HttpOnly cookies for browser sessions)
- React (Vite)
- Axios
- SQLite (dev)

---

## 📌 Возможности

### Публичная часть (без авторизации)

- Список офисов (номер, корпус/башня, арендатор, телефон, сайт)
- Поиск по любому полю (номер / компания / телефон / корпус / сайт)
- Фильтрация по корпусу
- Сортировка таблицы
- Адаптивное отображение

### Админ-панель (JWT + HttpOnly cookies)

- Авторизация (login / refresh / logout / me / csrf)
- CRUD операции с офисами
- Доступ к изменениям только для авторизованных пользователей

---

## 🏗 Архитектура

```
React (Vite)
        ↓
      Axios
        ↓
Django REST API
        ↓
       ORM
        ↓
     SQLite
```

### Основные эндпоинты

- `GET /api/v1/offices/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/auth/csrf/`
- `GET /api/v1/auth/me/`

Backward compatibility:
- existing unversioned `/api/*` endpoints are kept as a legacy alias during migration.
- new clients should use `/api/v1/*`.

Pagination:
- list endpoints use default page-number pagination.
- defaults: `page_size=20`, optional `page_size` query param, capped at `100`.

### Unified API error envelope

All API errors are returned in a single format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {},
    "trace_id": "optional-correlation-id"
  }
}
```

---

## ⚙ Быстрый старт (локально)

### Backend

```bash
cd hermes_directory_backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Backend будет доступен по адресу:
```
http://localhost:8000
```

---

### Frontend

```bash
cd hermes_directory_frontend
npm install
npm run dev -- --host
```

Frontend будет доступен по адресу:
```
http://localhost:5173
```

---

## 🖼 Screenshots

### Landing
![Landing](screenshots/landing.png)

---

### Residents Directory
![Residents](screenshots/residents.png)

---

### Admin Login
![Admin Login](screenshots/admin-login.png)

---

### Admin Panel
![Admin Panel](screenshots/admin-panel.png)

---

## 📈 Возможные улучшения

- SEO (meta-tags, sitemap, prerender)
- Полная мобильная адаптация
- PostgreSQL вместо SQLite
- Docker + Nginx
- Production deployment

---

## 🎯 Назначение проекта

Проект демонстрирует:

- REST API на Django
- JWT-авторизацию
- Разделение публичной и приватной зоны
- SPA на React
- Реалистичный бизнес-кейс (внутренний инструмент бизнес-центра)

---

## 🔬 Post-Deploy Smoke (staging)

Workflow `.github/workflows/ci.yml` содержит job `post-deploy-smoke`.

Когда запускается:
- только на `push` в `main`/`master`
- после прохождения `deploy-readiness-postgres`

Что нужно настроить в GitHub:
- `Settings` -> `Secrets and variables` -> `Actions` -> `Secrets`:
  - `STAGING_BASE_URL` (например, `https://staging.example.com`)
  - `STAGING_ADMIN_USERNAME`
  - `STAGING_ADMIN_PASSWORD`
- `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`:
  - `STAGING_RESIDENT_OWNER` (опционально; маркер арендатора для проверки `/residents`)

Какие env получает Playwright в `post-deploy-smoke`:
- `PLAYWRIGHT_BASE_URL` <- `secrets.STAGING_BASE_URL`
- `PLAYWRIGHT_USE_LOCAL_SERVERS` = `false`
- `E2E_ADMIN_USERNAME` <- `secrets.STAGING_ADMIN_USERNAME`
- `E2E_ADMIN_PASSWORD` <- `secrets.STAGING_ADMIN_PASSWORD`
- `E2E_RESIDENT_OWNER` <- `vars.STAGING_RESIDENT_OWNER` (опционально)
