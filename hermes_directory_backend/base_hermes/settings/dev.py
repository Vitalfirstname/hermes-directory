from .base import *  # noqa: F403


DEBUG = env_bool("DEBUG", True)  # noqa: F405

ALLOWED_HOSTS = env_list(  # noqa: F405
    "ALLOWED_HOSTS",
    ["127.0.0.1", "localhost", "192.168.100.30", "testserver"],
)

CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", False)  # noqa: F405
CORS_ALLOWED_ORIGINS = env_list(  # noqa: F405
    "CORS_ALLOWED_ORIGINS",
    ["http://localhost:5173", "http://127.0.0.1:5173"],
)
CSRF_TRUSTED_ORIGINS = env_list(  # noqa: F405
    "CSRF_TRUSTED_ORIGINS",
    ["http://localhost:5173", "http://127.0.0.1:5173"],
)
