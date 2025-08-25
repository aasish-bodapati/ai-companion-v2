# Model Selection and Routing

This document defines the environment-driven model routing used by the backend. It is the single source of truth for model defaults and provider configuration.

## Environment Variables

- `LLM_KEY` (required): API key for your provider (OpenRouter or any OpenAI-compatible server).
- `LLM_BASE_URL` (optional): OpenAI-compatible base URL. Defaults to `https://openrouter.ai/api/v1`.
- `LLM_MODEL_DEFAULT` (required): General chat model.
- `LLM_MODEL_FAST` (optional): Fast/code model.
- `LLM_MODEL_VISION` (optional): Vision-capable model.
- `LLM_MODEL_SUMMARY` (optional): Summarization model.

## Recommended Defaults (OpenRouter)

- `LLM_BASE_URL=https://openrouter.ai/api/v1`
- `LLM_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct`
- `LLM_MODEL_VISION=meta-llama/llama-3.2-11b-vision-instruct:free`
- Optionally set `LLM_MODEL_SUMMARY=meta-llama/llama-3.3-70b-instruct`

## Alternative Defaults (Llama)

- `LLM_BASE_URL=http://localhost:11434/v1`
- `LLM_MODEL_DEFAULT=llama3.1:8b`
- `LLM_MODEL_VISION=llama3.1:8b`
- Optionally set `LLM_MODEL_SUMMARY=llama3.1:8b`

Notes:
- **OpenRouter**: Aggregator with an OpenAI-compatible API. Supports many models including Llama. Requires `LLM_KEY`.
- **DeepSeek**: Alternative provider with OpenAI-compatible HTTP. Set base URL accordingly.
- **Llama via Ollama**: Free local option, requires local setup but no API costs.
- Be aware of provider-specific rate limits and consider pacing requests and retries.

## Provider Notes

- **OpenRouter**: `LLM_BASE_URL=https://openrouter.ai/api/v1`. Use Llama models like `meta-llama/llama-3.3-70b-instruct` and `meta-llama/llama-3.2-11b-vision-instruct:free`. Requires `LLM_KEY`.
- **DeepSeek**: `LLM_BASE_URL=https://api.deepseek.com/v1`. Vision works with `image_url` content arrays. Requires `LLM_KEY`.
- **Ollama**: `LLM_BASE_URL=http://localhost:11434/v1` for local Llama models. No API key required.
- Do not use provider-specific key names; always use `LLM_KEY`.

## Backend Behavior

- All endpoints (chat, streaming, summarization, vision) read the model names from environment variables.
- If a particular model variable is unset, the backend will fall back to `LLM_MODEL_DEFAULT`.

## Example .env (excerpt) - OpenRouter

```
LLM_KEY=sk-...
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct
LLM_MODEL_VISION=meta-llama/llama-3.2-11b-vision-instruct:free
LLM_MODEL_SUMMARY=meta-llama/llama-3.3-70b-instruct
```

## Example .env (excerpt) - Llama Local

```
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_DEFAULT=llama3.1:8b
LLM_MODEL_VISION=llama3.1:8b
LLM_MODEL_SUMMARY=llama3.1:8b
```
