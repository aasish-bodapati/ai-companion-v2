import unittest
from datetime import datetime

from app.memory.service_mixins_retrieval import _mmr_select
from app.schemas.memory import MemorySearchResult


class TestMMRSelection(unittest.TestCase):
    def _mk(self, content: str, score: float) -> MemorySearchResult:
        return MemorySearchResult(
            faiss_id="m",
            content=content,
            content_type="fact",
            memory_metadata=None,
            relevance_score=score,
            timestamp=datetime.utcnow(),
        )

    def test_mmr_diversity(self):
        # Two clusters: sports vs. cooking. Highest 3 relevance are sports; MMR should pull at least one cooking.
        candidates = [
            self._mk("I love football and soccer matches", 0.95),
            self._mk("Basketball playoffs are exciting sports", 0.93),
            self._mk("Soccer world cup news and football stats", 0.90),
            self._mk("Italian pasta recipes with tomato and basil", 0.88),
            self._mk("Baking bread and cooking pastries", 0.85),
        ]
        out = _mmr_select(candidates, k=3, mmr_lambda=0.7)
        self.assertEqual(len(out), 3)
        contents = " \n".join(m.content for m in out)
        # Expect at least one cooking-related item included for diversity
        self.assertTrue(
            ("pasta" in contents) or ("baking" in contents) or ("cooking" in contents)
        )

    def test_mmr_deterministic(self):
        candidates = [
            self._mk("alpha beta gamma", 0.9),
            self._mk("alpha beta", 0.85),
            self._mk("delta epsilon zeta", 0.8),
            self._mk("eta theta iota", 0.75),
        ]
        out1 = _mmr_select(list(candidates), k=2, mmr_lambda=0.6)
        out2 = _mmr_select(list(candidates), k=2, mmr_lambda=0.6)
        self.assertEqual([m.content for m in out1], [m.content for m in out2])


if __name__ == "__main__":
    unittest.main()
