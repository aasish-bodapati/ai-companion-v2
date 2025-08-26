# AI Companion v2 – Vision (Personal Companion)

## What this app should be
Like hiring a new human assistant with a notepad. In the first few days, they know almost nothing. Then, day by day, they quietly learn your routines, preferences, constraints, and goals—and get better and more tailored without making you repeat yourself.

- A 24/7 personal companion that actually remembers you.
- Learns from your chats and keeps improving over days and weeks.
- Gives tailored answers without you repeating context.
- Behaves like a human PA: proposes next steps concisely; asks for a brief confirmation before making changes.

## The core problem we’re solving
- New-assistant reality: ramp-up takes time. But once facts are known, they shouldn’t be re-asked.
- Traditional AI forgets; users repeat themselves.
- Our companion remembers and uses only relevant context each turn—like a great human assistant would.

## The user flow (simple and real)
- You chat continuously; the assistant remembers facts and uses them without re-asking.
- It proposes the next best step concisely; for any action that changes data (e.g., adding to calendar), it asks one short confirmation.
- Domain features (calendar/fitness/nutrition) are opt-in: only when you explicitly ask; otherwise the assistant stays conversational and memory-first.

## Current project status (plain terms)
- Onboarding, memory, chat, and a “Mind Palace” memory dashboard exist.
- Local dev runs on SQLite by default; protected endpoints work in dev.

## What’s built (high-level)
- Backend (FastAPI + SQLAlchemy)
  - Auth via JWT
  - Memory system with embeddings and indexing
  - LLM via Ollama (Llama 3.x)
- Frontend (Next.js + React + Tailwind)
  - Chat-first experience
  - Mind Palace dashboard (memory graph, timeline, patterns)
  - State via React Context + TanStack Query

## Why this is different
- No repeated context: the assistant automatically retrieves relevant memories.
- Feels continuous: conversations build on earlier ones (rolling summaries).
- Human PA feel: proposes steps, asks brief confirms only when needed.
- Private and transparent: you control what’s remembered; edit/delete anytime.

## Immediate blocker (must fix first)
- Database not accessible → login hangs → memory endpoints 404.
- Quickest fix for local: switch to SQLite.
- Alternatives: start PostgreSQL service or fix credentials.

## Environment (dev)
- OS: Windows 10
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- LLM: Ollama (Llama 3.x)
- DB: PostgreSQL configured but unreachable (switch to SQLite recommended)

## Next steps (short list)
1) Strengthen tests: seed a fact once → later turns use it without re-asking; no-repeat regression.
2) Optional: add chat confirmation UX wrapper for actions (turn guard errors into one-sentence confirmations).
3) Mind Palace polish: stabilize rendering and summaries.

## Key files
- backend/app/core/config.py
- backend/app/db/session.py
- backend/app/api/endpoints/memory_visualization.py
- frontend/src/app/memories/page.tsx

## Principles we follow
- Save only what helps (no over-collection).
- Respect privacy and never invent fake “memories.”
- If info is missing, say so honestly.
- Keep conversations practical and focused on outcomes.

## Long-term goal
Replace a human personal assistant with an AI that truly understands you, remembers your world, and saves you from repeating the same context—ever again.

## Recent Updates — 2025-08-26

- __Known-facts injection__: `profile|preference|fact` memories are injected into the system prompt, avoiding re-asks.
- __Fact capture + dedupe__: First-mention capture with consolidation-aware dedupe.
- __Repetition guard__: Suppresses near-duplicates vs. last assistant message.
- __Rolling per-conversation summary__: Compact summary each turn for continuity.
- __Check-before-ask gate__: Avoids asking for info that’s already known.
- __Proactive suggestions removed__: No unsolicited calendar/fitness/nutrition proposals.
- __Confirm-before-write__: Actions that change data require explicit confirmation when invoked from chat.

Next: implement an explicit check-before-ask gate to consult known facts prior to clarifying questions, and add targeted tests (seed once → no re-ask; no-repeat regression).

## Recent Updates — 2025-08-25

- **Conversation continuity**: Follow-ups like “after that” now correctly reference the latest relevant appointment/time by scanning recent messages (most-recent-first) and skipping the current message. This strengthens the “feels continuous” pillar.
- **Safety assurance (allergy sanitization)**: Centralized, unconditional scrubbing of any “peanut” mentions in assistant replies (covers “peanut‑free,” Unicode hyphens, and “peanut butter”), improving safety in health contexts.
- **Validated behavior**: Targeted tests confirm these improvements:
  - `tests/test_conversation_flow_scenarios.py::test_schedule_flow_continuity_accuracy_relevance`
  - `tests/test_conversation_flow_scenarios.py::test_health_flow_allergy_context_persists`

## Implementation notes (consolidated)

- Frontend: Next.js 15.x + React + Tailwind; state via React Context + TanStack Query; Mind Palace auto-refreshes ~30s.
- Backend: FastAPI + SQLAlchemy; auth via JWT.
- LLM (dev): Ollama or configured provider; model selectable per env.
- Dev DB: SQLite default; Postgres optional.