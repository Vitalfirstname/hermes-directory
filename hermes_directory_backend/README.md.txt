# Hermes Business Center — Office Directory System (React + Django REST API)

Сайт - визитная карточка бизнес-центра "Гермес".
  
Сайт состоит из публичной части: 

1. Страница(раздел) Приветствия (главная).

2. Страница(раздел) О бизнес-центре "Гермес"

3. Страница(раздел) Резиденты (справочник арендаторов) в виде таблицы с возможностью поиска.

4. Страница(раздел) Администрация (контакты, предложения и т.д.) + окно входа через авторизацию 

к закрытой административной панели справочника арендаторов с CRUD-операциями.

И административной части: Закрытая административная панель справочник в виде таблицы арендаторов с CRUD-операциями.



Backend реализован на **Django REST Framework** с авторизацией по **JWT**,  
Frontend — на **React (Vite) + Axios**.

---

## ✨ Возможности проекта

### 🔹 Публичная часть (доступна всем)
- Сам сайт с несколькими типичными страницами (разделами)
+ Таблица:
- Просмотр списка всех офисов бизнес-центра  
- Фильтрация по корпусу (башне)  
- Поиск по номеру офиса, компании, телефону или сайту  
- Удобная таблица, адаптивный интерфейс  
- Работает как «информационный стенд» бизнес-центра  

### 🔹 Административная часть (только для авторизованных пользователей)
- Авторизация по JWT  
- "Просмотр и управление офисами"  
- Добавление новых офисов (Create)  
- Редактирование существующих (Update)  
- Удаление (Delete) — только для админов  
- Разграничение доступа (is_staff / is_superuser)  
- Защищённый API `/auth/me`  
- Полная документация API через Swagger  

---

## 🏗 Архитектура проекта

React (Frontend)
│ Axios HTTP
▼
Django REST Framework (Backend API)
│ ORM
▼
SQLite Database

---


### Frontend (React)
- Vite + React  
- Axios для запросов  
- Браузерная сессия через HttpOnly JWT cookies (без хранения access/refresh в localStorage)  
- Публичные страницы и защищённые маршруты  
- Отдельный проект `/frontend`  

### Backend (Django DRF)
- Приложение `api_hermes`  
- Модель Office (номер, башня, организация, телефон, сайт)  
- JWT авторизация (SimpleJWT)  
- `/api/v1/offices/` — CRUD  
- `/api/v1/auth/login/` — установка auth cookies  
- `/api/v1/auth/refresh/` — обновление access cookie  
- `/api/v1/auth/logout/` — инвалидация refresh + очистка cookies  
- `/api/v1/auth/csrf/` — выдача CSRF cookie/token для браузера  
- `/api/v1/auth/me/` — текущий пользователь  
- Swagger документация `/swagger/`

### Database
- SQLite (для разработки)  
- Возможность переключения на PostgreSQL  

---

## 🔧 Установка и запуск backend (Django)

### 1. Клонируйте проект
```bash
git clone https://github.com/<your_username>/<repo>.git
cd <repo>

python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver

http://127.0.0.1:8000/

API эндпоинты
Авторизация
Метод	URL	Описание
POST	/api/v1/auth/login/	Логин и установка HttpOnly access/refresh cookies
POST	/api/v1/auth/refresh/	Обновляет access cookie (и refresh при ротации)
POST	/api/v1/auth/logout/	Инвалидирует refresh token и очищает auth cookies
GET	/api/v1/auth/csrf/	Возвращает CSRF token и выставляет csrftoken cookie
GET	/api/v1/auth/me/	Данные текущего пользователя
Офисы
Метод	URL	Описание
GET	/api/v1/offices/	Список всех офисов
POST	/api/v1/offices/	Создать офис (admin/staff)
GET	/api/v1/offices/{id}/	Просмотр офиса
PUT/PATCH	/api/v1/offices/{id}/	Редактировать офис (admin/staff)
DELETE	/api/v1/offices/{id}/	Удалить офис (admin)
Документация API

Swagger UI: /swagger/

Redoc: /redoc/

Note:
- Legacy unversioned `/api/*` routes are still available for backward compatibility.
- Canonical endpoints for new clients are `/api/v1/*`.

Pagination defaults:
- All DRF list endpoints use `PageNumberPagination` by default.
- Default page size: `20`.
- Client can request `page_size`, capped at `100`.
- Non-list utility endpoints (for example `/api/health/`) are intentionally not paginated.

## Unified error response

All API exceptions use a single envelope:

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

Стек технологий
Backend

Python 3.10+

Django 5.x

Django REST Framework

SimpleJWT

SQLite

drf_yasg (Swagger)




---

## Settings profiles and environment variables

1. Copy `.env.example` to `.env` in `hermes_directory_backend/`.
2. For local development, default settings are `base_hermes.settings.dev`.
3. For production, set:
   - `DJANGO_SETTINGS_MODULE=base_hermes.settings.prod`
   - required env vars: `SECRET_KEY`, `ALLOWED_HOSTS`

Examples:

```bash
# dev (default)
python manage.py runserver

# prod profile
set DJANGO_SETTINGS_MODULE=base_hermes.settings.prod
python manage.py check
```

## Production deploy checklist

1. Set `DJANGO_SETTINGS_MODULE=base_hermes.settings.prod`.
2. Configure required security env vars:
   - `SECRET_KEY`
   - `ALLOWED_HOSTS`
3. Optional PostgreSQL setup (recommended for production):
   - `USE_POSTGRES=True`
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`
   - optional: `POSTGRES_PORT`, `POSTGRES_CONN_MAX_AGE`
4. Run sanity checks before deploy:
   - `python manage.py check --deploy`
   - `python manage.py migrate`
   - `python manage.py collectstatic --noinput`
5. Health endpoints for runtime probes:
   - `GET /api/health/live/` — liveness (process up)
   - `GET /api/health/ready/` — readiness (critical deps)
   - `GET /api/health/` — backward-compatible alias to readiness

## Local production mode run (verified)

Use this when you want to validate production settings locally (without staging).

1. Ensure a PostgreSQL server is available locally.
2. Create a database and user (example values below):
   - `POSTGRES_DB=hermes_ci`
   - `POSTGRES_USER=hermes_ci_user`
   - `POSTGRES_PASSWORD=hermes_ci_password`
   - `POSTGRES_HOST=127.0.0.1`
   - `POSTGRES_PORT=5432` (or your custom port)
3. Export production env vars and run checks:

```bash
set DJANGO_SETTINGS_MODULE=base_hermes.settings.prod
set SECRET_KEY=local-prod-runtime-check-secret-12345678901234567890
set ALLOWED_HOSTS=127.0.0.1,localhost,testserver
set CORS_ALLOWED_ORIGINS=http://localhost:5173
set CSRF_TRUSTED_ORIGINS=http://localhost:5173
set SECURE_SSL_REDIRECT=False

set USE_POSTGRES=True
set POSTGRES_DB=hermes_ci
set POSTGRES_USER=hermes_ci_user
set POSTGRES_PASSWORD=hermes_ci_password
set POSTGRES_HOST=127.0.0.1
set POSTGRES_PORT=5432
set POSTGRES_CONN_MAX_AGE=60

python manage.py check --deploy
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py runserver 127.0.0.1:8010
```

4. Verify health endpoint:
   - `GET http://127.0.0.1:8010/api/health/ready/`
   - expected status: `200`
   - expected shape includes: `status`, `service`, `timestamp`, `checks.database`, `checks.cache`
