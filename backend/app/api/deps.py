from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import crud, models
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

def get_db() -> Generator:
    """
    Get a database session.

    Yields:
        Session: A database session.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🗄️ [DB] Creating database session...")
    try:
        db = SessionLocal()
        logger.info(f"🗄️ [DB] Database session created successfully")
        yield db
    except Exception as e:
        logger.error(f"🗄️ [DB] Error creating database session: {e}")
        raise
    finally:
        logger.info(f"🗄️ [DB] Closing database session...")
        db.close()
        logger.info(f"🗄️ [DB] Database session closed")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> User:
    """
    Get the current user from the JWT token.

    Args:
        db: Database session.
        token: JWT token.

    Returns:
        User: The current user.

    Raises:
        HTTPException: If the token is invalid or the user doesn't exist.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔐 [AUTH] Starting authentication for token: {token[:20]}...")
    
    try:
        logger.info(f"🔐 [AUTH] Decoding JWT token...")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        logger.info(f"🔐 [AUTH] Token decoded, user_id: {token_data.sub}")
    except (jwt.JWTError, ValidationError) as e:
        logger.error(f"🔐 [AUTH] JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    logger.info(f"🔐 [AUTH] Looking up user in database...")
    user = crud.user.get(db, id=token_data.sub)
    if not user:
        logger.warning(f"🔐 [AUTH] User not found: {token_data.sub}")
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"🔐 [AUTH] Authentication successful for user: {user.id}")
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> User:
    """
    Get the current active user.

    Args:
        current_user: The current user.

    Returns:
        User: The current active user.

    Raises:
        HTTPException: If the user is inactive.
    """
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> User:
    """
    Get the current active superuser.

    Args:
        current_user: The current user.

    Returns:
        User: The current active superuser.

    Raises:
        HTTPException: If the user is not a superuser.
    """
    if not crud.user.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user
