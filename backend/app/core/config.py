from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production!
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    SERVER_NAME: str = "ai-companion"
    SERVER_HOST: AnyHttpUrl = "http://localhost:8000"
    
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:3000"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Default Next.js dev server
        "http://localhost:8000",  # Default FastAPI dev server
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        # Accept either a JSON list string or a comma-separated string
        if isinstance(v, str):
            s = v.strip()
            if s == "":
                return []
            if s.startswith("["):
                # JSON-style list
                try:
                    parsed = json.loads(s)
                    # Ensure all are strings
                    return [str(item).strip() for item in parsed]
                except Exception:
                    # Fallback to comma-separated list if JSON parsing fails
                    return [i.strip() for i in s.split(",") if i.strip()]
            # Comma-separated list
            return [i.strip() for i in s.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = "AI Companion API"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "test"
    POSTGRES_DB: str = "ai_companion"
    # For local dev, default directly to Postgres connection string
    SQLALCHEMY_DATABASE_URI: Optional[str] = "postgresql://postgres:test@localhost:5432/ai_companion"
    DATABASE_URL: Optional[str] = None  # Prefer explicit env; default to Postgres via validator
    
    # JWT Settings
    ALGORITHM: str = "HS256"  # Algorithm for JWT token generation
    
    # API Keys
    TOGETHER_API_KEY: str = ""
    
    # Admin User Credentials
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword123"
    
    # Test User Credentials
    TEST_USERNAME: str = "test@example.com"
    TEST_PASSWORD: str = "testpassword123"

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        # 1) If provided explicitly and non-empty, use as-is
        if isinstance(v, str) and v.strip():
            return v.strip()

        # 2) Prefer DATABASE_URL if set and non-empty
        db_url = values.get("DATABASE_URL")
        if isinstance(db_url, str) and db_url.strip():
            return db_url.strip()

        # 3) Default to Postgres on localhost (docker-compose default)
        #    Example: docker service exposes 5432 and we connect from host backend
        pg_user = values.get('POSTGRES_USER') or 'postgres'
        pg_pass = values.get('POSTGRES_PASSWORD') or 'postgres'
        pg_host = values.get('POSTGRES_SERVER') or 'localhost'
        pg_db = values.get('POSTGRES_DB') or 'ai_companion'
        return f"postgresql://{pg_user}:{pg_pass}@{pg_host}:5432/{pg_db}"

    # JWT
    ALGORITHM: str = "HS256"

    # Registration settings
    REGISTRATION_ENABLED: bool = True

    # Memory & Retrieval (feature-flagged)
    MEMORY_ENABLED: bool = True
    MEMORY_PROVIDER: str = "faiss"  # future: "faiss" | "none"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    FAISS_DATA_DIR: str = "data/faiss"
    RETRIEVAL_TOP_K: int = 8
    RETRIEVAL_RECENT_MESSAGES: int = 5
    MEMORY_MIN_RELEVANCE: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()
