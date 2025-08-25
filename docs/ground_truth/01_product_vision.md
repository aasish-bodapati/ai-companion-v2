# Product Vision: AI Companion v2

## Purpose
A persistent, multi-domain life coach and assistant that learns continuously, tracks behaviors, and helps you bridge from your current self to your best self. It adapts across fitness, mental health, nutrition, skin care, and daily productivity with a single personalized brain. It is intended to replace a human personal assistant—available 24/7—with expert-level support across these areas of life.

## Principles
- Personal-first: advice reflects your goals, constraints, preferences.
- Single brain: shared long-term memory across domains (no silos).
- Proactive, not pushy: timely nudges with quiet hours and user control.
- Measurable progress: goals → plans → adherence → insights.
- Privacy and safety by default: explicit disclosure controls; export/delete.

## Product Pillars
- Unified Coaching Brain: one assistant, domain modules share memory.
- Goal → Plan → Adherence loop: routines, schedules, tracking, reviews.
- Proactive Guidance: daily nudges, weekly reviews, monthly retrospectives.
- Evidence & Insights: streaks, trends, summaries to motivate action.

## MVP Scope (90 days)
1) Coaching Loop Foundations
- Goals & routines (fitness, nutrition, mood) with simple CRUD and chat actions.
- Trackers: workouts, meals (macro notes), hydration, mood check-ins, journaling.
- Scheduler-based nudges (daily) and weekly review prompts.

2) Retrieval & Personalization
- Long-term memory (FAISS + SQL) with MMR, recency decay, type priors.
- Profile blending and feedback-weighted reranking.

3) Diagnostics & Safety
- Timeline SSE for reply timing; retrieval diagnostics for debugging.
- Profile disclosure gating and PII policy enforcement.

## Out-of-Scope (MVP)
- Wearable/health API integrations (planned later).
- Full nutrition parsing and macro computation (basic notes only).
- Advanced emotion modeling; complex plans across calendars.

## Success Metrics (initial)
- Adherence: % planned tasks completed per week; 7/14/30-day streaks.
- Engagement: daily coaching chats, nudge interaction rate.
- Outcomes: workouts/week, hydration/day, self-reported well-being trend.
- Learning: memory usefulness votes; reduced re-asking of context.

## Architecture Alignment
- Backend: FastAPI; memory service + FAISS; scheduler for nudges.
- Frontend: Next.js app router; chat with streaming and timeline panel.
- Docs-as-source-of-truth; feature flags for iterative rollout.

## Privacy & Controls
- Do not expose verbatim profile unless allowed (see profile disclosure rules).
- Redaction/PII policies; data export/delete; clear toggle for proactive nudges.

## Roadmap Themes
- Phase 1: MVP coaching loop (fitness + nutrition + mood).
- Phase 2: Insights & adaptive plans; basic nutrition normalization.
- Phase 3: Skin care module; calendar-aware coaching; spiderweb memory edges.

## Open Decisions
- Data sources in MVP: manual entry only vs early Apple Health/Google Fit.
- Nudge cadence & quiet hours defaults.
- Habit taxonomy and naming (standard vs free-form).

## References
- Retrieval and scoring: 12_retrieval_and_scoring.md, 31_memory_scoring.md, 23_memory_quality_playbook.md.
- Privacy & disclosure: 25_privacy_profile_disclosure.md, 30_memory_policy.md.
- Proactive workflows: 09_continuous_context_ingestion.md, 10_proactive_engagement.md.
