# AI Companion v2 — Solution Brief (External)

## What it is
AI Companion v2 is your day-to-day assistant that remembers you. It reduces back-and-forth by keeping track of your preferences and context across conversations.

## The value
- Less repetition: you don’t have to restate your schedule, preferences, or constraints.
- Faster outcomes: from a single chat, create tasks, notes, and plans.
- More relevant help: suggestions reflect your habits and goals.

## What it does today
- Chat-first assistance with memory
  - Remembers preferences (e.g., mornings, Slack over email) and uses them in replies.
  - “Recap” command summarizes what the assistant knows about you.
- Organizes from chat
  - Turn a message into a to‑do or note; tasks are visible in your list.
- Visibility into memory
  - A “Mind Palace” page shows recent memories and patterns (read-only).

## What’s next (near-term)
- Calendar bridge: create recurring tasks from a single message.
- Fitness & nutrition: simple, preference‑aware plans from chat.
- Quality gates and reliability improvements.

## Who it’s for
Busy professionals and teams who want an assistant that learns their working style and reduces coordination overhead.

## How to try it
- Start a chat and set a preference (e.g., “I prefer morning standups”).
- Ask for a recap: “/recap”.
- Create a task from chat: “/todo Prepare slides tomorrow 10am”.

## Trust & security
- Sign‑in required; protected endpoints use JWT.
- We don’t log secrets; HTTPS in production.
