# Hermes Directory – Codex Guide

## Project overview
Hermes Directory is a fullstack monorepo.

Architecture:
React SPA → Axios → Django REST API → ORM → SQLite

## Backend
Location: hermes_directory_backend

Stack:
- Django
- Django REST Framework
- JWT authentication

Main modules:
- base_hermes – project configuration (settings, urls, auth, swagger)
- api_hermes – business logic (Office model, serializers, viewsets)

Key endpoints:
- POST /api/auth/login
- GET /api/auth/me
- /api/offices

## Frontend
Location: hermes_directory_frontend

Stack:
- React
- Vite
- Axios

Routing:
- /
- /residents
- /admin/panel

Axios configuration:
- baseURL: /api
- request interceptor adds Bearer token
- response interceptor handles 401

## Architecture rules
- Public zone: read-only data
- Admin zone: CRUD via JWT
- Frontend communicates with backend only via REST API