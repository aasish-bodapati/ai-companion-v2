from datetime import datetime, timedelta, timezone
from typing import Any, Union

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject of the token (usually the user ID).
        expires_delta: Optional timedelta for token expiration.

    Returns:
        str: The encoded JWT token.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    logger.info(f"🔐 [JWT] Created token for subject {subject}:")
    logger.info(f"🔐 [JWT] Token length: {len(encoded_jwt)}")
    logger.info(f"🔐 [JWT] Token start: {encoded_jwt[:20]}...")
    logger.info(f"🔐 [JWT] Token end: ...{encoded_jwt[-20:]}")
    logger.info(f"🔐 [JWT] Has dots: {'.' in encoded_jwt}")
    logger.info(f"🔐 [JWT] Dot count: {encoded_jwt.count('.')}")
    
    return encoded_jwt

def decode_token(token: str) -> dict:
    """
    Decode a JWT token.

    Args:
        token: The JWT token to decode.

    Returns:
        dict: The decoded token payload.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        plain_password: The plain text password.
        hashed_password: The hashed password.

    Returns:
        bool: True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password.

    Args:
        password: The plain text password.

    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)
