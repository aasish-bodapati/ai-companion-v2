"""
Secure Authentication with httpOnly Cookies
"""
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
import secrets

from app.core.config import settings


class CookieHTTPBearer(HTTPBearer):
    """
    Custom HTTPBearer that checks for JWT in httpOnly cookies first,
    then falls back to Authorization header for API compatibility
    """
    
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        # First, try to get token from httpOnly cookie
        token = request.cookies.get("access_token")
        
        if token:
            return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        # Fallback to Authorization header for API clients
        return await super().__call__(request)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def set_auth_cookies(response: Response, access_token: str) -> None:
    """Set secure httpOnly cookies for authentication"""
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,  # Prevents XSS attacks
        secure=bool(getattr(settings, "COOKIE_SECURE", True)),    # HTTPS only in production
        samesite=str(getattr(settings, "COOKIE_SAMESITE", "lax")), # CSRF protection
        path="/"
    )
    
    # Set a separate cookie for frontend to know if user is authenticated
    # This one is readable by JavaScript but contains no sensitive data
    response.set_cookie(
        key="is_authenticated",
        value="true",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,  # Frontend can read this
        secure=bool(getattr(settings, "COOKIE_SECURE", True)),
        samesite=str(getattr(settings, "COOKIE_SAMESITE", "lax")),
        path="/"
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies on logout"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="is_authenticated", path="/")


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthCookieMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle cookie-based authentication
    Sets request.state.user_id if valid token found in cookies
    """
    
    async def dispatch(self, request: Request, call_next):
        # Try to get token from cookies
        token = request.cookies.get("access_token")
        
        if token:
            try:
                payload = verify_token(token)
                user_id = payload.get("sub")
                if user_id:
                    request.state.user_id = user_id
            except HTTPException:
                # Invalid token, continue without setting user_id
                pass
        
        response = await call_next(request)
        return response


# Global instance for dependency injection
cookie_security = CookieHTTPBearer()
