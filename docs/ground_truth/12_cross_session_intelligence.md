# Cross-Session Intelligence (Expansion)

## Purpose
Enable the AI to feel alive between sessions: proactive conversations, multi-modal memories, and a life timeline view.

## Feature Flags (ENV)
- `PROACTIVE_TRIGGERS_ENABLED=false`
- `MULTIMODAL_MEMORIES_ENABLED=false`
- `TIMELINE_ENABLED=false`

## Proactive Conversations
### Trigger Engine (spec)
Evaluate rules on a schedule (APScheduler) and materialize nudges:
- `inactivity_days >= N` (per user)
- `goal_due_soon` (active goal has `target_date` within X days)
- `anniversary_of_event` (e.g., 30/90/365 days since important memory)
- `repeated_mentions` (high-frequency terms in recent messages)

Output is a set of `NudgeItem`s fed to `GET /api/v1/users/me/nudges`. Optionally, behind a flag, auto-create a conversation with a seed message instead of a nudge.

Observability: `triggers.run.start/ok/error` with rule hits and elapsed_ms.

## Multi-Modal Memories
Add modality support to MemoryNode when the flag is enabled:
- Fields: `modality: "text"|"image"|"audio"|"location"`, `attachment_url`, `attachment_metadata` (JSON)
- Upload handling is out of scope for MVP; assume URLs or pre-signed references.
- Retrieval initially surfaces text-only; future: add vision embeddings to index images.

## Life Timeline
- API: `GET /api/v1/users/me/timeline` returns milestones in chronological order:
  - Sources: goal creations/completions, auto summaries, check-ins with high importance, explicitly tagged milestones.
- Frontend: basic chronological view with filters.

## Security
- All proactive actions are scoped to the current user with JWT.
- No secret leakage in logs. HTTPS in prod.

## Testing
- Stub trigger engine clock to produce deterministic nudges.
- Validate empty/non-empty nudge lists.
- Snapshot tests for timeline ordering.
