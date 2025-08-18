# Always Respond Prompt Guard

Source of truth for the system-level rule that prevents empty assistant replies.

## Purpose
Ensure the assistant always returns visible, meaningful output. When the request is unclear, the model must ask a short clarifying question rather than staying silent. If refusal is required, it must be brief and suggest a next step.

## Rules
- Always produce a concise answer to the user's latest message.
- If the request is unclear or underspecified, ask one brief clarifying question instead of staying silent.
- Never return an empty response.
- If refusal is necessary, provide a short explanation and suggest a next step.
- Default to brevity (about 1–3 sentences) unless the user asks for more detail.

## Implementation
- Backend: `backend/app/memory/service.py` in `MemoryService.build_personalized_system_prompt()` appends a "Response Guarantees" section to the system prompt.
- Streaming SSE and non-stream `reply` both sanitize empty/stub content and fall back to a friendly message.

## Related Docs
- `24_timeline_events.md` for streaming timeline diagnostics.
- `28_calendar_chat_commands.md` for chat-driven calendar actions behavior.

## Testing Notes
- Send ambiguous prompts (e.g., "this?" or "maybe later") and verify the assistant asks a brief clarifying question.
- Simulate provider stub/empty outputs; the frontend should still show a friendly fallback message.
