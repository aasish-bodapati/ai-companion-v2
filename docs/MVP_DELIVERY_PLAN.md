# MVP Delivery Plan (Personal Companion)

## Goal
Ship a usable MVP of a Personal Companion that remembers over time, avoids re-asking known facts, and replies naturally like a human personal assistant with a notepad. Domain bridges (calendar) are deprioritized and off by default unless explicitly requested by the user.

## Current Status
- ✅ 40+ tests passing locally (`pytest -q`).
- ✅ Memory-first reply path: known-facts retrieval injected into system prompt; per-conversation rolling summary injected.
- ✅ Fact capture + dedupe on first mention; memory types: `profile`, `preference`, `fact`, `summary`.
- ✅ Repetition guard suppresses duplicate assistant replies; check-before-ask gate removes questions about known facts.
- ✅ “Human PA (notepad)” tone and rules added to system prompt; proactive domain suggestions removed.
- ✅ Confirm-before-write guard for actions (calendar/hydration/mood) when invoked from chat.
- ✅ Storage modularization; FAISS adapter fixed.
- ✅ Local dev DB defaults to SQLite; seeds core tables.
- ✅ RFC 7807 error shape; metrics wired.

## MVP Scope (Personal Companion)
- Core: Chat-first workflow with memory capture/retrieval, no re-asking known facts, repetition guard, rolling summary.
- Behavioral: Human personal assistant with a notepad—quietly captures facts, proposes concise next steps; asks one short confirm only for data-changing actions.
- Bridges: Off by default; only engaged on explicit user request; always confirm-before-write.
- Mind Palace: Read-only visualization (graph, timeline, patterns).
- Safety: Peanut sanitization + JWT-protected endpoints.
- Memory Management: List/delete UI, explainability endpoint.

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

### Days 5–7: Human PA Fit & Guardrails
- Finalize check-before-ask across more phrases (timezone, diet, allergies, name, email, phone, schedule windows).
- Confirm-before-write guard complete (done).
- Optional: add chat confirmation UX wrapper when actions are wired.

Acceptance:
- From chat, user can create a basic schedule.
- Preferences respected.
- Calendar deletion by UUID verified within 10s polling window (regression covered by Playwright spec).

### Days 7–8: Mind Palace + Memory Edges
- Mind Palace read-only renders memory graph, timeline, and patterns.
- Add small heuristics for rolling summary quality (cap bullets, trim noise).

Acceptance:
- Mind Palace page renders recent memories without errors.
- Adherence toggle modifies next chat suggestion.

### Days 8–9: Observability & Metrics
- Add latency histogram + memory hit % to metrics endpoint.
- CI collects metrics (artifacts).
- Extend eval dimensions (coherence, recall, safety, tone) into report.
- Add feature flags documentation, including `CALENDAR_DEBUG_ENABLED`.

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

## Gaps to True “Personal Companion”

- **Memory richness vs. read-only Mind Palace**
  - Current Mind Palace is explainability-only; no editing/corrections yet.
  - True assistant should allow conversational memory updates (e.g., “No, my meeting is at 4 not 3”).

- **Continuity heuristic still narrow**
  - Covers “after that” and a few phrases, but not deeper discourse markers (e.g., “like last week”, “same place as usual”).

- **Bridges minimal by design for MVP**
  - Domain features are off by default; we only act on explicit request and confirmation.
  - Rich NL scheduling and plan generation remain post-MVP.

- **Learning depth**
  - Adaptive learning mostly stubbed for adherence (boolean toggles).
  - To avoid re-explaining, the assistant must adapt when patterns change (e.g., skips mornings → suggest evenings).

- **Scalability of memory**
  - SQLite + FAISS fine for local MVP; multi-user production may impact retrieval latency and write/read throughput.

### Next Steps to Close Gaps
- Conversational memory edits: secure endpoints + chat intents to update/override `preference`, `fact`, and `message` memories.
- Broaden continuity: rules for time/place anaphora (“last week”, “same place”) and lightweight entity linking in recent context.
- Optional: chat confirmation UX wrapper for action attempts.
- Scale plan: evaluate Postgres + pgvector, async retrieval; indices and pagination.

## Success Criteria (Personal Companion)
- ✅ All tests pass locally + CI.
- ✅ Flow score ≥ 70% in `chat_eval.py`.
- ✅ Recap snapshot stable; continuity heuristics deterministic.
- ✅ Peanut sanitization always enforced.
- ✅ User can:
  - Have multi-turn chats where the assistant remembers facts without re-asking and avoids repeating itself.
  - See continuity via rolling summary (assistant stays on track without large prompts).
  - View Mind Palace with memories; correct or delete memories with full audit trail.
  - Optionally request domain actions; assistant asks one short confirm before writing.

## Roadmap Beyond MVP (Sketch)

### Milestone A: Conversational Memory Editing (2–3 weeks)
- CRUD APIs + chat intents to correct/update memories.
- Audit trail on edits; permissions & safety checks.

### Milestone B: Richer Continuity & NL Scheduling (2–3 weeks)
- Rules for time/place anaphora and entity linking in recent context.
- Calendar NL patterns: recurrence, locations, “same as last time”.

### Milestone C: Learning Loop & Adherence (2 weeks)
- Record adherence outcomes; reinforce/decay preferences.
- Surface suggestions that reflect behavior changes.

### Milestone D: Scale-Up Memory Store (3–4 weeks)
- Postgres + pgvector evaluation; async retrieval pipeline.
- Indices, pagination; monitoring for latency and hit rate.

