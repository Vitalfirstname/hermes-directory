# Hermes Directory — карта проекта

Установка, переменные окружения, запуск и команды проверок описаны в [README.md](README.md).

## Backend · `hermes_directory_backend/`

- `base_hermes/urls.py` и `api_hermes/urls.py` задают канонические маршруты `/api/v1/` и совместимые `/api/`. Профили настроек находятся в `base_hermes/settings/`.
- `api_hermes/models.py`, `serializers.py` и `office_validation.py` задают модель и правила Office. Изменения схемы сопровождаются миграциями из `api_hermes/migrations/`. Перед применением к существующим данным проверьте резервную копию и совместимость записей.
- Чтение Office публичное. Права записи проверяет Backend в `api_hermes/permissions.py`. Браузерная сессия использует HttpOnly JWT cookies и CSRF. При изменении маршрутов авторизации учитывайте область действия refresh-cookie.
- `api_hermes/tests.py` покрывает доступ, авторизацию, валидацию, форматы ошибок и пагинацию.

## Frontend · `hermes_directory_frontend/`

- `src/App.jsx` содержит маршруты SPA. `src/pages/Residents.jsx` загружает данные для публичной таблицы, `src/pages/AdminPanel.jsx` проверяет доступ к панели, а `src/components/OfficesTable.jsx` ведёт форму и административный список.
- `src/api/api.js` настраивает Axios для `/api`, cookies, CSRF и обновления сессии. `src/api/loadOffices.js` используется обеими таблицами. Загрузчик следует по `next`, убирает повторы по ID и публикует список только после успешной загрузки всех страниц.
- Поиск и сортировка работают по полному загруженному списку. Правила формы находятся в `src/components/officeFormValidation.js`, её оформление — в `src/styles/table_admin.css`. При изменении формы сохраняйте связь полей с сообщениями об ошибках.
- В `e2e/` находятся smoke-тесты, проверки формы и регрессии пагинации. Локальный Playwright запускает миграции и заполняет тестовыми данными базу запущенного им Backend. Используйте изолированный профиль из README и отдельную базу.
