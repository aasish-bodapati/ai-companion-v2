# System Design Review — AI Companion V2

Date: 2025-08-25 03:08 (IST)

## Executive Summary

- **Overall rating**: 7.5/10
- **Verdict**: Strong foundation with clean layering, memory-aware chat orchestration, and practical feature flags. To reach 9+/10, focus on resilience around LLM calls, observability, streaming UX, security hardening (non-secrets), privacy/retention, and abuse controls.

## Scope & Artifacts Reviewed

- `backend/app/main.py`
- `backend/app/api/endpoints/conversations_messages.py`
- `docs/ground_truth/01_architecture_overview.md`
- `command.md`

## Architecture Snapshot

- **Topology**: Next.js frontend ↔ FastAPI backend ↔ PostgreSQL ↔ OpenRouter LLM, as documented in `docs/ground_truth/01_architecture_overview.md`.
- **App composition**: `backend/app/main.py` wires CORS, cookie auth middleware (`AuthCookieMiddleware`), API router, basic request metrics, and `lifespan` for scheduler start/stop.
- **Conversation pipeline**: `backend/app/api/endpoints/conversations_messages.py` handles:
  - Ownership checks via `crud.conversation.is_owner(...)`
  - Message persistence using `crud.message.create_with_owner(...)`
  - Fast-path handlers: calendar (`_handle_calendar_command`, `_handle_calendar_nl`) and notes/tasks/reminders (`_handle_notes_tasks_reminders`)
  - Memory enrichment through `memory_service.build_personalized_system_prompt(...)` and `memory_service.get_conversation_context(...)`
  - LLM routing via `llm_mod.generate_with_openrouter` or `generate_with_critique_and_refine`, with concise style guardrails `_polish_ai_response(...)`

## Strengths

- **Clear layering and boundaries**: Middleware, routers, and error handlers are cleanly organized in `backend/app/main.py`.
- **Cost-aware fast paths**: Calendar and notes/tasks/reminders return immediately without LLM when possible.
- **Memory-aware personalization**: Bounded history and selective context inclusion lowers token costs while improving relevance.
- **Feature flags**: Behavior toggles enable A/B and safer rollouts.
- **Safe failure modes**: Non-critical memory assembly failures degrade gracefully; standardized error envelopes in `main.py`.

## Gaps and Risks (non-secrets)

- **Auth & JWT consistency**: Ensure all protected endpoints use `Depends(deps.get_current_active_user)` (seen in `conversations_messages.py`), and cookie flags are hardened (HttpOnly, SameSite, Secure in prod).
- **CORS strictness**: Dev-friendly fallback is fine locally; enforce explicit origins in production.
- **Resilience on LLM/provider calls**: No explicit retries/backoff/circuit breaker for transient failures or 429s.
- **Observability depth**:
  - Metrics limited to per-route counts/latency.
  - No request correlation IDs or distributed tracing for DB/LLM calls.
- **Streaming UX**: Chat replies are non-streaming; long generations may degrade UX/timeouts.
- **Idempotency & duplicate submits**: Only a heuristic guard for last two messages; no idempotency keys.
- **Rate limiting & cost controls**: Missing per-user/IP limits and LLM token budget caps.
- **Privacy & retention**: No documented PII redaction/anonymization for memory; retention/deletion policies not visible.
- **Config layering**: Heavy reliance on env flags; recommend explicit typed settings per environment.
- **Testing coverage**: Needs deeper tests for memory capture branches, fast-paths, LLM failures, rate limiting, idempotency, and scheduler lifecycle.
- **Performance**: Opportunities for caching conversation context, async embedding, and batching vector ops.

## Recommended Improvements (prioritized)

1. **Auth & security hardening**
   - Enforce JWT validation on all protected routes through shared dependencies.
   - Set cookie attributes appropriately (HttpOnly, SameSite=Lax/Strict, Secure in prod). Verify cross-origin flows align with CORS.

2. **Resilience around LLM**
   - Wrap `llm_mod.generate_*` calls with:
     - Exponential backoff retries for transient 5xx/429 with jitter.
     - Circuit breaker to fail fast after threshold and optionally fall back to a faster model.
     - Bounded timeouts per request and clear error propagation.

3. **Observability**
   - Add request-scoped correlation IDs; log `user_id` and `conversation_id` as non-PII identifiers on every request and outbound LLM call.
   - Introduce OpenTelemetry tracing for FastAPI, SQLAlchemy, and HTTP client to OpenRouter.
   - Expose Prometheus metrics: route latency, LLM latency, vector retrieval time, error rates, cache hit ratio.

4. **Streaming responses**
   - Provide SSE/WebSocket endpoint for `reply_to_conversation` to stream tokens progressively and reduce timeouts.

5. **Rate limiting and quotas**
   - Implement per-user/IP rate limits (e.g., Redis sliding window).
   - Enforce per-user daily token budget for LLM usage; send graceful budget-exceeded messages.

6. **Data privacy and retention**
   - Add PII redaction before persistence to memory (emails, phones, IDs per policy).
   - Define retention windows for conversations and embeddings; implement deletion APIs with cascading purges (DB + vector store).
   - Consider encrypt-at-rest for DB and sensitive metadata; ensure tenant isolation policies are enforced.

7. **Idempotency and deduplication**
   - Support `Idempotency-Key` header on message send/reply; dedupe using per-conversation key store with TTL.

8. **Config hygiene**
   - Use Pydantic Settings with environment-specific classes (dev/stage/prod) and explicit typed defaults.
   - Validate feature flags at startup and log effective configuration.

9. **Functional hardening & tests**
   - Standardize error envelope across all endpoints.
   - Expand tests for: note fast-capture, generic auto-capture, calendar/NTR fast-paths, LLM failure fallbacks, idempotency, rate limits.

10. **Performance**
   - Cache recent conversation slices (in-memory/Redis) to reduce repeated DB fetches.
   - Batch vector writes and perform embedding generation asynchronously.
   - Make context window sizes configurable; maintain strict caps.

## Quick Wins

- **Retry/backoff wrapper** around the LLM call site inside `reply_to_conversation()` in `backend/app/api/endpoints/conversations_messages.py`.
- **Prometheus /metrics endpoint** that exports existing in-app counters/latencies.
- **SSE streaming** for replies to improve perceived latency and robustness.
- **Tighten CORS** in production configuration and ensure cookie attributes are secure.

## Path References

- Backend entry: `backend/app/main.py`
- Conversation endpoints: `backend/app/api/endpoints/conversations_messages.py`
- Architecture doc: `docs/ground_truth/01_architecture_overview.md`
- Commands: `command.md`
