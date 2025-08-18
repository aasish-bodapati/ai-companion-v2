# Trackers + Reviews + Ops Milestone Plan

This document lays out a 1–2 sprint plan to reach the product vision for Trackers, Reviews, Memory UX polish, and Operational maturity. It complements existing docs:
- `docs/ground_truth/36_trackers_ui_behavior.md`
- `docs/ground_truth/34_coaching_api_contracts.md`

Adheres to project rules:
- TypeScript strict mode, Tailwind only, typed API responses
- Standardized error shape
- Protected endpoints require JWT; HTTPS in production

## Sprint 1 (Focus: Trackers UX polish, Reviews depth, basic Ops and Tests)

- Trackers UX polish
  - Filters for lists (date range; kind-specific facets where applicable)
  - Pagination (cursor or page-based, aligned with backend)
  - Lightweight charts/summaries (last 7 days per tracker)
  - Stronger form validation + a11y (labels, aria, constraints)
  - Shared components: `EmptyState`, skeleton loaders

- Reviews enrichment
  - Display per-tracker highlights in weekly summary
  - Improve “daily nudge” copy with context from latest logs
  - Add basic “apply suggestion” actions (e.g., quick-create routine or reminder)

- Error handling and UX consistency
  - Centralized error mapper for standardized error shape
  - Ensure toasts use mapped user-friendly messages

- Ops + Tests (foundational)
  - Expand Metrics UI with error rates and latency buckets (if exposed)
  - Add unit tests for tracker helpers and error mapping
  - Add basic E2E paths for logging and listing

## Sprint 2 (Focus: Memory UX controls, Ops dashboards/alerts, deeper testing)

- Memory UX controls
  - Privacy controls for memories
  - Export/delete memory flows with confirmation and backend wiring
  - “Why this memory?” explainability snippet in UI

- Ops maturity
  - Dashboard (Grafana-like) for key metrics (requests, latency, errors)
  - Alerts and error budgets (define thresholds; hook into provider)
  - Standardize error responses across backend endpoints (address deprecations)

- Testing & Docs
  - Add UI tests for Reviews page flows
  - API contract tests for standardized error shapes
  - Finalize docs for error shape and monitoring setup; runbooks for common ops tasks

## Deliverables Checklist

- Filters/pagination in all trackers
- Charts for recent activity per tracker
- Reviews with per-tracker highlights and “apply suggestion” hooks
- Central error mapper + consistent toasts
- Memory privacy/export/delete + explainability
- Metrics UI augmented; dashboards + alerts in place
- Tests (unit, integration, E2E) for critical paths
- Docs updated and linked in index

## Notes

- Keep API types in `frontend/src/features/**` strictly typed
- No inline styles; Tailwind only
- Never log secrets; JWT required on protected endpoints
