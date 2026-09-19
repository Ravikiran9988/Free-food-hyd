import os
from typing import List
from pydantic_settings import BaseSettings


def _get_database_url() -> str:
    url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5433/freefoodhyd",
    )
    # Supabase/Render provide postgres:// URLs; SQLAlchemy requires postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _get_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:8080",
        ]
    if raw.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings(BaseSettings):
    DATABASE_URL: str = _get_database_url()
    APP_NAME: str = "Free Food Hyderabad API"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    CORS_ORIGINS: List[str] = _get_cors_origins()
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "dev-only-change-me")
    CRON_SECRET: str = os.getenv("CRON_SECRET", "")


settings = Settings()

