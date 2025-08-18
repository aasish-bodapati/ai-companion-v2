# Chat Actions and Keyboard Shortcuts

Single source of truth for chat message actions and input shortcuts. This reflects the current implementation in `frontend/src/features/chat/components/ChatArea.tsx`.

## Message Actions

- Copy message
  - For assistant messages.
  - Source: copies `message.content` to clipboard.
- Regenerate response
  - Visible for the most recent assistant message when not streaming.
  - Triggers `useReply()` to request a new assistant response for the active conversation.
- Stop streaming
  - Visible during streaming for the most recent assistant message.
  - Calls `cancelStream()` and clears the live assistant buffer.
- Remember selection
  - Assistant messages only. Saves the current text selection within the assistant reply to memory.
  - Backend fields: `content_type=message`, `source=chat:assistant_selection`, `conversation_id`, `message_id`.
- Remember this (and Save as Core)
  - User messages:
    - Remember this: saves the entire user message to memory.
    - Save as Core: saves the user message with `core=true`, `importance=0.9`.
  - Backend fields: `content_type=message`, `source=chat:remember`, `conversation_id`, `message_id`.
- Edit & resend
  - Last user message only. Loads the message content back into the input for editing and re-sending.

All actions surface toasts and refresh the Brain Meter digest on success.

## Keyboard Shortcuts

- Enter: send (when not holding Shift)
- Ctrl/Cmd+Enter: send
- Alt+Enter: send and explicitly Remember (overrides the toggle for this send)
- Esc: stop streaming (if active)

## Attachments Tray Behavior

- Files selected appear as chips above the input.
- On send, attachments are added to memory with default settings (category, importance, core, consolidate) and a brief assistant follow-up summarizes results.
- If "Analyze images" is enabled, images are sent to the Vision endpoint and a brief analysis is appended to the outgoing message.

## Source of Truth

- Frontend implementation: `frontend/src/features/chat/components/ChatArea.tsx`
- Uploads API: `frontend/src/features/uploads/api.ts`
- Vision API: `frontend/src/features/vision/api.ts`
- Memory API: `frontend/src/features/memory/api.ts`

## Security

- All API calls require a valid JWT.
- Never log credentials or tokens.
- HTTPS in production.
