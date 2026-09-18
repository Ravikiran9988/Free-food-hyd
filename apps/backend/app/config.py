import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/freefoodhyd")
    APP_NAME: str = "Free Food Hyderabad API"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = ["*"]
    ADMIN_SECRET_KEY: str = "default_secret_key"
    ADMIN_PASSWORD_HASH: str = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqi4uVG"  # Default bcrypt hash

settings = Settings()
