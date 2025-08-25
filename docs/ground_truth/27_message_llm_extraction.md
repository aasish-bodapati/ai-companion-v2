# Message LLM Extraction Workflow

Source of truth for how direct user messages are transformed into long‑term memories.

---

## Overview
- Direct user messages are NOT stored verbatim as memories.
- Messages are gated for importance/sensitivity and then passed to an LLM extractor to produce concise, reusable facts.
- Only extracted facts (compact bullet lines) are stored; raw messages are skipped unless explicitly marked to remember.

---

## Control Flags (backend/app/core/config.py)
- MEMORY_ENABLED: master toggle for memory system.
- MEMORY_IMPORTANCE_MIN: float, importance threshold for messages to be stored (default 0.7; tests may override to 0.0).
- MEMORY_SENSITIVITY_BLOCK_MIN: float, messages with sensitivity ≥ threshold are not stored (default 0.85).
- MEMORY_LLM_CLASSIFIER_ENABLED: bool, enables importance/sensitivity classifier (default True).
- MEMORY_LLM_EXTRACTION_ENABLED: bool, enables message-to-facts extraction (default True).

---

## Storage Path
Implemented in `backend/app/memory/service.py`:
- `MemoryService.store_memory()`
  - Skips assistant messages unless `remember=True` in metadata.
  - Skips trivial/low-entropy content.
  - Computes heuristic importance and (optionally) LLM classification for importance/sensitivity.
  - If below `MEMORY_IMPORTANCE_MIN`, skip.
  - Runs `_extract_memory_candidates_with_llm(text)` when `content_type == "message"`.
    - If candidates present, stores a single memory as bullet lines:
      - Example stored content:
        - `- prefers dark mode`
        - `- favorite drink: cappuccino`
    - Adds metadata: `{"provenance": "llm_extracted", "source": "message"}`

---

## Extractor Contract
- Helper: `MemoryService._extract_memory_candidates_with_llm(text)`
- Model: `settings.LLM_MODEL_DEFAULT` (default: `meta-llama/llama-3.3-70b-instruct` via OpenRouter)
- System prompt enforces strict JSON output:
  - `{ "memories": ["...", "..."] }`
- Post-processing:
  - Only strings, trimmed, non-empty, and ≤ 200 chars are retained.

---

## Metadata and Provenance
- On successful storage of extracted facts, metadata includes:
  - `importance`: final importance score
  - `importance_source`: "heuristic" | "hybrid-llm"
  - `auto_captured`: true
  - `provenance`: "llm_extracted"
  - `source`: "message"
- If LLM classifier ran, `importance_heuristic`, `importance_llm`, `sensitivity`, and optional `importance_reason` may be present.

---

## Privacy & Safety
- Messages with sensitivity ≥ `MEMORY_SENSITIVITY_BLOCK_MIN` are NOT stored.
- PII should not be extracted unless explicitly provided by the user.
- Assistant messages are skipped unless explicitly remembered.

---

## Frontend Notes
- The Memories page shows stored items only; it will not display raw chat messages unless they were explicitly remembered or extracted.
- Core badges remain passive; there is no Core tab or promote/demote controls.

---

## Testing Guidance
- Stabilization tactics (as used in repo tests):
  - Lower `MEMORY_IMPORTANCE_MIN` to 0.0 within tests where storage is needed.
  - Mock OpenRouter LLM calls (e.g., patch the HTTP client used in `app/core/llm.py` or stub `generate_with_openrouter`) to avoid rate limits.
  - Use query terms (e.g., "profile") to trigger profile gating paths when needed.

---

## Change Log
- Added LLM extraction to message storage path in `MemoryService.store_memory()`.
- Introduced `_extract_memory_candidates_with_llm` helper.
- Preserved gating and sensitivity protections.
