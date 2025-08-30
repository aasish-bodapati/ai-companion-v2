import json
import os
import re
from datetime import datetime
from typing import Dict, List, Set

import pytest
from app.core.config import settings

# Skip entire module if streaming is disabled
pytestmark = pytest.mark.skipif(
    not getattr(settings, "STREAMING_ENABLED", False),
    reason="Streaming endpoints are disabled",
)
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _enable_auto_memory(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_MEMORY_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_CONSOLIDATION_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "AUTO_IMPORTANCE_THRESHOLD", 0.0, raising=False)


def _create_conversation(client: TestClient, title: str) -> str:
    r = client.post(
        "/api/v1/conversations/",
        json={"title": title, "personalization_enabled": True},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _add_user_message(client: TestClient, conv_id: str, content: str) -> Dict:
    r = client.post(
        f"/api/v1/conversations/{conv_id}/messages", json={"role": "user", "content": content}
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def _reply(client: TestClient, conv_id: str) -> Dict:
    r = client.post(f"/api/v1/conversations/{conv_id}/reply")
    assert r.status_code == 200, r.text
    return r.json()


def _reply_stream(client: TestClient, conv_id: str) -> List[str]:
    chunks: List[str] = []
    with client.stream("POST", f"/api/v1/conversations/{conv_id}/reply/stream") as resp:
        assert resp.status_code == 200
        for i, chunk in enumerate(resp.iter_text()):
            chunks.append(chunk)
            if i > 120:
                break
    return chunks


def _list_messages(client: TestClient, conv_id: str, limit: int = 2000) -> List[Dict]:
    r = client.get(f"/api/v1/conversations/{conv_id}/messages", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def _list_memories(client: TestClient, limit: int = 2000) -> List[Dict]:
    r = client.get("/api/v1/users/me/memories", params={"limit": limit})
    assert r.status_code == 200, r.text
    return r.json()


def _memory_context(client: TestClient, conv_id: str) -> Dict:
    r = client.get(f"/api/v1/conversations/{conv_id}/memory-context")
    assert r.status_code == 200, r.text
    return r.json() or {"context": []}


def _short(s: str, n: int = 160) -> str:
    s = s or ""
    return s if len(s) <= n else s[: n - 3] + "..."


def _ids(items: List[Dict]) -> Set[str]:
    return {str(it.get("id")) for it in items if it.get("id")}


def _flow_messages() -> List[str]:
    # Build a flowing scenario across themes: intro -> profile -> preferences -> schedule -> fitness -> nutrition -> travel -> work -> hobbies -> wrap-up
    msgs: List[str] = []

    # Intro & identity (5)
    msgs += [
        "Hi, I'm Alice.",
        "My full name is Alice Smith.",
        "I live in San Francisco.",
        "My timezone is PST.",
        "I'm a software engineer working at a startup.",
    ]

    # Preferences (15)
    prefs = [
        "I like black coffee.",
        "I prefer tea in the evenings.",
        "I enjoy hiking on weekends.",
        "I love jazz music.",
        "I like mediterranean food.",
        "I prefer spicy food.",
        "I like reading sci-fi novels.",
        "I enjoy yoga.",
        "I love dogs.",
        "I enjoy swimming.",
        "I like road trips.",
        "I enjoy cooking at home.",
        "I like stand-up comedy.",
        "I enjoy board games.",
        "I love photography.",
    ]
    msgs += prefs

    # Schedule & calendar (10)
    sched = [
        "/calendar add 2025-09-01 09:00-10:00 Standup",
        "/calendar add 2025-09-01 13:00-14:00 Lunch with Sarah",
        "/calendar add 2025-09-02 10:00-11:00 1:1 with Manager",
        "/calendar add 2025-09-03 16:00-17:00 Gym",
        "/calendar add 2025-09-04 08:00-08:30 Meditation",
        "/calendar add 2025-09-05 19:00-21:00 Jazz concert",
        "/calendar add 2025-09-06 08:00-12:00 Hiking",
        "/calendar add 2025-09-07 18:00-19:00 Call parents",
        "/calendar add 2025-09-08 12:30-13:15 Therapy",
        "/calendar add 2025-09-09 07:30-08:00 Run",
    ]
    msgs += sched

    # Health & allergies (10)
    msgs += [
        "I am allergic to peanuts.",
        "I have mild lactose intolerance.",
        "I'm trying to improve my cardio fitness.",
        "I want to run a 10K in 3 months.",
        "I need a balanced nutrition plan.",
        "I usually sleep around midnight.",
        "I want to drink more water.",
        "I prefer morning workouts.",
        "I need to track my resting heart rate.",
        "I get migraines occasionally.",
    ]

    # Fitness logging (15)
    fitness = [
        "I did a 5km run today.",
        "I completed 30 minutes of yoga.",
        "I did 3 sets of 12 push-ups.",
        "I went swimming for 45 minutes.",
        "I walked 10,000 steps.",
        "I cycled for 20 km.",
        "I did a HIIT workout for 25 minutes.",
        "I stretched for 15 minutes.",
        "I did 4 sets of squats.",
        "I did 3x10 pull-ups.",
        "I trained core for 20 minutes.",
        "I did 2 hours of hiking.",
        "I played tennis for 60 minutes.",
        "I did a mobility session for 30 minutes.",
        "I practiced yoga breathing for 10 minutes.",
    ]
    msgs += fitness

    # Nutrition logging (15)
    nutrition = [
        "I had oatmeal and berries for breakfast.",
        "I ate a chicken salad for lunch.",
        "I cooked salmon and veggies for dinner.",
        "I had a protein shake.",
        "I snacked on almonds.",
        "I had greek yogurt.",
        "I drank 2 liters of water today.",
        "I tried intermittent fasting for 16 hours.",
        "I reduced my sugar intake today.",
        "I ate tofu stir-fry.",
        "I had whole grain pasta.",
        "I ate a veggie bowl with quinoa.",
        "I had avocado toast.",
        "I logged my calories: 1800 kcal.",
        "I had chamomile tea before bed.",
    ]
    msgs += nutrition

    # Travel & work planning (15)
    travel_work = [
        "I'm planning a trip to Seattle next month.",
        "I need to book flights to Seattle.",
        "I want a hotel near Pike Place Market.",
        "I prefer morning flights.",
        "I need a packing checklist.",
        "I want to prepare a presentation for the sprint review.",
        "I need to schedule a rehearsal for the presentation.",
        "I want to share slides with the team.",
        "I need reminders for deadlines.",
        "I want to organize my tasks in a checklist.",
        "I need to track my progress daily.",
        "I prefer concise meeting notes.",
        "I want to set OKRs for next quarter.",
        "I need to gather feedback after the review.",
        "I want to celebrate team wins.",
    ]
    msgs += travel_work

    # Hobbies & social (15)
    hobbies = [
        "I joined a local photography club.",
        "I plan to attend a jazz festival.",
        "I want to organize a board game night.",
        "I am learning landscape photography.",
        "I want to try a new hiking trail.",
        "I plan to visit a dog shelter.",
        "I want to host a dinner for friends.",
        "I plan to see a stand-up comedy show.",
        "I want to start a sci-fi book club.",
        "I am practicing portrait photography.",
        "I want to take a weekend road trip.",
        "I plan to sign up for a yoga workshop.",
        "I want to join a swimming class.",
        "I plan to volunteer this month.",
        "I want to print some photos for my wall.",
    ]
    msgs += hobbies

    # Ensure 110 messages total (current count should be 100 exactly from above blocks; add 10 wrap-ups)
    wrap = [
        "Can you help me keep track of these plans?",
        "Please remind me to drink water tomorrow morning.",
        "Let's prioritize my 10K training.",
        "Suggest a weekly meal plan.",
        "Recommend Seattle attractions.",
        "Draft a sprint review outline.",
        "Create a packing checklist.",
        "Propose a balanced weekly schedule.",
        "What do you recommend for recovery days?",
        "Let's set monthly goals.",
    ]
    msgs += wrap

    return msgs


def test_flowing_conversation_memory_trace(client: TestClient):
    title = "Flowing conversation (trace)"
    conv_id = _create_conversation(client, title)
    msgs = _flow_messages()

    prev_mem_ids = _ids(_list_memories(client, 2000))

    # Prepare artifact file for detailed logs
    logs_dir = os.path.join("backend", "tests", "api", "_trace_logs")
    os.makedirs(logs_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40]
    short_id = str(conv_id)[:8]
    log_filename = f"flow_trace_{ts}_{slug}_{short_id}.log"
    log_path = os.path.join(logs_dir, log_filename)
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("=== Flow Trace Start ===\n")

    print(f"\nTrace logging to: {log_path}")
    for idx, text in enumerate(msgs, start=1):
        _add_user_message(client, conv_id, text)

        # Alternate replies
        if idx % 5 == 0:
            _reply_stream(client, conv_id)
        elif idx % 3 == 0:
            _reply(client, conv_id)

        # Print every 10th step to keep output manageable; write full details to file
        if idx % 10 == 0 or idx in (1, len(msgs)):
            # Fetch assistant last message preview
            msgs_all = _list_messages(client, conv_id, 2000)
            last_assistant = next(
                (m for m in reversed(msgs_all) if m.get("role") == "assistant"), {}
            )
            assistant_preview = _short((last_assistant.get("content") or ""), 180)

            # New memories since last checkpoint
            mems = _list_memories(client, 2000)
            cur_ids = _ids(mems)
            new_ids = cur_ids - prev_mem_ids
            new_mems = [m for m in mems if str(m.get("id")) in new_ids]

            # Memory context snapshot
            ctx = _memory_context(client, conv_id)
            ctx_items = ctx.get("context", [])[:5]
            ctx_preview = [
                {
                    "type": it.get("type"),
                    "relevance": round(float(it.get("relevance", 0.0)), 2),
                    "content": _short(it.get("content", ""), 140),
                    "reason": _short(it.get("reason", ""), 100),
                }
                for it in ctx_items
            ]

            # Console: compact summary only
            print(
                f"-- Step {idx}: user msg '{_short(text, 60)}' | assistant preview '{_short(assistant_preview, 60)}' | new_mems={len(new_mems)} | ctx={len(ctx_preview)}"
            )

            # File: full JSON details
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(f"\n-- Step {idx}\n")
                f.write("User: " + text + "\n")
                f.write("Assistant: " + (last_assistant.get("content") or "") + "\n")
                f.write("New memories since last checkpoint:\n")
                f.write(
                    json.dumps(
                        [
                            {
                                "id": m.get("id"),
                                "type": m.get("content_type"),
                                "importance": m.get("importance_score"),
                                "content": m.get("content", ""),
                            }
                            for m in new_mems
                        ],
                        indent=2,
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                f.write("Memory context (top 5):\n")
                f.write(json.dumps(ctx_preview, indent=2, ensure_ascii=False) + "\n")

            prev_mem_ids = cur_ids

    # Sanity assertions
    all_msgs = _list_messages(client, conv_id)
    user_msgs = [m for m in all_msgs if m.get("role") == "user"]
    assistant_msgs = [m for m in all_msgs if m.get("role") == "assistant"]
    # Calendar slash-commands are intercepted in create_message() and do not persist the user message;
    # instead, they create an assistant confirmation. Expect only non-calendar user messages to exist.
    expected_user_count = len([t for t in msgs if not t.startswith("/calendar")])
    assert len(user_msgs) == expected_user_count
    assert len(assistant_msgs) >= len(msgs) // 5

    final_mems = _list_memories(client, 2000)
    assert len(final_mems) >= 20
