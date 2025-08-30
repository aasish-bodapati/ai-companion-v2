import re
from typing import List, Tuple

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory(monkeypatch):
    # Keep memory on for realistic responses; keep embeddings fast
    from app.core.config import settings

    try:
        from app.memory import embeddings as _emb
        from app.memory import faiss_store as _faiss

        monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
        monkeypatch.setattr(settings, "MEMORY_IMPORTANCE_MIN", 0.0, raising=False)
        monkeypatch.setattr(_emb, "embed_texts", lambda texts: [[0.1] * 8 for _ in texts])
        monkeypatch.setattr(_faiss, "add", lambda user_id, ids, vecs: None)
        monkeypatch.setattr(_faiss, "update_vector", lambda user_id, id_, vec: True)
    except Exception:
        pass


def _create_conversation(client: TestClient, title: str = "Conversation Quality") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _ask(client: TestClient, conv_id: str, content: str) -> str:
    r = client.post(
        f"/api/v1/conversations/{conv_id}/reply", json={"role": "user", "content": content}
    )
    assert r.status_code == 200, r.text
    return r.json()["message"]["content"]


def _score_response(text: str) -> Tuple[float, dict]:
    """Heuristic scoring of a single assistant reply.

    Sub-scores (0-10): brevity, questions, markdown, actionability, warmth.
    """
    t = (text or "").strip()
    lines = [ln for ln in t.splitlines() if ln.strip()]
    # brevity: <= 12 lines ideal, <= 16 acceptable
    if len(lines) <= 12:
        brevity = 10.0
    elif len(lines) <= 16:
        brevity = 7.0
    else:
        brevity = max(0.0, 10.0 - 0.8 * (len(lines) - 16))

    # questions: at most 1 ideal
    q_count = t.count("?")
    if q_count <= 1:
        questions = 10.0
    elif q_count == 2:
        questions = 7.5
    elif q_count == 3:
        questions = 5.0
    else:
        questions = 3.0

    # markdown usage: bullets or headings
    has_bullets = any(ln.strip().startswith(("- ", "• ", "* ")) for ln in lines)
    has_heading = any(ln.strip().startswith(("#", "##", "###")) for ln in lines)
    markdown = 10.0 if (has_bullets or has_heading) else 6.0

    # actionability: presence of bullets or enumerations suggests steps
    has_numbers = any(re.match(r"^\s*\d+[).]", ln) for ln in lines)
    actionability = 10.0 if (has_bullets or has_numbers) else 6.5

    # warmth: friendly phrasing indicators (heuristic)
    warm_tokens = [
        "happy to",
        "glad to",
        "can help",
        "let me know",
        "sounds good",
        "here's",
        "i suggest",
        "you could",
        "let's",
    ]
    warmth_hits = sum(1 for w in warm_tokens if w in t.lower())
    warmth = 10.0 if warmth_hits >= 2 else (8.0 if warmth_hits == 1 else 6.5)

    details = {
        "brevity": round(brevity, 2),
        "questions": round(questions, 2),
        "markdown": round(markdown, 2),
        "actionability": round(actionability, 2),
        "warmth": round(warmth, 2),
        "lines": len(lines),
        "q_count": q_count,
    }
    # weighted average (slightly favor readability + actionability)
    score = (
        0.20 * brevity + 0.20 * questions + 0.25 * markdown + 0.25 * actionability + 0.10 * warmth
    )
    return round(score, 2), details


def _aggregate(scores: List[float]) -> float:
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 2)


def test_conversation_quality_scoring(client: TestClient):
    conv_id = _create_conversation(client)

    prompts = [
        "I'm overwhelmed. Two quick tips to regain focus?",
        "Remind me to email Sarah tomorrow morning.",
        "Explain OAuth vs OIDC simply.",
        "Help me plan a 3-step morning routine.",
    ]

    responses: List[str] = []
    for p in prompts:
        responses.append(_ask(client, conv_id, p))

    per_scores: List[float] = []
    breakdowns = []
    for resp in responses:
        s, d = _score_response(resp)
        per_scores.append(s)
        breakdowns.append(d)

    overall = _aggregate(per_scores)

    # Print a compact report (visible in -q failure messages)
    print("Conversation Quality Scores:")
    for i, (s, d) in enumerate(zip(per_scores, breakdowns)):
        print(f"  Turn {i + 1}: {s} — {d}")
    print(f"Overall: {overall}")

    # Expect a reasonably human-like score
    assert overall >= 7.8, f"Overall conversation quality too low: {overall} (scores={per_scores})"
