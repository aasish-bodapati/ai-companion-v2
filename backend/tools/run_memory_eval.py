"""
Memory Capture & Retrieval Evaluation

Generates 50 diverse messages for a working professional with fitness and nutrition goals,
feeds them through AutoMemoryService, and reports:
- Capture rate and counts by content_type
- Importance stats and consolidation activity
- Retrieval linkage: for sample questions, how many memories are used and avg overlap score

Run:
  python backend/tools/run_memory_eval.py
"""

from __future__ import annotations

import json
import random
from collections import Counter, defaultdict
import re
import argparse
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base_class import Base
from app.models.user import User
from app.models.memory import MemoryNode
from app.services.auto_memory import AutoMemoryService
from app.core.config import settings
from app.core.security import get_password_hash


def _disable_vector_ops() -> None:
    """Monkeypatch embedding and FAISS ops to run fully offline.

    - app.memory.embeddings.embed_texts: returns zero vectors
    - app.memory.faiss_store.add/update_vector: no-ops
    """
    try:
        import types
        from app.memory import embeddings as _emb
        from app.memory import faiss_store as _faiss

        def _stub_embed_texts(texts, model_name: str | None = None):  # type: ignore
            # 384-dim zero vector consistent with project defaults
            dim = 384
            return [[0.0] * dim for _ in texts]

        def _noop(*args, **kwargs):  # type: ignore
            return None

        # Patch functions
        _emb.embed_texts = _stub_embed_texts  # type: ignore[attr-defined]
        _faiss.add = _noop  # type: ignore[attr-defined]
        _faiss.update_vector = _noop  # type: ignore[attr-defined]
    except Exception:
        # If modules aren't importable, proceed without failing the evaluation
        pass


def _tokenize(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z0-9]+", text or "")
    return set(t.lower() for t in tokens)


