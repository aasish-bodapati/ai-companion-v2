from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

from ..core.security import get_password_hash, verify_password, create_access_token
from ..models.user import User
from ..schemas.auth import UserCreate, UserInDB
from ..config import settings

class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        # TODO: Implement actual database query
        # return db.query(User).filter(User.email == email).first()
        return None  # Temporary
    
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> UserInDB:
        hashed_password = get_password_hash(user.password)
        # TODO: Implement actual database create
        # db_user = User(
        #     email=user.email,
        #     hashed_password=hashed_password,
        #     full_name=user.full_name
        # )
        # db.add(db_user)
        # db.commit()
        # db.refresh(db_user)
        # return db_user
        
        # Temporary return for testing
        return UserInDB(
            id=1,
            email=user.email,
            full_name=user.full_name,
            is_active=True
        )
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def create_access_token_for_user(user: User) -> str:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return create_access_token(
            data={"sub": user.email}, 
            expires_delta=access_token_expires
        )
