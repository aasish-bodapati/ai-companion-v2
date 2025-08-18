# Continuous Context Ingestion

Source-of-truth for always-on memory capture. All features must follow project rules in rules-security.md, rules-coding-standards.md, and rules-ai-integration.md.

---

## Goals
- Learn passively from user actions and conversations.
- Minimize repetition by auto-capturing important context.

## Building Blocks
- Passive hooks:
  - Daily/weekly check-ins
  - Auto-summary of conversations into memories
  - Optional integrations: calendar, notes, to-do
- Real-time promotion:
  - One-click “Promote to Core”
  - Suggestive prompt: “Should I remember this?”

## Data Model (memory_metadata)
- core: boolean
- source: string (e.g., "auto_summary", "checkin:daily")
- importance: number (0–1)
- sentiment: string ("pos"|"neu"|"neg")
- decay_weight: number (0–1, default 1)
- suppressed_until: ISO string (optional)
- meta: boolean (for summaries)

## API (initial minimal scope)
- GET /api/v1/users/me/memories?core=true|false
- PATCH /api/v1/memories/{memory_id} { core?, content?, relevance_score? }
- DELETE /api/v1/memories/{memory_id}
- FUTURE (Week 1–2):
  - POST /api/v1/users/me/checkins
  - POST /api/v1/conversations/{conversation_id}/auto-summarize
  - GET /api/v1/users/me/nudges

## Retrieval Contract (LLM)
- Always pass user_id and conversation_id.
- Include profile seed and recent auto-summaries in prompt assembly.

## UX Hooks
- Memories page: All/Core tabs, promote/demote.
- Chat: Message actions for “Remember this” and suggestive prompt.

## Observability
- Metrics: number of captured memories/day, auto-summary coverage, promote/demote actions, errors.

## Security
- JWT required, ownership checks, HTTPS in prod.
- No secret logging.
