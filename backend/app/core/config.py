"""
Simplified configuration for HealthLog AI - Health-focused only
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings
import secrets
import os
from pathlib import Path

class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "HealthLog - Your Personal Wellness Assistant"

    # API settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(
        default="your-secret-key-here-change-in-production",
        description="JWT secret key - MUST be changed in production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 2  # 2 days (reduced from 8 days for security)

    # CORS settings - Allow all 192.168.x.x for mobile testing
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:8001",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:8000",
        "https://localhost:8001",
        "http://192.168.1.5:3000",  # Mobile access
        "http://192.168.1.5:8000",  # Mobile access
        "http://192.168.1.8:3000",  # Mobile access (actual IP)
        "http://192.168.1.8:8000",  # Mobile access (actual IP)
        "http://192.168.1.11:3000", # Mobile access (current IP)
        "http://192.168.1.11:8000", # Mobile access (current IP)
        "http://192.168.0.0/16",    # Allow all 192.168.x.x for mobile testing
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate that SECRET_KEY is properly set for production."""
        if not v or v == "your-secret-key-here-change-in-production":
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError("SECRET_KEY must be set to a secure value in production")
            # Allow default for development
            return v
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_token_expiry(cls, v: int) -> int:
        """Validate token expiry is reasonable."""
        if v < 15:  # Minimum 15 minutes
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be at least 15 minutes")
        if v > 60 * 24 * 7:  # Maximum 7 days
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES should not exceed 7 days")
        return v

    @field_validator("SQLALCHEMY_DATABASE_URI")
    @classmethod
    def validate_database_uri(cls, v: Optional[str]) -> Optional[str]:
        """Validate database URI format."""
        if not v:
            raise ValueError("SQLALCHEMY_DATABASE_URI must be set")
        # Allow both PostgreSQL and SQLite for development
        if not (v.startswith("postgresql://") or v.startswith("sqlite:///")):
            raise ValueError("SQLALCHEMY_DATABASE_URI must be a valid PostgreSQL or SQLite URI")
        return v

    # Database settings - SQLite for development
    SQLALCHEMY_DATABASE_URI: Optional[str] = "sqlite:///./healthlog.db"

    # User management
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    # Test user for development
    TEST_USER_EMAIL: str = "test@example.com"
    TEST_USER_PASSWORD: str = "test123"

    # Registration settings
    REGISTRATION_ENABLED: bool = True

    # Health logging settings
    HEALTH_LOGGING_ENABLED: bool = True
    MAX_DAILY_LOGS: int = 50  # Max logs per day per user
    LOG_RETENTION_DAYS: int = 365  # Keep logs for 1 year
    
    # Security settings
    RATE_LIMITING_ENABLED: bool = True  # Enabled for MVP security
    REDIS_URL: Optional[str] = None  # Redis URL for rate limiting and caching

    # External API settings
    WGER_API: Optional[str] = None  # wger.de API key for exercise data


    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"  # Ignore extra environment variables
    }

settings = Settings()
