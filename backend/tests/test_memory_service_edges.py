import json
from types import SimpleNamespace

import app.memory.embeddings as _emb
from app.memory.service import MemoryService


class DummyCRUD:
    def __init__(self):
        self.stored = []

    # Match the signature used by MemoryService.store_memory
    def create_memory_node(
        self,
        *,
        db,
        faiss_id,
        content,
        content_type,
        user_id,
        conversation_id=None,
        metadata=None,
    ):
        node = SimpleNamespace(
            id="node-1",
            faiss_id=faiss_id or "faiss-1",
            user_id=user_id,
            content=content,
            content_type=content_type,
            conversation_id=conversation_id,
            memory_metadata=json.dumps(metadata) if metadata else None,
            relevance_score=1.0,
        )
        self.stored.append(node)
        return node


def test_store_memory_empty_content(monkeypatch):
    svc = MemoryService()

    # Disable LLM classifier to avoid external calls
    import app.memory.service as svc_mod
    monkeypatch.setattr(svc_mod.settings, "MEMORY_LLM_CLASSIFIER_ENABLED", False, raising=False)

    # Fake embeddings to deterministic vector
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.0, 0.0, 0.0] for _ in texts])

    # Fake crud.memory module used inside service
    dummy = DummyCRUD()
    monkeypatch.setattr(svc_mod, "memory", dummy)

    # Empty content should be skipped and return None
    db = object()
    faiss_id = svc.store_memory(db, content="   ", content_type="message", user_id="u1")

    assert faiss_id is None


def test_store_memory_invalid_key_no_consolidation(monkeypatch):
    svc = MemoryService()
    monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[1.0, 0.0, 0.0] for _ in texts])

    import app.memory.service as svc_mod

    # Disable LLM classifier to avoid network and gating side effects
    monkeypatch.setattr(svc_mod.settings, "MEMORY_LLM_CLASSIFIER_ENABLED", False, raising=False)

    dummy = DummyCRUD()
    monkeypatch.setattr(svc_mod, "memory", dummy)

    # Use remember flag to bypass importance threshold
    faiss_id = svc.store_memory(
        object(),
        content="just some note without colon",
        content_type="message",
        user_id="u1",
        metadata={"role": "user", "remember": True},
    )
    assert isinstance(faiss_id, str)
    # Inspect stored node metadata
    assert dummy.stored, "Expected a memory node to be created"
    md = json.loads(dummy.stored[-1].memory_metadata)
    assert md.get("consolidation_key") is None
    assert "content_hash" in md
