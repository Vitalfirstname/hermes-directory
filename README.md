# Hermes Directory (Business Center “ГЕРМЕС”)

Fullstack учебный проект: публичный справочник арендаторов бизнес-центра + JWT-защищённая админ-панель для управления офисами.

**Stack:** Django REST Framework, SimpleJWT, React (Vite), Axios, SQLite (dev)

---

## Возможности

### Публичная часть (без авторизации)
- Список офисов (номер, корпус/башня, арендатор, телефон, сайт)
- Поиск по любому полю (номер/компания/телефон/корпус/сайт)
- Фильтр по корпусу
- Таблица: сортировка, быстрый скролл, адаптивное отображение

### Админ-панель (JWT)
- Login / refresh / me
- CRUD офисов (Create / Read / Update / Delete)
- Доступ к изменениям только для авторизованных пользователей

---

## Архитектура

React (Vite) → Axios → DRF API → ORM → SQLite

Основные эндпоинты:
- `GET /api/offices/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

---

## Быстрый старт (локально)

### Backend
```bash
cd hermes_directory_backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000


---

## Screenshots

### Landing
![Landing](screenshots/landing.png)

### Residents Directory
![Residents](screenshots/residents.png)

### Admin Login
![Admin Login](screenshots/admin-login.png)

### Admin Panel
![Admin Panel](screenshots/admin-panel.png)