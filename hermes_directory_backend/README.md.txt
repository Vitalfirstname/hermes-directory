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
- Хранение токена в localStorage  
- Публичные страницы и защищённые маршруты  
- Отдельный проект `/frontend`  

### Backend (Django DRF)
- Приложение `api_hermes`  
- Модель Office (номер, башня, организация, телефон, сайт)  
- JWT авторизация (SimpleJWT)  
- `/api/offices/` — CRUD  
- `/api/auth/login/` — получение токена  
- `/api/auth/me/` — текущий пользователь  
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
POST	/api/auth/login/	Выдаёт access+refresh JWT
POST	/api/auth/refresh/	Обновляет access токен
GET	/api/auth/me/	Данные текущего пользователя
Офисы
Метод	URL	Описание
GET	/api/offices/	Список всех офисов
POST	/api/offices/	Создать офис (admin/staff)
GET	/api/offices/{id}/	Просмотр офиса
PUT/PATCH	/api/offices/{id}/	Редактировать офис (admin/staff)
DELETE	/api/offices/{id}/	Удалить офис (admin)
Документация API

Swagger UI: /swagger/

Redoc: /redoc/

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
5. Health endpoint for runtime probes:
   - `GET /api/health/` (expects `{"status":"ok","database":"ok"}` on healthy instance)
