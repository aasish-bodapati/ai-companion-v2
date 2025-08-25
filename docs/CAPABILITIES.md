# AI Companion v2 — Capabilities (Internal)

## Overview
A chat-first assistant that remembers user preferences and context to avoid repeated explanations across conversations and features. This document catalogs current capabilities, constraints, and planned work aligned with the MVP Delivery Plan.

## Current Capabilities

- **Chat & Reply Pipeline**
  - Slash commands: `/todo`, `/note`, `/remind`, `/recap`.
  - Recap fast-path (no LLM): summarizes profile/preferences/context into 1–5 bullets; `used_llm=false`.
  - Selective retrieval: compact, deduped context lines to reduce repetition before LLM prompt.
  - Problem+json error shape, consistent across key endpoints.
  - Continuity heuristic: follow-ups like "…after that" now reference the most recent relevant appointment/time (skips current message; scans recent history most-recent-first).
  - Centralized allergy sanitization: unconditional scrubbing of any "peanut" mentions in assistant replies (handles "peanut‑free", Unicode hyphens, and "peanut butter").

- **Memory System**
  - Persistent storage (SQLite local) for memories: `conversation`, `message`, `profile`, `preference`, `fact`, `onboarding`.
  - Personalization prompt builder (profile + preferences).
  - Conversation memory context endpoint for explainability.
  - Minimal Memory Manager UI: list/search/filter/delete (`/memories/manage`).

- **Auth & Security**
  - JWT-based auth; protected routes enforced.
  - Security rules adopted: never log secrets, JWT required on protected endpoints, HTTPS in prod (policy-level).

- **Mind Palace (Read-only)**
  - Neural network, timeline, pattern insights, and live activity views (`/memories`).
  - Not editable; intended for explainability/visibility.

- **Calendar/Notes/Tasks**
  - Dual-write fixes for `/todo` so created tasks appear in `/api/v1/tasks`.
  - NL guard to avoid calendar parser swallowing non-calendar commands.

- **Quality & Tests**
  - 40+ tests green (auth smoke, recap fast-path, recap continuity, problem+json, user flows).
  - E2E Playwright specs present for core flows.
  - Targeted validations pass: `tests/test_conversation_flow_scenarios.py::test_schedule_flow_continuity_accuracy_relevance`, `::test_health_flow_allergy_context_persists`.

## Chat Component

[Deep technical guide → `docs/chat_component.md`](./chat_component.md)

- **Core chat & replies**
  - Natural conversation via `POST /api/v1/conversations/{id}/reply`.
  - Deterministic prompting and compact, deduped context to reduce repetition.
  - Continuity heuristic: follow-ups like “after that” reference the most recent relevant appointment/time (scans recent history, skips current message).

- **Slash commands**
  - `/recap` fast-path (no LLM) emits 1–5 bullets with `used_llm=false`.
  - `/todo`, `/note`, `/remind` create structured items; dual-write fixes ensure tasks list correctly.

- **Memory integration**
  - Retrieves relevant memories (conversation, profile, preferences, facts, onboarding).
  - Explainability via `GET /api/v1/conversations/{id}/memory-context`.

- **Safety & sanitization**
  - Centralized sanitizer scrubs any “peanut” mentions (covers “peanut‑free” incl. Unicode hyphens, and “peanut butter”).
  - Problem+json error format; protected endpoints require JWT; HTTPS in production (policy).

- **Quality gates**
  - Targeted flow tests passing for continuity and health safety.

- **Known limitations**
  - Mind Palace is read-only.
  - Some advanced calendar/fitness/nutrition bridges are planned/partial.

## APIs (Representative)

- Conversations: `POST /api/v1/conversations`, `POST /api/v1/conversations/{id}/reply`.
- Memories: `GET /api/v1/users/me/memories`, `DELETE /api/v1/memories/{id}`, `POST /api/v1/memories`, `GET /api/v1/conversations/{id}/memory-context`.
- Tasks: `GET /api/v1/tasks` (dual-write acceptance for `/todo`).

## Frontend (Standards)

- TypeScript strict mode; Tailwind-only styling; typed API responses.
- Auth gating via `ProtectedRoute`.
- Memory components: `MemoryContext` panel, Memory Manager page.

## LLM & Integration

- Model usage: llama-family model per rules; recap path avoids LLM when possible.
- Deterministic prompts and compact context for reduced variability.
- No OpenAI APIs; pass user and conversation context where required (policy).

## Constraints / Known Limitations

- Mind Palace is read-only.
- Calendar/Fitness/Nutrition bridges are not fully implemented yet (planned below).
- Local dev uses SQLite; production store selection TBD.

## Planned Capabilities (MVP Plan Alignment)

- Days 5–7: Chat → Action Bridges
  - Calendar: create recurring tasks from chat intent (minimal recurrence support, listing in tasks or calendar endpoint).
  - Fitness: create/update basic program from chat intent.
  - Nutrition: populate plan honoring preferences/medical notes.

- Days 7–8: Mind Palace + Adherence Basics
  - Ensure Mind Palace loads consistently with recent memories.
  - Add adherence tracking stubs with a learning hook.

- Days 8–9: Quality Gates & Observability
  - CI lint/type gates (ruff, mypy/pyright, tsc).
  - Flow/CSAT proxy in CI; structured logs with request_id; metrics for latency and memory hit rate.

- Day 10: Docs & Runbook
  - Setup/run docs (SQLite local), known limitations, and user guide for the core demo (plan → recap → continue without repeating context).

## Success Criteria (MVP)

- All tests pass locally and in CI; smoke tests for auth/protected routes.
- Flow score ≥ target; recap continuity verified.
- User can chat, recap, and continue without repeating context.
- Mind Palace loads and reflects recent memories.
