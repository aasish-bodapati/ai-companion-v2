# MVP Delivery Plan (10 Days)

## Goal
Ship a usable MVP of AI Companion v2: a 24/7 assistant that remembers you, avoids repeated context, and can bridge chat → calendar, fitness, and nutrition with explainable memory.

## Current Status
- ✅ 40+ tests passing locally (`pytest -q`).
- ✅ Storage modularization complete: `MemoryService.store_memory()` → `StorageMixin`; FAISS adapter fixed.
- ✅ Vision updated (`vision.md`) to emphasize “no repeated context.”
- ✅ Local dev DB defaults to SQLite; `init_db.py` seeds all core tables (`users`, `notes`, `tasks`, `reminders`).
- ✅ Calendar NL guard prevents swallowing `/todo`/`/note`/`/remind`.
- ✅ Dual-write `/todo` → `/api/v1/tasks` fixed with test.
- ✅ RFC 7807 problem+json error shape standardized.
- ✅ Recap fast-path (no LLM) implemented with flow test.
- ✅ Selective retrieval in reply pipeline reduces redundancy.
- ✅ Minimal Memory Manager UI at `/memories/manage`.

## MVP Scope
- Core: Chat-first workflow with memory persistence and no repeated context.
- Bridges (happy path only): Calendar, Fitness, Nutrition.
- Mind Palace: Read-only visualization (graph, timeline, patterns).
- Safety: Peanut sanitization + JWT-protected endpoints.
- Memory Management: List + delete UI, explainability endpoint.

## Immediate Blocker (Dev)
- Resolved: local DB accessibility (switched to SQLite).
- Resolved: ensure `/todo` creates a Task visible at `/api/v1/tasks` (dual-write tasks path).
  - Acceptance: after replying with `/todo Prepare slides tomorrow 10am`, GET `/api/v1/tasks` includes the task title.

## 10‑Day Plan

### Days 1–2: Hardening & CI Gates
- SQLite default + `init_db.py` ensures migrations don’t block dev.
- Guard calendar NL vs. slash commands.
- Problem+json enforced.
- Dual-write task smoke test.
- Auth smoke test.
- Add structured logging (`chat_metrics {...}` already exists) into CI artifacts.
- CI: fail if flow score < 70% (from `scripts/chat_eval.py`).

Acceptance:
- All endpoints reachable with auth.
- `pytest -q` fully green.
- CI blocks below flow threshold.

### Days 3–5: Memory UX & Continuity
- Selective retrieval → reduce redundancy.
- Golden snapshot for recap flow (add `golden_recap_last_reply.txt`).
- Expand continuity heuristic (cover “after that”, “later”, “same time tomorrow”).
- Flow test asserting continuity heuristic is applied deterministically.

Acceptance:
- Manual test: user doesn’t re-explain schedule/preferences.
- Flow test: continuity references last event correctly.
- Golden recap snapshot stable across runs.

### Days 5–7: Action Bridges
- Calendar: basic add/list events (with “after that” reminders).
- Fitness: create/update routine avoiding dislikes (preference heuristic).
- Nutrition: populate plan respecting allergies/preferences.
- Confirmations logged + minimal UI artifacts.

Acceptance:
- From chat, user can create a basic schedule, fitness plan, and nutrition plan.
- Preferences respected (e.g., no running if “don’t like running”).

### Days 7–8: Mind Palace + Adherence Basics
- Mind Palace read-only renders memory graph, timeline, and patterns.
- Adherence stubs (boolean toggles) influence next suggestions.

Acceptance:
- Mind Palace page renders recent memories without errors.
- Adherence toggle modifies next chat suggestion.

### Days 8–9: Observability & Metrics
- Add latency histogram + memory hit % to metrics endpoint.
- CI collects metrics (artifacts).
- Extend eval dimensions (coherence, recall, safety, tone) into report.

Acceptance:
- `scripts/chat_eval.py` produces per-dimension JSON.
- Nightly CI run generates `reports/chat_eval_results.json`.

### Day 10: Docs & Runbook
- Update setup docs (SQLite dev, Postgres prod).
- Runbook: debugging flows, metrics tail, snapshot refresh.
- User guide: “Plan → recap → continue without repeating context.”

## Risks & Mitigations
- **LLM variability** → deterministic prompts, golden snapshots, eval thresholds.
- **Integration fragility** → bridges limited to happy paths for MVP.
- **Scope creep** → enforce memory-first + continuity as the MVP; bridges are bonus.

## Success Criteria
- ✅ All tests pass locally + CI.
- ✅ Flow score ≥ 70% in `chat_eval.py`.
- ✅ Recap snapshot stable; continuity heuristics deterministic.
- ✅ Peanut sanitization always enforced.
- ✅ User can:
  - Create a task via chat (`/todo`) → see in `/tasks`.
  - Chat about schedule → recap → continue without re-explaining.
  - Populate at least one calendar, fitness, and nutrition artifact.
  - View Mind Palace with memories.

