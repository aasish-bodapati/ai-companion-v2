"""
Simplified configuration for HealthLog AI - Health-focused only
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
import secrets
import os
from pathlib import Path


class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "HealthLog AI - Your Personal Wellness Assistant"
    
    # API settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:8000",
        "http://localhost:8001",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:8000",
        "https://localhost:8001",
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database settings
    SQLALCHEMY_DATABASE_URI: Optional[str] = "sqlite:///./data/minimal.db"
    
    # LLM settings
    LLM_PROVIDER: str = "stub"  # "openai", "anthropic", "together", "stub"
    LLM_DEV_MODE: bool = False  # Enable dev mode for testing
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None
    
    # Together AI settings
    TOGETHER_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    TOGETHER_MAX_TOKENS: int = 1000
    TOGETHER_TEMPERATURE: float = 0.7
    
    # OpenAI settings
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 1000
    OPENAI_TEMPERATURE: float = 0.7
    
    # Anthropic settings
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"
    ANTHROPIC_MAX_TOKENS: int = 1000
    ANTHROPIC_TEMPERATURE: float = 0.7

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

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()