from app.db.session import SessionLocal
from app.core.config import settings
from app.schemas.user import UserCreate
from app import crud


def ensure_user(db, email: str, password: str, full_name: str = ""):
    user = crud.user.get_by_email(db, email=email)
    if user:
        print(f"User already exists: {email}")
        return user
    user_in = UserCreate(email=email, password=password, full_name=full_name)
    user = crud.user.create(db, obj_in=user_in)
    print(f"Created user: {email}")
    return user


def run():
    db = SessionLocal()
    try:
        # Create superuser
        admin_email = settings.FIRST_SUPERUSER
        admin_password = settings.FIRST_SUPERUSER_PASSWORD
        ensure_user(db, admin_email, admin_password, full_name="Administrator")

        # Create test user
        test_email = settings.TEST_USERNAME
        test_password = settings.TEST_PASSWORD
        ensure_user(db, test_email, test_password, full_name="Test User")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
