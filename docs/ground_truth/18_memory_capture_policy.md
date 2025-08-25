# Memory Capture Policy (Explicit + Hybrid Auto‑Capture)

This document defines how chat messages and other content are captured into long-term memory.
It is the single source of truth for the "remember" flag, smart gating, thresholds, and backend behavior.

---

## Goals
- Avoid storing every chat message as a memory.
- Provide an explicit user control (Remember toggle / Alt+Enter) to save important messages.
- Use a hybrid gating approach combining a heuristic and LLM classifier to decide auto-save.
- Block saving of sensitive content.
- Preserve uploads / facts / onboarding as memories without unnecessary gating.

---

## API Contract

Endpoint: `POST /api/v1/conversations/{conversation_id}/messages`

Request body extends `MessageCreate` with:
- `remember?: boolean` — If true, explicitly save this message as a memory. If omitted, smart gating applies.

Behavior:
- The backend adds `remember`, `role`, and `message_id` into memory metadata when calling the memory service.

---

## Backend Behavior

File: `backend/app/memory/service.py`
- `MemoryService.store_memory()` implements hybrid gating:
  - Honors `metadata.remember === true` (explicit save) for both user and assistant messages.
  - For `content_type == "message"` and no explicit remember:
    - Compute heuristic importance `_estimate_importance(text)` in `[0..1]`.
    - Optionally call an LLM classifier to predict `importance` and `sensitivity` in `[0..1]`.
    - If `sensitivity >= MEMORY_SENSITIVITY_BLOCK_MIN`, the message is NOT saved.
    - Final importance = `max(heuristic_importance, llm_importance_if_present)`.
    - Save only if `final_importance >= MEMORY_IMPORTANCE_MIN`.
  - For non-message content (e.g., uploads, onboarding facts), gating is relaxed; a default importance is applied if missing.
  - For trivial/low-entropy content, the service may be invoked but internal gating will typically skip persistence. This preserves observability (e.g., test spies) while avoiding noisy storage.
  - Existing behaviors remain: consolidation key upsert, FAISS vector update, optional auto-promotion to Core, lifecycle soft-forget.

File: `backend/app/api/endpoints/conversations.py`
- In `create_message()`, metadata passed to memory service now includes:
  - `message_id`, `role`, and `remember`.
- Additionally, `create_message()` directly calls `memory_service.store_memory()` in two cases:
  - Trivial user inputs (e.g., "hi", "ok", short acknowledgements). The call is made for observability; internal gating in `store_memory()` prevents persistence unless policy allows.
  - Simple key:value fact inputs (e.g., `FavColor: Blue`). These are stored as `content_type: "fact"` and bypass auto-capture thresholds to ensure persistence of explicit facts.
  - All other messages continue through `auto_memory_service.capture_from_message()` subject to gating and thresholds.

---

## Importance Estimation and Threshold

Setting: `MEMORY_IMPORTANCE_MIN` (default `0.7`) in `backend/app/core/config.py`.
- Heuristic `_estimate_importance(text)` returns `[0,1]` based on:
  - Length (more text → higher base)
  - Digits/dates/amounts
  - Punctuation suggesting key-value (":" or "=")
  - Keywords: "remember", "note", "todo", "deadline", "phone", "email", etc.
- Hybrid persistence and provenance are stored in `memory_metadata`:
  - `importance`: final saved importance `[0..1]`.
  - `importance_source`: `"heuristic" | "hybrid-llm"`.
  - `importance_heuristic`: heuristic estimate.
  - `importance_llm`: LLM estimate (if present).
  - `sensitivity`: LLM sensitivity score (if present).
  - `importance_reason`: classifier explanation (if present).
  - `auto_captured: true` when saved due to gating rather than explicit remember.

LLM classifier flags in `backend/app/core/config.py`:
- `MEMORY_LLM_CLASSIFIER_ENABLED` (default `true`) — turn classifier on/off.
- `MEMORY_SENSITIVITY_BLOCK_MIN` (default `0.85`) — block saving when sensitivity ≥ this value.

In addition, the auto-capture layer uses UI-scale gating for message-type captures via `MESSAGE_IMPORTANCE_MIN` (see flags below).

- `MEMORY_CORE_IMPORTANCE_MIN` (default `0.85`)
- `MEMORY_CORE_REINFORCE_MIN` (default `2`)

When enabled, memories meeting thresholds are auto-promoted to Core.

---

## Auto-Capture Policy Flags (config-driven)

Source: `backend/app/core/config.py`

- `CAPTURE_MESSAGES` (default `true`): allow capturing freeform user messages as memories (subject to gating).
- `MESSAGE_IMPORTANCE_MIN` (default `40` on UI 0–100 scale): minimum UI importance score for auto-capturing messages.
- `REQUIRE_EXPLICIT_REMEMBER` (default `false`): when true, only capture messages if the user explicitly opts-in (e.g., remember toggle).
- `EXCLUDE_TRANSIENT_LOGS` (default `true`): skip transient action/log style messages unless explicitly remembered.
- `REINFORCEMENT_ENABLED` (default `true`): increment `reinforced_count` when the same consolidation key recurs.

Notes:
- These flags govern the auto-capture service (`backend/app/services/auto_memory.py`). The conversations endpoint may still call `store_memory()` for observability or to persist key:value facts; actual persistence remains gated by `store_memory()`.

---

## Frontend Guidance
- Add a "Remember" toggle next to the chat send action.
- Shortcut: Alt+Enter to send with `remember: true`.
- Only send `remember: true` when the user opts in. Otherwise omit the field.

UI defaults and controls:
- The Remember toggle defaults ON (user can turn it off per message).
- "Promote to Core" remains available in the memory UI but is de-emphasized; auto-promotion occurs via policy below.

---

## Security
- Do not log secrets.
- All protected endpoints require valid JWT.
- Use HTTPS in production.

---

## Testing Checklist
- User message with `remember: true` is saved.
- User message without `remember` is saved only if importance >= `MEMORY_IMPORTANCE_MIN` (and passes UI `MESSAGE_IMPORTANCE_MIN` when applicable).
- Assistant message not saved unless `remember: true`.
- Non-message content types are saved and get default or provided importance.
- Metadata contains `importance` when estimated.
 - Trivial user messages invoke `store_memory()` but should not persist by default (assert via spy without DB side-effects).
 - Key:value facts provided by the user persist as `fact` memories and are retrievable and deletable via the memory API.
