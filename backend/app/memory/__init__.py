from app.core.config import settings


def memory_enabled() -> bool:
    return bool(getattr(settings, "MEMORY_ENABLED", False))


def provider() -> str:
    return getattr(settings, "MEMORY_PROVIDER", "faiss")


