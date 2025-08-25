import re
import logging
import os
import json
from pathlib import Path
from typing import List, Tuple, Dict, Set

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_memory(monkeypatch):
    # Enable memory; mock embeddings/FAISS for speed/determinism
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


@pytest.fixture(autouse=True)
def _silence_logs():
    # Show only errors/critical during this test to avoid noisy output
    logging.disable(logging.WARNING)

    noisy = [
        "app",
        "app.main",
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "fastapi",
        "sqlalchemy",
        "sqlalchemy.engine.Engine",
        "httpx",
        "urllib3",
        "anyio",
        "asyncio",
    ]
    for name in noisy:
        lg = logging.getLogger(name)
        lg.setLevel(logging.ERROR)
        lg.propagate = False

    try:
        yield
    finally:
        # Re-enable logging for other tests
        logging.disable(logging.NOTSET)


def _create_conversation(client: TestClient, title: str = "Chat Simulation") -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _ask(client: TestClient, conv_id: str, content: str) -> dict:
    """Call reply endpoint and return assistant text plus context info.
    Returns: { "text": str, "ctx_count": int, "ctx_preview": list }
    """
    r = client.post(
        f"/api/v1/conversations/{conv_id}/reply",
        json={"role": "user", "content": content},
    )
    assert r.status_code == 200, r.text
    body = r.json() or {}
    text = ((body.get("message") or {}).get("content") or "").strip()
    prov = body.get("provenance") or []
    # Build a lightweight preview of provenance for diagnostics (type, score, snippet)
    preview = []
    try:
        for itm in (prov[:3] if isinstance(prov, list) else []):
            ctype = (itm.get("content_type") if isinstance(itm, dict) else None) or "unknown"
            score = (itm.get("relevance_score") if isinstance(itm, dict) else None)
            snippet = (itm.get("content") if isinstance(itm, dict) else "") or ""
            snippet = snippet[:160]
            preview.append({
                "type": ctype,
                "score": score,
                "snippet": snippet,
            })
    except Exception:
        preview = []
    return {"text": text, "ctx_count": len(prov), "ctx_preview": preview}


# ---- Scoring helpers ----

def _score_response(text: str) -> Tuple[float, Dict[str, float]]:
    t = (text or "").strip()
    lines = [ln for ln in t.splitlines() if ln.strip()]

    # brevity: <= 12 ideal, <= 16 ok
    if len(lines) <= 12:
        brevity = 10.0
    elif len(lines) <= 16:
        brevity = 7.5
    else:
        brevity = max(0.0, 10.0 - 0.7 * (len(lines) - 16))

    # questions: at most 1
    q = t.count("?")
    if q <= 1:
        questions = 10.0
    elif q == 2:
        questions = 7.5
    elif q == 3:
        questions = 5.5
    else:
        questions = 4.0

    # markdown
    has_bullets = any(ln.strip().startswith(("- ", "• ", "* ")) for ln in lines)
    has_heading = any(ln.strip().startswith(("#", "##", "###")) for ln in lines)
    markdown = 10.0 if (has_bullets or has_heading) else 6.5

    # actionability
    has_numbers = any(re.match(r"^\s*\d+[).]", ln) for ln in lines)
    actionability = 10.0 if (has_bullets or has_numbers) else 6.5

    # warmth
    warm_tokens = [
        "happy to", "glad to", "can help", "let me know", "here's", "let's",
        "i suggest", "you could",
    ]
    warmth_hits = sum(1 for w in warm_tokens if w in t.lower())
    warmth = 10.0 if warmth_hits >= 2 else (8.0 if warmth_hits == 1 else 6.5)

    # weighted score
    score = (
        0.20 * brevity +
        0.20 * questions +
        0.25 * markdown +
        0.25 * actionability +
        0.10 * warmth
    )

    details = {
        "brevity": round(brevity, 2),
        "questions": round(questions, 2),
        "markdown": round(markdown, 2),
        "actionability": round(actionability, 2),
        "warmth": round(warmth, 2),
        "lines": len(lines),
        "q_count": q,
    }
    return round(score, 2), details


def _aggregate(scores: List[float]) -> float:
    return round(sum(scores) / len(scores), 2) if scores else 0.0


# ---- Session-level scoring (understanding, proactivity, uncertainty, memory) ----

_SAFE_GUARD_PHRASES: Set[str] = {
    "i don't have", "i do not have", "i can't see", "i cannot see",
    "could you share", "can you share", "do you have", "please provide",
}

_PROACTIVE_PHRASES: Set[str] = {
    "next you could", "you could", "you might", "i can also",
    "want me to", "shall i", "i can help", "let me know if you want me",
}


def _content_words(s: str) -> Set[str]:
    s = re.sub(r"[^a-zA-Z0-9]+", " ", (s or "").lower())
    stop = {"i", "a", "an", "the", "and", "or", "to", "of", "in", "it", "is", "are", "on", "for", "me"}
    return {w for w in s.split() if len(w) > 2 and w not in stop}


