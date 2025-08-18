from types import SimpleNamespace

from app.memory.service import memory_service


def test_extract_profile_highlights_prefers_bullets():
    txt = """
- enjoys hiking
- loves tea
Profile: likes short lines
"""
    out = memory_service._extract_profile_highlights(txt, max_bullets=2)
    assert out == ["- enjoys hiking", "- loves tea"]


def test_extract_profile_highlights_fallback_lines():
    txt = "First line\nSecond short line\nA very very very very very very long line that should be ignored in fallback because it's too long to be a concise bullet.\nThird"
    out = memory_service._extract_profile_highlights(txt, max_bullets=3)
    # Should prefix with '- ' and pick short lines first
    assert out[0].startswith("- ") and "First line" in out[0]
    assert out[1].startswith("- ") and "Second short line" in out[1]


def test_increase_rank_boost_by_faiss_id_noop_when_not_owner(monkeypatch):
    # Node owned by someone else
    node = SimpleNamespace(user_id="other-user", memory_metadata=None, content="x")
    from app.crud import memory as mem_mod

    monkeypatch.setattr(mem_mod, "get_memory_by_faiss_id", lambda db, faiss_id: node)
    ok = memory_service.increase_rank_boost_by_faiss_id(
        None, user_id="u1", faiss_id="fid"
    )
    assert ok is False


def test_increase_rank_boost_by_faiss_id_updates(monkeypatch):
    # Happy path
    node = SimpleNamespace(
        user_id="u1", memory_metadata="{}", content="x"
    )
    calls = {"update_md": 0, "update_rel": 0}
    from app.crud import memory as mem_mod

    monkeypatch.setattr(mem_mod, "get_memory_by_faiss_id", lambda db, faiss_id: node)

    def _upd(db, node, content, metadata):
        calls["update_md"] += 1
        # Implementation updates rank_boost field
        assert "rank_boost" in metadata

    monkeypatch.setattr(mem_mod, "update_content_and_metadata", _upd)
    monkeypatch.setattr(mem_mod, "update_relevance_score", lambda db, faiss_id, score: calls.__setitem__("update_rel", calls["update_rel"] + 1))

    ok = memory_service.increase_rank_boost_by_faiss_id(
        None, user_id="u1", faiss_id="fid"
    )
    assert ok is True
    assert calls["update_md"] == 1
    # relevance score bump is optional; ensure no exception path


def test_suppress_memory_by_faiss_id(monkeypatch):
    node = SimpleNamespace(user_id="u1", memory_metadata=None, content="x")
    from app.crud import memory as mem_mod

    monkeypatch.setattr(mem_mod, "get_memory_by_faiss_id", lambda db, faiss_id: node)

    captured = {}

    def _upd(db, node, content, metadata):
        captured.update(metadata)

    monkeypatch.setattr(mem_mod, "update_content_and_metadata", _upd)

    ok = memory_service.suppress_memory_by_faiss_id(None, user_id="u1", faiss_id="fid", ttl_days=1)
    assert ok is True
    assert "suppressed_until" in captured
