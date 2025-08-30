import unittest
from typing import Any, Dict, List, Optional

from app.memory.contextual_retrieval import ContextualMemoryRetriever


class _StubMemoryService:
    def __init__(self):
        self.last_kwargs: Dict[str, Any] = {}

    def search_memories(
        self,
        db,
        query: str,
        user_id: str,
        content_types: Optional[List[str]],
        limit: int,
        min_relevance: float = 0.0,
        conversation_id: Optional[str] = None,
    ):
        # record args for assertion
        self.last_kwargs = {
            "db": db,
            "query": query,
            "user_id": user_id,
            "content_types": content_types,
            "limit": limit,
            "min_relevance": min_relevance,
            "conversation_id": conversation_id,
        }
        return []


class TestContextualRetrieverForwarding(unittest.TestCase):
    def test_conversation_id_forwarded(self):
        retriever = ContextualMemoryRetriever()
        svc = _StubMemoryService()

        out = retriever.get_contextual_memories(
            memory_service=svc,
            db=None,
            user_id="u1",
            current_message="hello",
            conversation_history=[],
            emotional_context={},
            conversation_id="conv123",
            limit=5,
        )
        self.assertEqual(out, [])
        self.assertEqual(svc.last_kwargs.get("conversation_id"), "conv123")
        self.assertIsInstance(svc.last_kwargs.get("limit"), int)


if __name__ == "__main__":
    unittest.main()
