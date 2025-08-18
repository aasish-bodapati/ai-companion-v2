# Proactive Engagement

Source-of-truth for scheduled and opportunistic companion behaviors. Follow security/coding/AI rules in project docs.

---

## Goals
- Make the companion feel present with timely, useful prompts.
- Nurture habits: morning greetings, evening reflections, weekly recaps.

## Nudge Types
- Scheduled: morning, evening, weekly
- Opportunistic: based on retrieved relevant memories (deadlines, goals)
- Mood-based: sentiment trend triggers a gentle check-in

## Data Model (as memory_metadata or nudge table)
- nudge: true
- nudge_type: "morning" | "evening" | "weekly" | "opportunity" | "checkin"
- scheduled_for: ISO datetime (optional)
- seen: boolean

## API (initial minimal scope)
- GET /api/v1/users/me/nudges → list pending nudges
- POST /api/v1/nudges/run (admin/dev) → materialize nudges

## Scheduler
- Start with APScheduler in-process for dev.
- Jobs:
  - Morning greeting (08:00 local)
  - Evening reflection (20:00 local)
  - Weekly recap (Sun 18:00)
  - Opportunity scan every 2–4h

## Frontend UX
- Header badge in `AppLayout` → Nudge Inbox modal
- Cards for each nudge type with CTAs:
  - Morning: quick “What’s on your mind?” → POST check-in
  - Evening: “What stood out today?” → POST check-in
  - Weekly: “Create recap” → call auto-summarize for most active conversation

## Observability
- Metrics: nudges created, opened, acted; errors.

## Security
- JWT required; ownership checks.
- Respect user preferences for scheduling; allow opt-out in Profile.
