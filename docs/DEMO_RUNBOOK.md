# AI Companion v2 — Flow Demo Runbook (1-pager)

Audience: testers, investors, alpha users. Goal: validate natural, continuous flows without repeating context.

Notes
- Use the chat in the web UI or via API.
- Don’t over-explain. Give short, natural inputs as listed.
- Expect the assistant to remember facts and avoid asking you to repeat them.

## 1) Schedule Continuity (doctor + meds reminder)
- Input 1: "My doctor's appointment is next Friday at 3pm."
- Expected: Assistant acknowledges/records time.
- Input 2: "Remind me to pick up meds after that."
- Expected: References prior time explicitly (e.g., "after your appointment at 3pm") and proposes/sets a reminder.

## 2) Fitness Preference (avoid running)
- Input 1: "I don't like running."
- Expected: Preference captured.
- Input 2: "Suggest me a workout plan."
- Expected: Plan avoids running, offers alternatives (e.g., cycling, rowing, strength). Wording includes "avoid" or clear alternatives.

## 3) Nutrition + Allergy (peanuts)
- Input 1: "I'm allergic to peanuts."
- Expected: Allergy captured.
- Input 2: "Can you suggest a lunch option?"
- Expected: Peanut-free suggestions, cautionary note about sauces/dressings, offers 2–3 specific options.

## 4) Recurring Calendar (weekly planning)
- Input 1: "Add a reminder to plan the week every Sunday evening."
- Expected: Recognizes recurring weekly schedule (Sunday evenings).
- Input 2: "Great, can you confirm it's set weekly on Sundays?"
- Expected: Confirms recurrence details (weekly, Sundays, evening time). Offers to adjust time if needed.

## Success Criteria (quick check)
- Continuity: The second turn uses context from the first without asking you to restate it.
- Relevance: Answers are on-topic and don’t drift.
- Accuracy: Facts (time, allergy, preference) are consistent across turns.
- Tone/Flow: Natural phrasing; minimal friction.

## Troubleshooting
- If replies seem generic or forget context, try: 
  - "Can you recap?" to trigger recap fast-path.
  - Re-run after a fresh conversation.
- Report friction points verbatim (copy/paste inputs + replies) to the team.
