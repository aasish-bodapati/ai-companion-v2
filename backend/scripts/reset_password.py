import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.db.session import SessionLocal  # noqa: E402
from app import crud  # noqa: E402


def reset_password(email: str, new_password: str) -> None:
    db = SessionLocal()
    try:
        user = crud.user.get_by_email(db, email=email)
        if not user:
            print(f"User not found: {email}")
            return
        crud.user.update(db, db_obj=user, obj_in={"password": new_password})
        db.commit()
        print(f"Password reset OK for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    # Default target user
    reset_password("test001@example.com", "testpassword123")
