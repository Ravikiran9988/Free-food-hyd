import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5433/freefoodhyd",
    )
    APP_NAME: str = "Free Food Hyderabad API"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = ["*"]
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "dev-only-change-me")


settings = Settings()
