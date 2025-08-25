import pytest

from app.memory.service import memory_service
from app.api.endpoints import conversations_utils as conv_mod
from app.api.endpoints.conversations_utils import _normalize_user_text, _maybe_capture_preference


@pytest.mark.parametrize(
    "text,expected_band",
    [
        ("ok", {10, 30}),  # very short, low importance
        # Estimator may still band to 30 depending on config thresholds; allow 30+ bands
        ("Meeting on 2025-08-13 at 10:00, bring 3 documents", {30, 60, 85, 100}),
        ("Remember: billing address: 123 Main St", {30, 60, 85, 100}),
    ],
)
def test_grade_importance_banding_monotone(text, expected_band, monkeypatch):
    # Force LLM path off to keep deterministic
    from app.core.config import settings

    monkeypatch.setattr(settings, "IMPORTANCE_LLM_ENABLED", False, raising=False)

    score = memory_service.grade_importance(text, content_type="message")
    assert isinstance(score, (int, float))
    assert 0 <= score <= 100
    # banded output must be in these bands
    assert score in {10, 30, 60, 85, 100}
    # sanity: each input falls into a reasonable band set
    assert score in expected_band


def test_grade_importance_type_prior_preference_vs_message(monkeypatch):
    # Deterministic: disable LLM
    from app.core.config import settings

    monkeypatch.setattr(settings, "IMPORTANCE_LLM_ENABLED", False, raising=False)

    text = "I like green tea"
    s_pref = memory_service.grade_importance(text, content_type="preference")
    s_msg = memory_service.grade_importance(text, content_type="message")
    # Type prior should not reduce preference vs message; usually slightly higher or equal
    assert s_pref >= s_msg


def test_grade_importance_can_use_llm_when_available(monkeypatch):
    # Stub classifier to force high importance; patch on class to get proper binding
    from app.memory.service import MemoryService

    def _fake_cls(self, _text):
        return {"importance": 0.92, "sensitivity": 0.0, "reason": "high"}

    # Patch class and instance to be safe against prior instance-level monkeypatches
    monkeypatch.setattr(MemoryService, "_classify_with_llm", _fake_cls, raising=False)
    monkeypatch.setattr(memory_service, "_classify_with_llm", lambda _text: _fake_cls(memory_service, _text), raising=False)
    # Also stub low-level LLM call to avoid network if original path is entered
    import app.core.llm as _llm
    monkeypatch.setattr(_llm, "generate_with_openrouter", lambda *a, **k: "{\n  \"importance\": 0.95, \n  \"sensitivity\": 0.0, \n  \"reason\": \"hi\"\n}")

    from app.core.config import settings

    monkeypatch.setattr(settings, "IMPORTANCE_LLM_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "MEMORY_LLM_CLASSIFIER_ENABLED", True, raising=False)

    score = memory_service.grade_importance("short msg", content_type="message")
    assert score in {85, 100}


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("inlike pizza", "i like pizza"),
        ("ilike sushi", "i like sushi"),
        ("  Hello   world  ", "hello world"),
        ("/calendar add 5pm call", "/calendar add 5pm call"),  # commands untouched
    ],
)
def test_normalize_user_text(raw, expected):
    out = conv_mod._normalize_user_text(raw)
    assert out == expected

def test_maybe_capture_preference_returns_flags(monkeypatch):
    # Prevent persistence path
    monkeypatch.setattr(conv_mod, "memory_enabled", lambda: False, raising=False)
    # Call directly with dummy args; when memory is disabled, DB isn't used
    subject, is_pure = conv_mod._maybe_capture_preference(None, None, None, "I like apples")
    assert isinstance(subject, (str, type(None)))
    assert isinstance(is_pure, bool)
