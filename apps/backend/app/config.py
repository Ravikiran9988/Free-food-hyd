import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


def _normalize_database_url(url: str) -> str:
    if not url:
        return "postgresql://postgres:postgres@localhost:5433/freefoodhyd"

    # Supabase/Render provide postgres:// URLs; SQLAlchemy requires postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Safely URL-encode password if it contains special characters like '@'
    if url.count("@") > 1:
        import urllib.parse
        prefix, host_part = url.rsplit("@", 1)
        if "://" in prefix:
            proto, user_pass = prefix.split("://", 1)
            if ":" in user_pass:
                user, password = user_pass.split(":", 1)
                encoded_password = urllib.parse.quote_plus(password)
                url = f"{proto}://{user}:{encoded_password}@{host_part}"

    # Supabase direct host (db.<ref>.supabase.co) only has IPv6 AAAA records.
    # If IPv4 resolution fails (common on local Windows/ISPs), route via Supabase pooler.
    if "@db." in url and ".supabase.co" in url:
        try:
            import socket
            prefix, host_part = url.rsplit("@", 1)
            host_and_port = host_part.split("/")[0]
            host = host_and_port.split(":")[0]
            socket.getaddrinfo(host, 5432, socket.AF_INET)
        except socket.gaierror:
            proto, user_pass = prefix.split("://", 1)
            user, password = user_pass.split(":", 1) if ":" in user_pass else (user_pass, "")
            ref = host.replace("db.", "").replace(".supabase.co", "")
            pooler_user = f"postgres.{ref}" if not user.startswith("postgres.") else user
            dbname = host_part.split("/")[1] if "/" in host_part else "postgres"
            url = f"{proto}://{pooler_user}:{password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/{dbname}"

    return url


def _get_database_url() -> str:
    return _normalize_database_url(
        os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/freefoodhyd")
    )


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


from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    DATABASE_URL: str = _get_database_url()
    APP_NAME: str = "Free Food Hyderabad API"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    CORS_ORIGINS: Union[List[str], str] = _get_cors_origins()
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "dev-only-change-me")
    CRON_SECRET: str = os.getenv("CRON_SECRET", "")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v):
        return _normalize_database_url(v)

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, set)):
            return list(v)
        return v


settings = Settings()

