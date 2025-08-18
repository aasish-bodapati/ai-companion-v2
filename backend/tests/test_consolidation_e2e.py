import json
from typing import Any, Dict

import pytest

from app.db.session import SessionLocal
from app.models.user import User
from app.memory.service import MemoryService
from app.memory import faiss_store
from app.memory import embeddings as _emb


@pytest.fixture()
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def test_user(db_session):
    # conftest client fixture ensures this user exists; but guard-create if needed
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(email="test@example.com", hashed_password="x", full_name="Test User")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


def _vec(dim=384):
    # simple deterministic vector
    return [0.01] * dim


def test_consolidation_noop_same_content(monkeypatch, db_session, test_user):
    svc = MemoryService()

    # Mock embeddings to return a vector
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [_vec()], raising=True)

    # Track FAISS add/update calls
    add_calls = {"n": 0}
    upd_calls = {"n": 0}

    def _add(user_id, ids, vecs):
        add_calls["n"] += 1

    def _upd(user_id, target_id, new_vec):
        upd_calls["n"] += 1
        return True

    monkeypatch.setattr(faiss_store, "add", _add, raising=True)
    monkeypatch.setattr(faiss_store, "update_vector", _upd, raising=True)

    user_id = str(test_user.id)
    # Ensure clean state for this user
    from app.crud.memory import memory as crud_mem
    crud_mem.delete_user_memories(db_session, user_id)

    content = "email: user@example.com"
    # First write creates a node and vector
    faiss_id_1 = svc.store_memory(
        db=db_session,
        content=content,
        content_type="fact",
        user_id=user_id,
        conversation_id=None,
        metadata={"source": "test"},
    )
    assert isinstance(faiss_id_1, str)
    assert add_calls["n"] == 1

    # Second write with same key+content should be a consolidation no-op (metadata update only)
    faiss_id_2 = svc.store_memory(
        db=db_session,
        content=content,
        content_type="fact",
        user_id=user_id,
        conversation_id=None,
        metadata={"source": "test2"},
    )
    assert faiss_id_2 == faiss_id_1
    # No new add, no update_vector
    assert add_calls["n"] == 1
    assert upd_calls["n"] == 0


def test_consolidation_updates_on_change(monkeypatch, db_session, test_user):
    svc = MemoryService()

    # Mock embeddings to return a vector
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [_vec()], raising=True)

    # Track FAISS changes
    add_calls = {"n": 0}
    upd_calls = {"n": 0}

    def _add(user_id, ids, vecs):
        add_calls["n"] += 1

    def _upd(user_id, target_id, new_vec):
        upd_calls["n"] += 1
        return True

    monkeypatch.setattr(faiss_store, "add", _add, raising=True)
    monkeypatch.setattr(faiss_store, "update_vector", _upd, raising=True)

    user_id = str(test_user.id)
    # Ensure clean state for this user
    from app.crud.memory import memory as crud_mem
    crud_mem.delete_user_memories(db_session, user_id)

    content_v1 = "email: user@example.com"
    content_v2 = "email: new@example.com"

    # First write
    faiss_id_1 = svc.store_memory(
        db=db_session,
        content=content_v1,
        content_type="fact",
        user_id=user_id,
        conversation_id=None,
        metadata={"source": "test"},
    )
    assert isinstance(faiss_id_1, str)
    assert add_calls["n"] == 1

    # Second write with changed value should trigger update_vector
    faiss_id_2 = svc.store_memory(
        db=db_session,
        content=content_v2,
        content_type="fact",
        user_id=user_id,
        conversation_id=None,
        metadata={"source": "test2"},
    )
    assert faiss_id_2 == faiss_id_1
    assert upd_calls["n"] == 1

    # Verify DB content updated
    from app.crud.memory import memory as crud_mem

    node = crud_mem.get_memory_by_faiss_id(db_session, faiss_id_1)
    assert node is not None
    assert node.content == content_v2
    # Content hash present in metadata
    md: Dict[str, Any] = json.loads(node.memory_metadata or "{}")
    assert md.get("content_hash") is not None
    assert md.get("consolidation_key") == "email"
