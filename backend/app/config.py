from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Companion"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ai_companion"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
