# Per-User Memory Toggle

Source of truth for per-user memory enable/disable behavior.

- DB: `users.memory_enabled` (nullable boolean)
  - `null` → follow global `MEMORY_ENABLED`
  - `true`/`false` → override global for that user

- API:
  - `GET /api/v1/memory/status` → `{ enabled: boolean, stats: { totalMemories, lastIndexed } }`
    - `enabled` reflects effective state (global with user override if set)
  - `POST /api/v1/memory/toggle` → body `{ enabled: boolean }` returns `{ enabled: boolean }`
    - If global is disabled, returns `{ enabled: false, message }` and does not persist override
    - If global is enabled, persists `users.memory_enabled = enabled`

- Backend gating:
  - Retrieval (`MemoryService.search_memories`) returns empty when global is off or `users.memory_enabled == false`
  - Storage (`MemoryService.store_memory`) is skipped when global is off or `users.memory_enabled == false`

- Frontend:
  - `MemoryStatus.tsx` uses `status.enabled` and trusts `toggle` response `enabled`; then refetches status for stats.

- Security:
  - Requires authenticated user (`deps.get_current_active_user`).
  - No sensitive tokens are logged.
