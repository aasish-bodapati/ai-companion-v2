# Product One-Pager (Mini-PRD)

- **Project Name**: AI Personal Assistant (Memory-First)
- **Problem Statement**: People waste time re-explaining preferences and context across tools. Current assistants forget, ask repeat questions, and don’t adapt to behavior.
- **Target Users**: Busy professionals, founders, students who want a reliable assistant that remembers and adapts like a human PA.
- **Solution Overview**: A chat-first assistant that starts with zero knowledge and continuously learns through interactions. It captures facts and preferences with provenance, retrieves them in context to avoid re-asking, and adapts suggestions over time (e.g., scheduling windows, communication style). Clear guardrails ensure confirm-before-write and transparent “what I learned” controls.
- **Success Criteria (MVP)**:
  - Doesn’t re-ask known facts in golden flows and smoke E2E.
  - Memory Center shows, edits, and deletes learned items.
  - 100+ successful conversations (internal dogfood) with reduced re-ask rate.
  - Post-deploy smoke green and < P95 2s memory retrieval latency.

---

## Non-Goals (MVP)
- Broad domain bridges beyond core (calendar; trackers: hydration/mood/journal).
- Proactive nudging without sufficient evidence.

## Key User Stories
- As a user, I want my assistant to remember my preferences and not ask me again.
- As a user, I want to approve any action or memory write with a single short confirmation.
- As a user, I want to see and edit what the assistant has learned about me.
