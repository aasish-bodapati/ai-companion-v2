# Privacy: Profile Disclosure Policy

This policy defines how the assistant discloses user onboarding/profile information in chat.

- Default behavior: The assistant MUST NOT quote or reproduce the full serialized onboarding/profile text verbatim when the user asks questions like “What do you know about me?” or “What do you remember about me?”.
- Instead, it should provide only high-level, non-sensitive bullets (up to 3), and ask for permission before sharing specific/sensitive details.

## Backend Controls

- Config flag: `PROFILE_VERBATIM_DISCLOSURE_ALLOWED` (default: `False`)
  - When `False`: self‑referential queries (e.g., “what do you know about me?”) only receive high-level highlights; the full profile text is NOT injected into the model context nor returned by the memory-context endpoint.
  - When `True`: developers may allow verbatim disclosure for testing (not recommended for production).

## Implementation

- System prompt (`backend/app/api/endpoints/conversations.py`):
  - Adds explicit guidance to avoid quoting onboarding text verbatim and to ask permission for specific/sensitive details.
- Context assembly (`backend/app/memory/service.py`):
  - `get_conversation_context()` redacts the full profile when `self_referential=True`, providing only highlights.
- Memory context endpoint (`backend/app/api/endpoints/memory.py`):
  - Returns profile highlights instead of the full serialized profile for self-referential queries when disclosure is disabled.

## Frontend Notes

- No UI changes required. The Brain Meter and context viewers will reflect redacted content for self-referential queries.

## Security

- Never log API keys or sensitive profile details.
- Always require valid JWT for protected endpoints.
- Use HTTPS in production.
