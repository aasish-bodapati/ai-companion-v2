# Coaching MVP API Contracts

Source of truth for Goals, Routines, Trackers, Reviews, and Action invocation. All endpoints require JWT and follow the standardized error shape in `22_error_response_standard.md`. Use HTTPS in production.

## Auth & Context
- Headers: `Authorization: Bearer <token>`
- Always pass/currently resolve: `user_id` from token; `conversation_id` optional for provenance.
- CSRF required for state-changing requests in web context (see `02_api_contracts.md`).

---

## Goals

### Create Goal
- POST `/api/v1/goals`
- Body:
```json
{
  "name": "Run 5k in 30 minutes",
  "category": "fitness",
  "target_date": "2025-12-01",
  "notes": "3x/week training",
  "metrics": {"distance_km": 5, "time_min": 30}
}
```
- 201:
```json
{"id":"uuid","status":"active"}
```

### List Goals
- GET `/api/v1/goals?category=fitness&status=active`
- 200:
```json
[{"id":"uuid","name":"Run 5k in 30 minutes","category":"fitness","status":"active","target_date":"2025-12-01"}]
```

### Update Goal
- PATCH `/api/v1/goals/{goal_id}`
- Body (any subset):
```json
{"name":"5k under 28m","status":"paused","notes":"shin splints"}
```
- 200: `{ "ok": true }`

---

## Routines
- Routine represents a scheduled habit linked to a goal or free-form.

### Create/Update Routine
- PUT `/api/v1/routines/{routine_id?}` (use POST if you prefer, implementation choice)
- Body:
```json
{
  "name": "Run",
  "category": "fitness",
  "schedule": {"days":["Mon","Wed","Fri"],"time":"07:00","tz":"Asia/Kolkata"},
  "goal_id": "uuid",
  "notes": null
}
```
- 200/201: `{ "id": "uuid" }`

### List Routines
- GET `/api/v1/routines?category=fitness`
- 200: `[{"id":"uuid","name":"Run","schedule":{"days":["Mon","Wed","Fri"],"time":"07:00","tz":"Asia/Kolkata"}}]`

---

## Trackers
Common fields: `id`, `when` (ISO), optional `notes`.

### Log Workout
- POST `/api/v1/trackers/workouts`
- Body:
```json
{ "when":"2025-08-17T06:45:00Z", "type":"run", "duration_min":30, "distance_km":5.0, "intensity":"moderate", "notes":"easy pace" }
```
- 201: `{ "id":"uuid" }`

### Log Meal
- POST `/api/v1/trackers/meals`
- Body:
```json
{ "when":"2025-08-17T12:30:00Z", "items":["grilled chicken","brown rice","salad"], "est_protein_g":40, "est_kcal":650, "notes":"good protein" }
```
- 201: `{ "id":"uuid" }`

### Log Hydration
- POST `/api/v1/trackers/hydration`
- Body:
```json
{ "when":"2025-08-17T10:00:00Z", "amount_ml":500 }
```
- 201: `{ "id":"uuid" }`

### Log Mood
- POST `/api/v1/trackers/mood`
- Body:
```json
{ "when":"2025-08-17T20:00:00Z", "val": 3, "scale": 5, "tags":["calm","productive"], "notes":"solid day" }
```
- 201: `{ "id":"uuid" }`

### Add Journal Entry
- POST `/api/v1/trackers/journal`
- Body:
```json
{ "when":"2025-08-17T21:00:00Z", "title":"Weekly Review", "content":"Felt better runs", "tags":["fitness","reflection"] }
```
- 201: `{ "id":"uuid" }`

### Query Logs (generic)
- GET `/api/v1/trackers/{kind}?from=2025-08-10&to=2025-08-17&limit=100`
- kinds: `workouts|meals|hydration|mood|journal`
- 200: `[{ ... entries ... }]`

---

## Reviews

### Daily Nudge (generate suggestions)
- POST `/api/v1/reviews/daily`
- Body:
```json
{ "date":"2025-08-18", "quiet_hours": {"from":"22:00","to":"07:00","tz":"Asia/Kolkata"} }
```
- 200:
```json
{ "suggestions": ["Run 30 min at 7am","Aim for 120g protein today","2L water target"] }
```

### Weekly Review (summary + plan adjustments)
- POST `/api/v1/reviews/weekly`
- Body:
```json
{ "week_start":"2025-08-11", "domains":["fitness","nutrition","mood"] }
```
- 200:
```json
{
  "summary":"3 runs completed, +10% distance. Protein avg 90g/day.",
  "adjustments":[{"routine_id":"uuid","change":"add Sat easy run"}],
  "insights":["Mood dips on Thu → schedule lighter session"]
}
```

---

## Plans

Structured plans that can be activated as the user's current plan. Only one active plan per user per type. `structured` is JSON; API returns it as an object.

### Create Fitness Plan
- POST `/api/v1/fitness/plans`
- Body:
```json
{ "title":"4-Day Upper/Lower Split", "summary_md":"## Weekly Plan...", "structured": {"days":[]}, "source":"chat" }
```
- 201: `{ "id":"uuid" }`

### List Fitness Plans
- GET `/api/v1/fitness/plans?status=active|archived`
- 200:
```json
[{"id":"uuid","title":"4-Day Upper/Lower Split","summary_md":"## Weekly Plan...","structured":{},"status":"active","source":"chat","created_at":"...","updated_at":"..."}]
```

### Get Current Fitness Plan
- GET `/api/v1/fitness/plans/current`
- 200: `null` or `WorkoutPlan`

### Set Active Fitness Plan
- POST `/api/v1/fitness/plans/{plan_id}/set-active`
- 200: `{ "ok": true }`

### Create Nutrition Plan
- POST `/api/v1/nutrition/plans`
- Body:
```json
{ "title":"High-Protein 3 Meals", "summary_md":"## Daily Template...", "structured": {"meals":[]}, "source":"chat" }
```
- 201: `{ "id":"uuid" }`

### List Nutrition Plans
- GET `/api/v1/nutrition/plans?status=active|archived`
- 200: `[NutritionPlan...]`

### Get Current Nutrition Plan
- GET `/api/v1/nutrition/plans/current`
- 200: `null` or `NutritionPlan`

### Set Active Nutrition Plan
- POST `/api/v1/nutrition/plans/{plan_id}/set-active`
- 200: `{ "ok": true }`

---

## Actions (Tool Invocation)

### Invoke Action
- POST `/api/v1/actions/execute`
- Body:
```json
{
  "action": "fitness.log_workout",
  "params": {"when":"2025-08-17T06:45:00Z","type":"run","duration_min":30},
  "conversation_id": "uuid",
  "client_action_id": "optional-idempotency-key"
}
```
- 200:
```json
{ "ok": true, "action": "fitness.log_workout", "result": {"id":"uuid"} }
```
- On error: `{ "ok": false, "action": "...", "error": { "detail": "...", "message": "...", "errors": null } }`

### Set Current Plans
- `fitness.set_current_plan`
  - Params:
  ```json
  {"title":"...","summary_md":"...","structured":{},"source":"chat"}
  ```
  - Result: `{ "id":"uuid" }` (also archives previous active and activates this one)
- `nutrition.set_current_plan` — same shape/behavior

## Notes
- Strong typing required in TypeScript and Python (see Coding Standards).
- All protected endpoints require valid JWT; never log passwords/tokens.
- Feature flags may gate Reviews or Action auto-confirm.