def _overlap_score(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / max(1, len(a))


def _lexical_retrieval_stats(db, user_id: str, question: str) -> Tuple[int, float]:
    """Lexical overlap proxy for retrieval metrics.

    Returns (used_count, avg_overlap) for top-5 overlaps above a tiny threshold.
    """
    q_tokens = _tokenize(question)
    candidates = []
    for m in db.query(MemoryNode).filter(MemoryNode.user_id == user_id).all():
        content = m.content or ""
        if not content.strip():
            continue
        score = _overlap_score(q_tokens, _tokenize(content))
        if score > 0:
            candidates.append(score)
    if not candidates:
        return 0, 0.0
    candidates.sort(reverse=True)
    topk = candidates[:5]
    return len(topk), sum(topk) / len(topk)


@dataclass
class EvalResult:
    total_messages: int
    captured_count: int
    capture_rate: float
    by_type: Dict[str, int]
    importance_avg: float
    importance_p95: int
    consolidated_updates: int
    retrieval_stats: Dict[str, Dict[str, float]]
    expected_vs_actual: Dict[str, Dict[str, int]]  # confusion counts
    expected_totals: Dict[str, int]  # how many seeds expected per class
    mismatch_warning: Optional[str]
    last_nodes_sample: List[Tuple[str, str, str]]  # (id, type, snippet)
    missed_expected: Dict[str, int]  # expected - captured per class


def _seed_messages() -> List[Dict[str, Optional[str]]]:
    """Create ~50 diverse seeds with expected content_type and optional action mapping.

    Each item: {"text", "expected", "mode", "action_name"}
      - mode: "preference" | "action" | "message"
      - expected: desired content_type (e.g., profile, goal, fact, preference, conversation, message)
    """
    seeds: List[Dict[str, Optional[str]]] = []
    # Profile/work (expected profile)
    seeds += [
        {"text": "I work as a software engineer at ZephyrAI", "expected": "profile", "mode": "message"},
        {"text": "My job is tech lead on the platform team", "expected": "profile", "mode": "message"},
        {"text": "I live in Bangalore, close to Indiranagar", "expected": "profile", "mode": "message"},
    ]
    # Preferences (preference mode)
    for p in [
        "I like matcha",
        "I enjoy trail running",
        "I prefer high-protein breakfast",
        "I dislike fried food",
        "I love strength training on weekends",
    ]:
        seeds.append({"text": p, "expected": "preference", "mode": "preference"})
    # Goals (expected goal)
    for g in [
        "My goal is to run a half marathon in 3 months",
        "I want to bench press 100kg by December",
        "I plan to cook at home 5 days a week",
    ]:
        seeds.append({"text": g, "expected": "goal", "mode": "message"})
    # Facts via action capture (use journal/hydration-like actions)
    for f in [
        "Doctor appointment next week on 09/12/2025",
        "Gym session at 07:30 on weekdays",
        "Meeting with client tomorrow at 10:00",
        "I am allergic to peanuts",
        "I usually sleep at 11pm",
    ]:
        seeds.append({"text": f, "expected": "fact", "mode": "action", "action_name": "journal.add_entry"})
    # Conversation-like messages
    for c in [
        "Hi",
        "Thanks",
        "Okay",
        "Let's do it",
        "That sounds good",
        "Can you help me plan meals?",
        "What do you remember about me?",
        "Please remember I prefer morning workouts",
        "Schedule a leg day next week",
        "I'm feeling motivated to train today",
        "I'm stressed due to deadlines",
    ]:
        seeds.append({"text": c, "expected": "message", "mode": "message"})
    # Nutrition specifics (preferences)
    for n in [
        "I avoid dairy because it upsets my stomach",
        "I like salmon and quinoa for lunch",
        "I need to hit 150g protein daily",
        "I hate sugary drinks",
        "I prefer Greek yogurt as a snack",
    ]:
        seeds.append({"text": n, "expected": "preference", "mode": "preference"})
    # Fitness schedule/goals
    for f in [
        "I usually run 5km on Tuesdays",
        "Strength training on Saturday mornings",
        "I want to improve my 5k time",
        "Next month I will start yoga",
        "I plan to track my macros",
    ]:
        seeds.append({"text": f, "expected": "goal", "mode": "message"})
    # Consolidation probes (near-duplicates / updates)
    seeds += [
        {"text": "I like matcha lattes", "expected": "preference", "mode": "preference"},
        {"text": "Update: I like iced matcha lattes now", "expected": "preference", "mode": "preference"},
        {"text": "I work as a software engineer", "expected": "profile", "mode": "message"},
        {"text": "Now I am a senior software engineer", "expected": "profile", "mode": "message"},
    ]
    # Fillers to reach ~50
    fillers = [
        {"text": "Project deadline is by next week", "expected": "fact", "mode": "action", "action_name": "journal.add_entry"},
        {"text": "Family trip planned next month", "expected": "conversation", "mode": "message"},
        {"text": "I enjoy hiking with friends", "expected": "preference", "mode": "preference"},
        {"text": "I love black coffee", "expected": "preference", "mode": "preference"},
        {"text": "I avoid late-night snacks", "expected": "preference", "mode": "preference"},
        {"text": "My favorite cuisine is Japanese", "expected": "preference", "mode": "preference"},
        {"text": "I am feeling confident about my plan", "expected": "conversation", "mode": "message"},
        {"text": "I need to sleep at least 7 hours", "expected": "goal", "mode": "message"},
        {"text": "I work at a startup", "expected": "profile", "mode": "message"},
        {"text": "I am learning about nutrition", "expected": "profile", "mode": "message"},
    ]
    seeds += fillers
    # Trim/pad
    if len(seeds) > 50:
        seeds = seeds[:50]
    while len(seeds) < 50:
        seeds.append({"text": "I like healthy meals", "expected": "preference", "mode": "preference"})
    return seeds


def _as_context(content_type: str, conversation_id: str | None) -> Dict[str, str]:
    return {
        "content_type": content_type,
        "source": "chat_message",
        "conversation_id": conversation_id or "conv-1",
    }


def run_eval(email: str, password: str) -> EvalResult:
    # Ensure vector ops (embeddings/FAISS) do not trigger downloads or external calls
    _disable_vector_ops()
    # Make auto-capture more permissive for this eval
    settings.AUTO_MEMORY_ENABLED = True
    settings.AUTO_IMPORTANCE_THRESHOLD = 0.2  # will be further relaxed per heuristics
    settings.AUTO_LIFECYCLE_ENABLED = False

    # In-memory DB
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # user (hash provided password securely)
        user = User(email=email, hashed_password=get_password_hash(password))
        db.add(user)
        db.commit()
        user_id = user.id

        service = AutoMemoryService()
        messages = _seed_messages()

        captured: List[MemoryNode] = []
        consolidated_updates = 0
        confusion: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        expected_totals: Dict[str, int] = defaultdict(int)

        for item in messages:
            text = item["text"] or ""
            expected = (item.get("expected") or "message").lower()
            mode = (item.get("mode") or "message").lower()
            created_node: Optional[MemoryNode] = None

            expected_totals[expected] += 1

            pre_count = db.query(MemoryNode).count()
            if mode == "preference":
                # naive subject extraction after the first verb phrase
                lowered = text.lower()
                for prefix in ["i like ", "i love ", "i enjoy ", "i prefer ", "i hate ", "i avoid "]:
                    if lowered.startswith(prefix):
                        subject = text[len(prefix):].strip() or text
                        break
                else:
                    subject = text
                created_node = service.store_preference(user_id=user_id, conversation_id=None, subject=subject, db=db)
            elif mode == "action":
                action_name = item.get("action_name") or "journal.add_entry"
                # Apply a temporary importance bias by lowering threshold (more permissive for actions)
                orig_thresh = getattr(settings, "AUTO_IMPORTANCE_THRESHOLD", 0.2)
                try:
                    settings.AUTO_IMPORTANCE_THRESHOLD = max(0.0, orig_thresh - 0.3)
                    created_node = service.capture_from_action(
                        db=db,
                        user_id=user_id,
                        action_name=action_name,
                        action_params={"text": text},
                        result={"ok": True},
                    )
                finally:
                    settings.AUTO_IMPORTANCE_THRESHOLD = orig_thresh
                # Fallback: if nothing was created and expected was fact, try message path with fact context
                if created_node is None and expected == "fact":
                    created_node = service.auto_capture_memory(db, user_id, text, _as_context("fact", None))
            else:  # message
                # Pass expected as desired content_type in context
                ctx_type = expected if expected in {"message", "preference", "goal", "profile", "fact", "conversation"} else "message"
                created_node = service.auto_capture_memory(db, user_id, text, _as_context(ctx_type, None))

            post_count = db.query(MemoryNode).count()
            if created_node is not None and post_count > pre_count:
                captured.append(created_node)
                actual = (created_node.content_type or "").lower() or "message"
                confusion[expected][actual] += 1

        # Consolidation metric: look for nodes whose content contains multiple sentences joined with Update: or merged sentences
        for m in db.query(MemoryNode).all():
            if "Update:" in (m.content or ""):
                consolidated_updates += 1

        total = len(messages)
        by_type = Counter(m.content_type for m in db.query(MemoryNode).all())
        all_nodes = db.query(MemoryNode).all()
        importance_vals = [int(getattr(m, "importance_score") or 0) for m in all_nodes]
        importance_avg = (sum(importance_vals) / len(importance_vals)) if importance_vals else 0.0
        importance_p95 = sorted(importance_vals)[int(0.95 * len(importance_vals)) - 1] if importance_vals else 0

        # Retrieval checks for sample questions
        retrieval_stats: Dict[str, Dict[str, float]] = {}
        sample_questions = {
            "meal_planning": "Plan high-protein meals avoiding dairy and peanuts",
            "training_plan": "Build a weekly plan to improve my 5k and strength",
            "allergies": "What should I avoid based on my allergies?",
            "profile": "What do you know about my job and location?",
        }
        for key, q in sample_questions.items():
            used, avg_overlap = _lexical_retrieval_stats(db, user_id, q)
            retrieval_stats[key] = {"used_memories": used, "avg_overlap": avg_overlap}

        # Build diagnostics
        captured_conf_total = sum(sum(d.values()) for d in confusion.values())
        mismatch_warning: Optional[str] = None
        if captured_conf_total != len(all_nodes):
            mismatch_warning = f"Confusion total ({captured_conf_total}) != captured_count ({len(all_nodes)})"
        # Missed expected counts
        missed_expected = {k: max(0, expected_totals.get(k, 0) - sum(confusion.get(k, {}).values())) for k in expected_totals}
        # Last nodes sample (up to 5)
        last_nodes_sample: List[Tuple[str, str, str]] = []
        for m in all_nodes[-5:]:
            snippet = (m.content or "")[:60].replace("\n", " ")
            last_nodes_sample.append((str(m.id), m.content_type or "", snippet))

        return EvalResult(
            total_messages=total,
            captured_count=len(all_nodes),
            capture_rate=(len(all_nodes) / total) if total else 0.0,
            by_type=dict(by_type),
            importance_avg=importance_avg,
            importance_p95=importance_p95,
            consolidated_updates=consolidated_updates,
            retrieval_stats=retrieval_stats,
            expected_vs_actual={ek: dict(v) for ek, v in confusion.items()},
            expected_totals=dict(expected_totals),
            mismatch_warning=mismatch_warning,
            last_nodes_sample=last_nodes_sample,
            missed_expected=missed_expected,
        )
    finally:
        db.close()


def _pretty_print(res: EvalResult) -> None:
    print("=== Memory System Evaluation ===")
    print(f"Total messages:        {res.total_messages}")
    print(f"Captured memories:      {res.captured_count}")
    print(f"Capture rate:           {res.capture_rate:.2%}")
    print("By content_type:")
    for k, v in sorted(res.by_type.items()):
        print(f"  - {k}: {v}")
    print(f"Avg importance:         {res.importance_avg:.1f}")
    print(f"P95 importance:         {res.importance_p95}")
    print(f"Consolidated updates:   {res.consolidated_updates}")
    print("Retrieval stats:")
    for q, s in res.retrieval_stats.items():
        print(f"  - {q}: used={s['used_memories']:.0f}, avg_overlap={s['avg_overlap']:.3f}")
    print("Expected vs Actual (confusion):")
    for expected, counts in res.expected_vs_actual.items():
        details = ", ".join(f"{act}:{cnt}" for act, cnt in sorted(counts.items()))
        print(f"  - {expected} -> {details}")
    # Missed expected summary
    print("Missed expected (not captured):")
    for k, v in sorted(res.missed_expected.items()):
        print(f"  - {k}: {v}")
    # Diagnostics
    if res.mismatch_warning:
        print(f"[diag] {res.mismatch_warning}")
        print("[diag] Last captured nodes:")
        for nid, ctype, snippet in res.last_nodes_sample:
            print(f"    id={nid} type={ctype} content='{snippet}'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Memory capture & retrieval evaluation")
    parser.add_argument("--email", default="eval@example.com", help="User email to create/use in eval DB")
    parser.add_argument(
        "--password",
        default="changeme",
        help="User password to hash for eval DB (not logged)",
    )
    args = parser.parse_args()

    res = run_eval(email=args.email, password=args.password)
    _pretty_print(res)
