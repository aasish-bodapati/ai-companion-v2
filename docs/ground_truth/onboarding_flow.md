# Onboarding Flow (Source of Truth)

This document defines the first-run onboarding experience, data model, and API contract.

---

## UX Overview
- Full-page multi-step wizard (not a popup) shown on first login/registration until completed.
- Autosave on each step; user can navigate back and forth.
- Steps:
  1) Basic Identity
  2) Interests & Passions
  3) Communication Style
  4) Goals & Use Cases
  5) Boundaries & Sensitivities
  6) Fun
  7) Review & Finish

Redirect rule: If `GET /api/v1/users/me/onboarding` returns `completed=false`, route user to `/onboarding`.

---

## API Endpoints
Base prefix: `/api/v1`

- GET `/users/me/onboarding`
  - Auth: required (JWT)
  - Response 200: `OnboardingProfileOut`

- PUT `/users/me/onboarding`
  - Auth: required (JWT)
  - Body: `OnboardingProfileIn` (partial saves allowed)
  - Response 200: `OnboardingProfileOut`

- POST `/users/me/onboarding/complete`
  - Auth: required (JWT)
  - Response 200: `OnboardingProfileOut` with `completed=true`

---

## Schemas

OnboardingProfileIn (all fields optional):
```
identity: { name?, nickname?, pronouns?, birthday?, location? }
interests: { topics?: string[], otherTopic?, hobbies?, favorites? }
communication: { responseStyle?: Concise|Detailed|Balanced, tone?: string[], smallTalkLevel?: 0|1|2 }
goals: { primaryReason?, personalGoals?, checkinsEnabled?: boolean }
boundaries: { avoidTopics?, memoryPolicy?: RememberAll|ImportantOnly|NoMemory, recallEnabled?: boolean }
fun: { dreamTrip?, randomFact?, aiPersona? }
```

OnboardingProfileOut: `OnboardingProfileIn` + `completed: boolean`.

---

## Storage Model
Table: `onboarding_profiles` (one-to-one with `users`)
- `id` (uuid string, pk)
- `user_id` (fk users.id, unique)
- identity: `name`, `nickname`, `pronouns`, `birthday`, `location`
- interests: `topics_json` (JSON stored as TEXT), `hobbies`, `favorites`
- communication: `response_style`, `tone_json` (JSON as TEXT), `small_talk_level`
- goals: `primary_reason`, `personal_goals`, `checkins_enabled`
- boundaries: `avoid_topics`, `memory_policy`, `recall_enabled`
- fun: `dream_trip`, `random_fact`, `ai_persona`
- `completed` (bool), `updated_at`

---

## Example Payloads

GET response:
```json
{
  "identity": {"name": "Aasish", "pronouns": "he/him", "location": "Hyderabad"},
  "interests": {"topics": ["tech", "music"], "hobbies": "running"},
  "communication": {"responseStyle": "Balanced", "tone": ["Friendly"], "smallTalkLevel": 1},
  "goals": {"primaryReason": "Productivity", "checkinsEnabled": true},
  "boundaries": {"avoidTopics": "Crypto price advice", "memoryPolicy": "ImportantOnly", "recallEnabled": true},
  "fun": {"dreamTrip": "Kyoto"},
  "completed": false
}
```

PUT request (partial save):
```json
{ "identity": { "name": "Aasish" }, "communication": { "responseStyle": "Balanced" } }
```

---

## Frontend Contract
- Route: `/onboarding` (App Router)
- Autosave: call `PUT /users/me/onboarding` when proceeding to next step.
- Completion: call `POST /users/me/onboarding/complete`, then navigate to chat.
- Types: Strict TypeScript; map to backend shapes above.

---

## Notes
- All endpoints require JWT; use existing auth flow `/api/v1/login/access-token` and `/api/v1/users/me`.
- JSON arrays persisted as TEXT in DB for simplicity; can move to JSONB in Postgres later.
- Do not store secrets or highly sensitive data in onboarding.
