from app.memory.service import MemoryService


def test_normalize_consolidation_key():
    svc = MemoryService()
    assert svc._normalize_consolidation_key("email: user@example.com") == "email"
    assert svc._normalize_consolidation_key("Email: x") == "email"
    assert svc._normalize_consolidation_key("not a key value") is None
    assert svc._normalize_consolidation_key("") is None
    assert svc._normalize_consolidation_key(None) is None  # type: ignore[arg-type]


def test_content_hash_stable_and_trim_insensitive():
    svc = MemoryService()
    h1 = svc._content_hash("  Hello World  ")
    h2 = svc._content_hash("Hello World")
    assert h1 == h2
    h3 = svc._content_hash("Hello  World")
    # Extra inner space should change the hash (we only strip, not normalize whitespace)
    assert h3 != h2
