# Trackers UI Behavior (Source of Truth)

This document defines the Trackers MVP UI behavior and frontend API usage. It complements `34_coaching_api_contracts.md` and the standardized error shape in `22_error_response_standard.md`.

---

## Pages

- `/trackers`
  - Entry hub linking to category pages and Reviews.

- `/trackers/workouts`
  - Form fields: `when (datetime-local)`, `type`, `duration_min?`, `distance_km?`, `intensity?`, `notes?`.
  - POST to `/api/v1/trackers/workouts` via `logWorkout()`.
  - After success, shows last 10 via `queryWorkouts({ limit: 10 })`.

- `/trackers/meals`
  - Form fields: `when`, `items (comma-separated)`, `est_protein_g?`, `est_kcal?`, `notes?`.
  - POST `/api/v1/trackers/meals` via `logMeal()`.
  - Recent via `queryMeals({ limit: 10 })`.

- `/trackers/hydration`
  - Form fields: `when`, `amount_ml`.
  - POST `/api/v1/trackers/hydration` via `logHydration()`.
  - Recent via `queryHydration({ limit: 10 })`.

- `/trackers/mood`
  - Form fields: `when`, `val (1..5)`, `scale? (default 5)`, `tags (comma-separated)?`, `notes?`.
  - POST `/api/v1/trackers/mood` via `logMood()`.
  - Recent via `queryMood({ limit: 10 })`.

- `/trackers/journal`
  - Form fields: `when`, `title?`, `content`, `tags (comma-separated)?`.
  - POST `/api/v1/trackers/journal` via `addJournal()`.
  - Recent via `queryJournal({ limit: 10 })`.

- `/trackers/reviews`
  - Daily Nudge form → POST `/api/v1/reviews/daily` via `dailyNudge()`.
  - Weekly Review form → POST `/api/v1/reviews/weekly` via `weeklyReview()`.

---

## Frontend API typing (TypeScript)

Defined in `frontend/src/features/trackers/api.ts`:

- Create input types: `WorkoutLogCreate`, `MealLogCreate`, `HydrationLogCreate`, `MoodLogCreate`, `JournalEntryCreate`.
- List item types: `WorkoutLogItem`, `MealLogItem`, `HydrationLogItem`, `MoodLogItem`, `JournalEntryItem`.
- Query helpers: `queryWorkouts`, `queryMeals`, `queryHydration`, `queryMood`, `queryJournal`.
- Reviews types: `DailyNudgeRequest/Response`, `WeeklyReviewRequest/Response`.

All TypeScript code must use strict mode and typed API responses.

---

## Error Handling

- All endpoints return standardized error shape: `{ detail, message, errors }`.
- UI must not log secrets; surface concise messages. Prefer non-blocking toasts over `alert()` for production.

---

## Security

- All protected calls require valid JWT; use HTTPS in production.
- CSRF is required for state-changing requests in web context.

---

## Future Enhancements

- Empty/loading states and toasts.
- Filters for `from`, `to`, `limit` on list views.
- Goals/Routines UI per `34_coaching_api_contracts.md`.
- Metrics dashboard consuming `/api/v1/utils/metrics`.