def _session_scores(user_turns: List[str], assistant_turns: List[str]) -> Tuple[float, Dict[str, float]]:
    # Understanding: average token overlap ratio per turn
    understand_scores: List[float] = []
    for u, a in zip(user_turns, assistant_turns):
        u_tokens = _content_words(u)
        a_tokens = _content_words(a)
        if not u_tokens:
            understand_scores.append(10.0)
            continue
        overlap = len(u_tokens & a_tokens) / max(1, len(u_tokens))
        # map overlap to 0..10 (nonlinear, generous for small overlaps)
        val = min(10.0, 10.0 * (0.5 * overlap + 0.5 * min(1.0, 2.0 * overlap)))
        understand_scores.append(val)
    understanding = round(sum(understand_scores) / len(understand_scores), 2)

    # Proactivity: presence of proactive phrases in any assistant turn
    proactive_hits = 0
    for a in assistant_turns:
        al = (a or "").lower()
        if any(p in al for p in _PROACTIVE_PHRASES):
            proactive_hits += 1
    proactivity = 10.0 if proactive_hits >= 2 else (8.5 if proactive_hits == 1 else 7.0)

    # Uncertainty handling: presence of safe-guard phrases when user asks for unclear stuff
    safeguard_hits = 0
    for a in assistant_turns:
        al = (a or "").lower()
        if any(p in al for p in _SAFE_GUARD_PHRASES):
            safeguard_hits += 1
    uncertainty = 9.0 if safeguard_hits >= 1 else 7.5  # neutral unless seen

    # Memory usage: detect referencing earlier preferences (e.g., jazz, dark mode)
    prefs = _content_words(next((u for u in user_turns if "like" in u.lower() or "prefer" in u.lower()), ""))
    # keep only plausible preference nouns/adjectives by excluding verbs
    likely_prefs = {w for w in prefs if w not in {"like", "prefer", "love"}}
    memory_mentions = 0
    for a in assistant_turns[2:]:  # later turns only
        al = (a or "").lower()
        if any(p in al for p in likely_prefs):
            memory_mentions += 1
    memory = 10.0 if memory_mentions >= 1 else 7.5  # neutral if not used

    # Weighted session score (keep light to avoid flakiness)
    session_score = round(0.06 * understanding + 0.05 * proactivity + 0.04 * uncertainty + 0.06 * memory, 2)
    details = {
        "understanding": understanding,
        "proactivity": round(proactivity, 2),
        "uncertainty": round(uncertainty, 2),
        "memory": round(memory, 2),
        "_session_weighted": session_score,
    }
    return session_score, details


def test_full_chat_simulation_and_score(client: TestClient):
    conv_id = _create_conversation(client)

    # Simulated user session: greeting -> preference -> overwhelm -> reminder -> routine -> explain -> wrap-up
    user_turns = [
        "Hey!",  # casual greeting
        "btw I like jazz and dark mode.",  # preference capture
        "I'm overwhelmed—2 quick tips to reset?",
        "Remind me to email Sarah tomorrow morning.",
        "Help me plan a 3-step morning routine.",
        "Explain Zero Trust simply.",
        "Thanks!",
    ]

    responses: List[dict] = []
    for u in user_turns:
        responses.append(_ask(client, conv_id, u))

    # Score each response
    per_scores: List[float] = []
    breakdowns: List[Dict[str, float]] = []
    for r in responses:
        s, d = _score_response(r.get("text", ""))
        per_scores.append(s)
        breakdowns.append(d)

    overall = _aggregate(per_scores)

    # Session-level scores (use assistant text only)
    session_score, session_details = _session_scores(
        user_turns, [r.get("text", "") for r in responses]
    )
    overall_with_session = round(min(10.0, overall + session_score), 2)

    # Emit a readable summary
    print("\nChat Simulation Scores:")
    for i, (req, resp, s, d) in enumerate(zip(user_turns, responses, per_scores, breakdowns)):
        print(f"Turn {i+1} User: {req}")
        print(f"Turn {i+1} Assistant score: {s} — {d}")
        ctx_used = (resp.get("ctx_count", 0) or 0) > 0
        print(f"Turn {i+1} Context used: {ctx_used} (items={resp.get('ctx_count', 0)})")
    print("Session-level:")
    print(session_details)
    print(f"Overall (turns only): {overall}")
    print(f"Overall (with session): {overall_with_session}")

    # Optional: export detailed results to JSON for CI artifacts
    try:
        if os.getenv("EXPORT_CHAT_SCORES", "").lower() in {"1", "true", "yes"}:
            out_dir = Path("reports")
            out_dir.mkdir(parents=True, exist_ok=True)
            # Compute context usage summary
            context_turns = sum(1 for r in responses if (r.get("ctx_count", 0) or 0) > 0)
            payload = {
                "turns": [
                    {
                        "user": req,
                        "assistant": resp.get("text", ""),
                        "score": s,
                        "details": d,
                        "context_used": (resp.get("ctx_count", 0) or 0) > 0,
                        "context_items": resp.get("ctx_count", 0),
                        "context_preview": resp.get("ctx_preview", []),
                    }
                    for (req, resp, s, d) in zip(user_turns, responses, per_scores, breakdowns)
                ],
                "overall_turns_only": overall,
                "session_details": session_details,
                "overall_with_session": overall_with_session,
                "context_turns_with_usage": context_turns,
                "total_turns": len(responses),
            }
            with (out_dir / "chat_simulation_scores.json").open("w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
    except Exception as _e:
        # Do not fail the test if exporting fails
        logging.getLogger(__name__).warning(f"Failed to export chat simulation scores: {_e}")

    # Expect a strong overall score
    assert overall_with_session >= 7.8, (
        f"Overall chat quality too low: {overall_with_session} (turns={per_scores}, session={session_details})"
    )
