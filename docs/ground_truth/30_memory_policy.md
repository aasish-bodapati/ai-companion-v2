# 30. Memory Policy

Source of truth for memory capture, storage, and surfacing behavior.

## Goals
- Keep personalization useful while preserving safety, privacy, and user control.
- Provide deterministic behavior for simple preferences (e.g., "I like X").
- Allow the LLM to propose memory candidates, with app-layer guardrails making final decisions.

## Capture Pipeline
- Deterministic captures: in `backend/app/api/endpoints/conversations.py::_maybe_capture_preference()`.
  - Pure preferences receive deterministic acknowledgments and are stored as `content_type="preference"`.
- LLM-assisted captures: in `backend/app/memory/service.py::store_memory()`.
  - `_extract_memory_candidates_with_llm()` proposes concise facts/preferences.
  - `_classify_with_llm()` optionally provides `importance` and `sensitivity` signals.
  - Final gating and storage are decided by `store_memory()`.

## Gating Rules (store_memory)
- Skip trivial/low-entropy content.
- For `content_type="message"`:
  - Assistant messages are not stored unless `metadata.remember == true`.
  - Importance threshold: `MEMORY_IMPORTANCE_MIN` (default 0.7). Uses heuristic importance; if LLM classifier is enabled, takes the max of heuristic and LLM importance. Classifier sensitivity above `MEMORY_SENSITIVITY_BLOCK_MIN` blocks storage.
  - LLM extraction: if candidates found, combine into short bullets, set provenance to `llm_extracted`, and apply `MEMORY_EXTRACTION_IMPORTANCE_FLOOR` (default 0.75).
  - Allowlist: only persist if `content_type` in `MEMORY_ALLOWED_TYPES`.
  - Quotas: enforce `MEMORY_MAX_AUTOSAVED_PER_MINUTE` and `MEMORY_MAX_AUTOSAVED_PER_DAY` for `auto_captured` items.
  - PII: if `MEMORY_BLOCK_PII` is true, suspected emails/phones are blocked unless explicitly remembered; if `MEMORY_REDACT_PII` is true, they are redacted before evaluation.
- Non-message content (e.g., onboarding/facts) may bypass some gating; default importance set if absent.

## Provenance & Metadata
- Metadata fields persisted include:
  - `importance`, `importance_source` (heuristic|hybrid-llm), `importance_heuristic`, `importance_llm`, `importance_reason`.
  - `sensitivity` (if classified), `auto_captured` (bool).
  - `provenance` (e.g., `llm_extracted`), `source` (e.g., `message`).
  - `content_hash`, optional `consolidation_key` for dedupe.

## Quotas
- Per-minute: `MEMORY_MAX_AUTOSAVED_PER_MINUTE` (default 2) across auto-captured items.
- Per-day: `MEMORY_MAX_AUTOSAVED_PER_DAY` (default 40) across auto-captured items.

## Allowlist
`MEMORY_ALLOWED_TYPES` defaults to:
- preference, fact, profile, message, onboarding, conversation

## PII Handling
- `MEMORY_BLOCK_PII` (default true) blocks automatic persistence when email/phone patterns are detected unless explicitly remembered by the user.
- `MEMORY_REDACT_PII` (default false) redacts email/phone before evaluation when true.

## Lifecycle & Consolidation
- Soft-forget: `MEMORY_SOFT_FORGET_ON_WRITE` enables opportunistic cleanup after writes.
- Consolidation: duplicate items (by `consolidation_key`) are updated in place; older duplicates soft-suppressed.

## Retrieval & Surfacing
- Retrieval uses FAISS with MMR and metadata-aware scoring; see `docs/ground_truth/23_memory_quality_playbook.md` and the implementation in `MemoryService.search_memories()`.
- Display importance: `importance_score` (0–100) is shown in the frontend and sortable.

## Settings
Defined in `backend/app/core/config.py`:
- `MEMORY_IMPORTANCE_MIN`
- `MEMORY_LLM_CLASSIFIER_ENABLED`
- `MEMORY_SENSITIVITY_BLOCK_MIN`
- `MEMORY_ALLOWED_TYPES`
- `MEMORY_MAX_AUTOSAVED_PER_MINUTE`
- `MEMORY_MAX_AUTOSAVED_PER_DAY`
- `MEMORY_BLOCK_PII`
- `MEMORY_REDACT_PII`
- `MEMORY_EXTRACTION_IMPORTANCE_FLOOR`
- Lifecycle caps: `MEMORY_MAX_ITEMS_PER_USER`, `MEMORY_SOFT_FORGET_ON_WRITE`, `MEMORY_FORGET_AGE_DAYS`

## Notes
- Deterministic preference acknowledgments remain enabled to ensure a reply even when streaming fails.
- For UI improvements (Pending Memories, settings toggles), see roadmap items in the plan.
