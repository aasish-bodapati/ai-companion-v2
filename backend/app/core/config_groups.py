"""
Configuration groups for better organization and maintainability
"""

from typing import Optional, List
from pydantic import BaseSettings, Field


class DatabaseSettings(BaseSettings):
    """Database configuration settings"""
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    DATABASE_URL: Optional[str] = None


class LLMSettings(BaseSettings):
    """LLM configuration settings"""
    LLM_PROVIDER: str = "stub"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_MODEL_DEFAULT: str = "stub-model"
    LLM_MODEL_FAST: str = "stub-model"
    LLM_MODEL_VISION: str = "stub-model"
    LLM_MODEL_SUMMARY: str = "stub-model"
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.7
    LLM_TOP_P: float = 0.9
    LLM_FREQUENCY_PENALTY: float = 0.0
    LLM_PRESENCE_PENALTY: float = 0.0
    LLM_DEV_MODE: bool = False


class SecuritySettings(BaseSettings):
    """Security configuration settings"""
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "lax"


class CORSSettings(BaseSettings):
    """CORS configuration settings"""
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]


class MemorySettings(BaseSettings):
    """Memory and retrieval configuration settings"""
    MEMORY_ENABLED: bool = True
    MEMORY_PROVIDER: str = "faiss"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    FAISS_DATA_DIR: str = "data/faiss"
    RETRIEVAL_TOP_K: int = 20
    RETRIEVAL_RECENT_MESSAGES: int = 10
    RETRIEVAL_MMR_LAMBDA: float = 0.7
    MEMORY_MIN_RELEVANCE: float = 0.25
    MEMORY_MAX_MEMORIES: int = 500
    MEMORY_FORGET_AGE_DAYS: int = 90


class AdminSettings(BaseSettings):
    """Admin and user configuration settings"""
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword123"
    TEST_USERNAME: str = "test@example.com"
    TEST_PASSWORD: str = "testpassword123"
    REGISTRATION_ENABLED: bool = True


class ObservabilitySettings(BaseSettings):
    """Observability and monitoring settings"""
    OTEL_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_ENDPOINT: str = ""
    OTEL_SERVICE_NAME: str = "ai-companion-backend"
    OTEL_ENVIRONMENT: str = "dev"
    TIMELINE_ENABLED: bool = True
    DEBUG_RETRIEVAL_ENABLED: bool = True


class FeatureFlags(BaseSettings):
    """Feature flags for optional functionality"""
    STREAMING_ENABLED: bool = False
    DUAL_WRITE_ENABLED: bool = True
    DIRECT_EXECUTION_ENABLED: bool = True
    AGENT_PLAN_PROGRESS_ENABLED: bool = False
    AUTO_MEMORY_ENABLED: bool = True
    PERSONALITY_REFLECTION_ENABLED: bool = True
    GOAL_TRACKING_ENABLED: bool = True
    ACTIONS_SUGGESTIONS_ENABLED: bool = True
    CRITIQUE_REFINE_ENABLED: bool = False
