from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def seed_admin(email: str, raw_password: str):
    db = SessionLocal()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        existing.role = "admin"
        existing.hashed_password = get_password_hash(raw_password)
        db.commit()
        print("✅ Updated existing user to admin")
    else:
        admin_user = User(email=email, hashed_password=get_password_hash(raw_password), role="admin")
        db.add(admin_user)
        db.commit()
        print("✅ Created new admin user")
    db.close()

if __name__ == "__main__":
    seed_admin("medicharlaravikiran88@gmail.com", "Kiran@2004")
