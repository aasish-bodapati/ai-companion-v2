# AI Companion v2 – Vision

## What this app should be
A 24/7 personal assistant that actually remembers you.
- It learns from your chats and actions.
- It tracks your schedule, fitness, and nutrition.
- It gives tailored answers and grows with you over time.
- It solves the biggest pain with AI chat: repeating the same context again and again.

## The core problem we’re solving
- Repeating context is frustrating. Traditional AI tools forget quickly.
- You shouldn’t have to restate your schedule, goals, or preferences every time.
- This app remembers and uses only the relevant context for each conversation.

## The user flow (simple and real)
- You chat continuously with the assistant.
- You discuss your daily schedule until it looks right → ask it to populate your calendar (especially recurring tasks).
- You discuss fitness goals and program → ask it to populate your fitness page.
- You discuss nutrition preferences and restrictions → ask it to populate your nutrition page.
- You can track whether you’re following your calendar/fitness/nutrition plans.
- The AI learns from your adherence and suggests adjustments (e.g., “loosen schedule,” “smaller steps,” “shift workouts”).
- You upload medical documents → the assistant learns from them and gives context-aware answers without you re-explaining.

## Current project status (plain terms)
- The app is feature-complete on paper: onboarding, memory, chat, and a “Mind Palace” memory dashboard exist.
- It’s currently blocked by database connectivity in local dev, which breaks login and protected endpoints.

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
- Feels continuous: conversations build on earlier ones.
- Personal and adaptive: plans evolve as your life changes.
- Private and transparent: you control what’s remembered and can edit/delete it.

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
1) Fix database connectivity (SQLite for local dev is fastest).
2) Test login and basic chat.
3) Verify memory visualization (“Mind Palace”) pages load.
4) Try the end-to-end flows:
   - Plan schedule → populate calendar → track adherence.
   - Plan fitness → populate page → adjust based on adherence.
   - Plan nutrition → populate page → factor medical docs.
   - Upload medical docs → validate context-aware answers.

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

## Recent Updates — 2025-08-25

- **Conversation continuity**: Follow-ups like “after that” now correctly reference the latest relevant appointment/time by scanning recent messages (most-recent-first) and skipping the current message. This strengthens the “feels continuous” pillar.
- **Safety assurance (allergy sanitization)**: Centralized, unconditional scrubbing of any “peanut” mentions in assistant replies (covers “peanut‑free,” Unicode hyphens, and “peanut butter”), improving safety in health contexts.
- **Validated behavior**: Targeted tests confirm these improvements:
  - `tests/test_conversation_flow_scenarios.py::test_schedule_flow_continuity_accuracy_relevance`
  - `tests/test_conversation_flow_scenarios.py::test_health_flow_allergy_context_persists`

## Implementation notes (consolidated)

- Frontend: Next.js 15.x + React + Tailwind; state via React Context + TanStack Query; Mind Palace auto-refreshes ~30s.
- Backend: FastAPI + SQLAlchemy; auth via JWT (cookie middleware in dev setup).
- LLM (dev): Ollama with Llama 3.1 8B local.
- Local dev blocker (historical): PostgreSQL connectivity caused login hang and memory endpoint 404s; quickest local fix is SQLite; alternatively start Postgres/fix credentials.