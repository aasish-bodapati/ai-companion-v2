# Model Selection and Routing

This document defines the environment-driven model routing used by the backend. It is the single source of truth for model defaults and provider configuration.

## Environment Variables

- `LLM_KEY` (required): API key for your provider (Together or any OpenAI-compatible server).
- `LLM_BASE_URL` (optional): OpenAI-compatible base URL. Set to `https://api.together.xyz/v1` to enable HTTP multimodal for vision.
- `LLM_MODEL_DEFAULT` (required): General chat model.
- `LLM_MODEL_FAST` (optional): Fast/code model.
- `LLM_MODEL_VISION` (optional): Vision-capable model.
- `LLM_MODEL_SUMMARY` (optional): Summarization model.

## Recommended Defaults (Llama-only)

- `LLM_MODEL_DEFAULT=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free`
- `LLM_MODEL_VISION=meta-llama/Llama-Vision-Free`
- Optionally set `LLM_MODEL_SUMMARY=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free`

Notes:
- This project intentionally uses only Llama Turbo for chat and Llama Vision for images.
- Be aware of Together's per-model rate limits for the free Llama Turbo tier; consider pacing requests and retries.

## Provider Notes

- Together: set `LLM_BASE_URL=https://api.together.xyz/v1` for OpenAI-compatible HTTP. Vision works with image_url content. If unset, the SDK path is used; vision falls back to string-only prompts embedding the URL.
- Do not use provider-specific key names; always use `LLM_KEY`.

## Backend Behavior

- All endpoints (chat, streaming, summarization, vision) read the model names from environment variables.
- If a particular model variable is unset, the backend will fall back to `LLM_MODEL_DEFAULT`.

## Example .env (excerpt)

```
LLM_KEY=sk-...
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL_DEFAULT=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
LLM_MODEL_VISION=meta-llama/Llama-Vision-Free
LLM_MODEL_SUMMARY=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
```
