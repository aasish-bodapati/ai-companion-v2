# Roadmap (Very Lean)

Purpose: See the big picture, even if flexible. Dates are anchors; adjust as we learn.

## Month 1: Core MVP
- Auth/session plumbing (reuse existing dev auth where possible)
- Chat-first experience (basic MessageList + Composer)
- Memory capture/retrieval with provenance (profile/preference/fact/summary/message)
- Guardrails: confirm-before-write, check-before-ask, repetition guard
- Minimal Observability: memory hit/miss, retrieval latency, guardrail triggers

## Month 2: Feedback + Stability
- Bug fixes from early users (dogfooding)
- Memory Center (view/edit/delete) with audit trail
- Retrieval tuning (recency/novelty scoring, quality checks)
- E2E smoke stability; snapshot determinism and sanitization

## Month 3: Launch v1
- Polish UX (empty/welcome states, confirmations, error UX)
- Documentation: API contracts, ADRs, runbooks
- Post-deploy smoke + canary; add dashboards for KPIs
- Collect users and structured feedback

## Month 4+
- Add optional “bridges” on confirm-only basis (calendar is primary)
- Evaluate Postgres + pgvector for scale (keep SQLite+FAISS for local)
- Insights: Weekly reviews (read-only), adherence analytics
- Consider monetization experiments (paywalls, quotas, value metrics)
