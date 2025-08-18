import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.db.session import SessionLocal  # noqa: E402
from app import crud  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.schemas.user import UserCreate  # noqa: E402


def create_admin_user():
    """Create an admin user in the database."""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER)
        if admin:
            print(f"Admin user {settings.FIRST_SUPERUSER} already exists")
            return admin

        # Create admin user using UserCreate schema
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="Admin User",
            is_superuser=True,
            is_active=True,
        )
        admin = crud.user.create(db, obj_in=user_in)
        print(f"Created admin user: {admin.email}")
        return admin
    except Exception as e:
        print(f"Error creating admin user: {str(e)}")
        return None
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding admin user...")
    admin = create_admin_user()
    if admin:
        print("Admin user seeded successfully!")
    else:
        print("Failed to seed admin user")
