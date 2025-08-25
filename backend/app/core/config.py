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
    # For local dev, use PostgreSQL
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    DATABASE_URL: Optional[str] = None  # Will use PostgreSQL default

    # JWT Settings
    ALGORITHM: str = "HS256"  # Algorithm for JWT token generation

    # Redis (optional) for idempotency and rate limiting
    REDIS_URL: str = ""
    IDEMPOTENCY_TTL_SECONDS: int = 600

    # Rate limiting (enabled when Redis is configured)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_SEND_PER_WINDOW: int = 60
    RATE_LIMIT_REPLY_PER_WINDOW: int = 60

    # LLM Provider API Key (OpenRouter - Free Models)
    LLM_KEY: str = ""
    # Optional: OpenAI-compatible or provider-specific base URL
    LLM_BASE_URL: str = "https://openrouter.ai/api/v1"
    # Model routing (env overrides). Using Llama 3.3 70B for better performance
    LLM_MODEL_DEFAULT: str = "meta-llama/llama-3.3-70b-instruct"
    LLM_MODEL_FAST: str = "mistralai/mistral-small-3.2-24b-instruct"
    LLM_MODEL_VISION: str = "meta-llama/llama-3.2-11b-vision-instruct:free"
    LLM_MODEL_SUMMARY: str = "meta-llama/llama-3.3-70b-instruct"

    # OpenTelemetry (optional)
    OTEL_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_ENDPOINT: str = ""  # e.g., http://localhost:4318 or grpc endpoint
    OTEL_SERVICE_NAME: str = "ai-companion-backend"
    OTEL_ENVIRONMENT: str = "dev"

    # Admin User Credentials
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword123"

    # Test User Credentials
    TEST_USERNAME: str = "test@example.com"
    TEST_PASSWORD: str = "testpassword123"

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        # 1) If provided explicitly and non-empty, use as-is
        if isinstance(v, str) and v.strip():
            return v.strip()

        # 2) Prefer DATABASE_URL if set and non-empty
        db_url = info.data.get("DATABASE_URL")
        if isinstance(db_url, str) and db_url.strip():
            return db_url.strip()

        # 3) Default to SQLite file for local development
        project_root = Path(__file__).resolve().parents[2]
        sqlite_path = (project_root / "data" / "minimal.db").as_posix()
        return f"sqlite:///{sqlite_path}"

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

    # Calendar feature debugging (SQL + command routing traces)
    CALENDAR_DEBUG_ENABLED: bool = False

    # Chat action suggestions: when enabled, assistant replies may include fenced
    # ```actions blocks with suggested actions for the frontend to confirm/execute
    ACTIONS_SUGGESTIONS_ENABLED: bool = True
    # Two-pass self-critique and refinement (STaR-like) for higher quality replies
    CRITIQUE_REFINE_ENABLED: bool = False
    # Streaming (SSE) endpoints toggle. When False, streaming routes are not mounted.
    STREAMING_ENABLED: bool = False
    # Dual write: persist chat-captured notes/tasks/reminders to SQL tables and memory
    DUAL_WRITE_ENABLED: bool = True
    
    # Direct command execution: enable immediate action execution from natural language
    DIRECT_EXECUTION_ENABLED: bool = True
    
    # Disable agentic features per user preference
    AGENT_PLAN_PROGRESS_ENABLED: bool = False
    
    # Automatic memory system settings
    AUTO_MEMORY_ENABLED: bool = True
    AUTO_IMPORTANCE_THRESHOLD: float = 0.6
    AUTO_CONSOLIDATION_ENABLED: bool = True
    AUTO_LIFECYCLE_ENABLED: bool = True
    MEMORY_UI_VISIBLE: bool = False

    # Auto-capture policy (config-driven)
    # Whether to capture freeform user messages as memories (subject to gating)
    CAPTURE_MESSAGES: bool = True
    # Minimum importance for message-type captures (0..100 UI scale)
    MESSAGE_IMPORTANCE_MIN: int = 40
    # Require explicit intent like "remember this" to capture messages
    REQUIRE_EXPLICIT_REMEMBER: bool = False
    # Skip transient action logs (e.g., one-off meals/workouts) unless explicitly remembered
    EXCLUDE_TRANSIENT_LOGS: bool = True
    # When dedupe/consolidation key repeats, increment reinforcement counter in metadata
    REINFORCEMENT_ENABLED: bool = True

    # Privacy: control whether the full serialized onboarding/profile text may be disclosed verbatim
    # in self-referential queries (e.g., "What do you know about me?"). Defaults to False to prevent
    # verbatim dumping; high-level summaries are provided instead.
    PROFILE_VERBATIM_DISCLOSURE_ALLOWED: bool = False

    # Privacy Redaction Controls
    # When enabled, content and metadata for memories are passed through a lightweight PII redactor
    # prior to persistence. Specific categories can be toggled off as needed.
    PRIVACY_REDACTION_ENABLED: bool = True
    PRIVACY_REDACT_EMAIL: bool = True
    PRIVACY_REDACT_PHONE: bool = True
    PRIVACY_REDACT_CREDIT_CARD: bool = True
    PRIVACY_REDACT_SSN: bool = True
    PRIVACY_REDACT_IBAN: bool = True

    # Cookie/CORS hardening
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "lax"  # options: 'lax' | 'strict' | 'none'

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

# Check if we're using local Llama (localhost:11434), DeepSeek, or OpenRouter
is_local_llama = (
    getattr(settings, "LLM_BASE_URL", "").strip() == "http://localhost:11434/v1" or
    "localhost:11434" in getattr(settings, "LLM_BASE_URL", "")
)

is_deepseek = (
    getattr(settings, "LLM_BASE_URL", "").strip() == "https://api.deepseek.com/v1" or
    "api.deepseek.com" in getattr(settings, "LLM_BASE_URL", "")
)

is_openrouter = (
    getattr(settings, "LLM_BASE_URL", "").strip() == "https://openrouter.ai/api/v1" or
    "openrouter.ai" in getattr(settings, "LLM_BASE_URL", "")
)

if getattr(settings, "LLM_KEY", "").strip():
    if is_deepseek:
        _logger.info("DeepSeek R1 Free API key detected from env file.")
    elif is_openrouter:
        _logger.info("OpenRouter API key detected from env file.")
    else:
        _logger.info("LLM key detected from env file.")
elif is_local_llama:
    _logger.info("Using local Llama - no API key required.")
elif is_deepseek:
    _logger.warning(
        "DeepSeek R1 Free requires API key. Ensure backend/.env has LLM_KEY and the server was restarted."
    )
elif is_openrouter:
    _logger.warning(
        "OpenRouter requires API key. Ensure backend/.env has LLM_KEY and the server was restarted."
    )
else:
    _logger.warning(
        "LLM key not found. Ensure backend/.env has LLM_KEY and the server was restarted."
    )
