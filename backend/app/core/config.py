from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import logging
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
        "http://127.0.0.1:3000",  # Alternate loopback
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
    SQLALCHEMY_DATABASE_URI: Optional[str] = (
        "postgresql://postgres:test@localhost:5432/ai_companion"
    )
    DATABASE_URL: Optional[str] = None  # Prefer explicit env; default to Postgres via validator

    # JWT Settings
    ALGORITHM: str = "HS256"  # Algorithm for JWT token generation

    # LLM Provider API Key (renamed from TOGETHER_API_KEY)
    LLM_KEY: str = ""
    # Optional: OpenAI-compatible or provider-specific base URL (e.g., aimlapi)
    LLM_BASE_URL: str = ""
    # Model routing (env overrides). Leave blank to use in-code defaults.
    LLM_MODEL_DEFAULT: str = ""
    LLM_MODEL_FAST: str = ""
    LLM_MODEL_VISION: str = ""
    LLM_MODEL_SUMMARY: str = ""

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
        pg_user = values.get("POSTGRES_USER") or "postgres"
        pg_pass = values.get("POSTGRES_PASSWORD") or "postgres"
        pg_host = values.get("POSTGRES_SERVER") or "localhost"
        pg_db = values.get("POSTGRES_DB") or "ai_companion"
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
    RETRIEVAL_TOP_K: int = 12
    RETRIEVAL_RECENT_MESSAGES: int = 5
    # MMR diversification strength (0 -> focus on similarity, 1 -> focus on diversity)
    RETRIEVAL_MMR_LAMBDA: float = 0.7
    MEMORY_MIN_RELEVANCE: float = 0.5
    # Memory Evolution Flags
    MEMORY_DECAY_ENABLED: bool = True
    MEMORY_DECAY_HALF_LIFE_DAYS: int = 90
    MEMORY_MAX_MEMORIES: int = 500
    MEMORY_FORGET_AGE_DAYS: int = 90
    PERSONALITY_REFLECTION_ENABLED: bool = True
    GOAL_TRACKING_ENABLED: bool = True
    # Core Promotion (feature-flagged)
    MEMORY_CORE_AUTOPROMOTE_ENABLED: bool = False
    MEMORY_CORE_IMPORTANCE_MIN: float = 0.85
    MEMORY_CORE_REINFORCE_MIN: int = 2
    # Smart gating threshold for saving non-explicit chat messages
    MEMORY_IMPORTANCE_MIN: float = 0.7
    # Hybrid LLM classifier flags
    MEMORY_LLM_CLASSIFIER_ENABLED: bool = True
    MEMORY_SENSITIVITY_BLOCK_MIN: float = 0.85
    # Importance grading (UI 0..100)
    IMPORTANCE_LLM_ENABLED: bool = True
    # Relevance scoring tunables
    RELEVANCE_RECENCY_DECAY_ENABLED: bool = True
    # Half-lives by type (days)
    RELEVANCE_HALFLIFE_PREFERENCE_DAYS: int = 365
    RELEVANCE_HALFLIFE_PROFILE_DAYS: int = 365
    RELEVANCE_HALFLIFE_FACT_DAYS: int = 14
    RELEVANCE_HALFLIFE_MESSAGE_DAYS: int = 7
    RELEVANCE_HALFLIFE_CONVERSATION_DAYS: int = 14
    # Type/source priors
    RELEVANCE_PRIOR_PREFERENCE: float = 0.05
    RELEVANCE_PRIOR_PROFILE: float = 0.03
    RELEVANCE_PRIOR_FACT: float = 0.02
    RELEVANCE_PRIOR_MESSAGE: float = 0.02
    RELEVANCE_PRIOR_CONVERSATION: float = 0.01
    # Overlap bonus
    RELEVANCE_OVERLAP_BONUS_PER_MATCH: float = 0.02
    RELEVANCE_OVERLAP_BONUS_MAX: float = 0.08
    # Memory policy: auto-capture allowlist and quotas
    MEMORY_ALLOWED_TYPES: list[str] = [
        "preference",
        "fact",
        "profile",
        "message",
        "onboarding",
        "conversation",
    ]
    MEMORY_MAX_AUTOSAVED_PER_MINUTE: int = 2
    MEMORY_MAX_AUTOSAVED_PER_DAY: int = 40
    # PII handling
    MEMORY_BLOCK_PII: bool = True
    MEMORY_REDACT_PII: bool = False
    # Importance floor when LLM extraction succeeds (0..1)
    MEMORY_EXTRACTION_IMPORTANCE_FLOOR: float = 0.75
    # Calendar NL via LLM extraction
    CALENDAR_NL_LLM_ENABLED: bool = False
    # Lifecycle controls
    MEMORY_MAX_ITEMS_PER_USER: int = 20000
    MEMORY_SOFT_FORGET_ON_WRITE: bool = True
    # Backwards-compatible names used in service helpers
    MEMORY_MAX_MEMORIES: int = 20000
    MEMORY_FORGET_AGE_DAYS: int = 90

    # Scheduler
    SCHEDULER_ENABLED: bool = True

    # Timeline diagnostics (SSE events, reply tracing)
    TIMELINE_ENABLED: bool = True

    # Retrieval debug: allow endpoints to return extra scoring detail for diagnostics
    DEBUG_RETRIEVAL_ENABLED: bool = True

    # Chat action suggestions: when enabled, assistant replies may include fenced
    # ```actions blocks with suggested actions for the frontend to confirm/execute
    ACTIONS_SUGGESTIONS_ENABLED: bool = True

    # Privacy: control whether the full serialized onboarding/profile text may be disclosed verbatim
    # in self-referential queries (e.g., "What do you know about me?"). Defaults to False to prevent
    # verbatim dumping; high-level summaries are provided instead.
    PROFILE_VERBATIM_DISCLOSURE_ALLOWED: bool = False

    # Load env from backend/.env irrespective of current working directory
    _ENV_PATH = str(Path(__file__).resolve().parents[2] / ".env")
    model_config = SettingsConfigDict(
        env_file=_ENV_PATH,
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()

# Log whether LLM key is present (do not log the key itself)
_logger = logging.getLogger(__name__)
if getattr(settings, "LLM_KEY", "").strip():
    _logger.info("LLM key detected from env file.")
else:
    _logger.warning(
        "LLM key not found. Ensure backend/.env has LLM_KEY and the server was restarted."
    )
