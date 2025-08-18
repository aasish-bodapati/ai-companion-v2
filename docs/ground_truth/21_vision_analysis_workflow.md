# Vision Analysis in Chat Attachments

This document describes how image attachments are analyzed and appended to outgoing messages.

## UX

- Persistent attachments tray above the chat input lists selected files as chips.
- A toggle labeled "Analyze images" (default ON) controls whether images are analyzed before sending.
- When ON, on Send the app:
  - Calls the backend vision endpoint for each image attachment.
  - Appends a brief "[Image analysis]" block to the user's outgoing message.
  - The standard "[Attached files: ...]" line is also appended.
- Memory saving follows the "Remember" toggle and the documented memory capture policy.

## Backend API

- Endpoint: `POST /vision/analyze` (JWT required)
- Body (one of):
  - `upload_id` (recommended for in-chat attachments)
  - `image_url`
  - `image_b64` (raw base64, server wraps into a data URL)
- Optional: `prompt`, `model`.
- Response: `{ "text": string }` (concise description)

### Implementation

- The endpoint resolves the image as a data URL if `upload_id` or `image_b64` is provided.
- It calls `generate_with_together_vision()` with either OpenAI-compatible HTTP (when `LLM_BASE_URL` set) or a Together SDK fallback.
- Default model: `meta-llama/Llama-Vision-Free` unless overridden by env or request.

## Frontend Integration

- File: `frontend/src/features/chat/components/ChatArea.tsx`
- Client: `frontend/src/features/vision/api.ts` → `analyzeImage()`
- On send:
  - Filters attachments with `mime` starting with `image/`.
  - Sequentially calls `analyzeImage({ upload_id })` and gathers brief results.
  - Appends a compact list under "[Image analysis]" in the outgoing message.

## Security & Config

- JWT is required for `/vision/analyze`.
- Set `LLM_KEY` for your provider and optionally `LLM_BASE_URL=https://api.together.xyz/v1` for OpenAI-compatible HTTP multimodal.
- Model defaults are environment-driven. See `20_model_selection_and_routing.md`.
