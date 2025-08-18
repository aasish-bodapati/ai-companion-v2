# Feature Flags

This document defines the minimal feature flags used to focus the AI Companion v2 MVP and safely gate optional UI.

---

## Flags
- `NEXT_PUBLIC_FEATURE_NUDGES`
  - Type: boolean (string `'true'` enables)
  - Scope: Frontend only (public env var, available at build/runtime)
  - Default: `false`
  - Controls: renders `NudgeInbox` in the chat header
  - Files:
    - `frontend/src/app/chat/[id]/page.tsx`
    - `frontend/src/features/nudges/components/NudgeInbox.tsx`

## Usage
- Read with `process.env.NEXT_PUBLIC_FEATURE_NUDGES === 'true'`.
- Guard UI rendering only. Do not hide backend endpoints.

```tsx
{nudgesEnabled && <NudgeInbox conversationId={conversationId} />}
```

## Operational Guidance
- Keep non-critical features behind flags until validated.
- Ship with `NEXT_PUBLIC_FEATURE_NUDGES=false` for a focused MVP.
- Document any new flags here and link this file from `08_project_reference_index.md`.
