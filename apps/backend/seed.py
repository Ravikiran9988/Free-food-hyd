import os

from app.auth import get_password_hash
from app.database import SessionLocal
from app.models import User


def seed_admin(email: str, raw_password: str):
    if not email or not raw_password:
        raise ValueError("Admin email and password are required")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            existing.hashed_password = get_password_hash(raw_password)
            db.commit()
            print("Admin user updated")
        else:
            admin_user = User(
                email=email,
                hashed_password=get_password_hash(raw_password),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created")
    finally:
        db.close()


if __name__ == "__main__":
    email = os.getenv("ADMIN_USERNAME") or os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        raise SystemExit(
            "Set ADMIN_USERNAME (or ADMIN_EMAIL) and ADMIN_PASSWORD before running seed.py."
        )

    seed_admin(email, password)
