# AI Personal Assistant – Cross‑Discipline Operating Rules

Vision: Build a 24/7 personal assistant that starts with zero knowledge and continuously learns from interactions—remembering facts and preferences, adapting suggestions, and behaving like a trustworthy human PA.

---

## 1) System Design Rules

- __Memory Model__
  - Types: `profile` (immutable), `preference` (mutable, versioned), `fact` (contextual), `summary` (rolling), `message` (raw).
  - Provenance on every write: who/what/when/source + confidence.
  - Retrieval: hybrid (vector + structured filters) with recency/importance/novelty scoring.

- __Learning Strategy__
  - Passive capture from confirmed actions and recurring behavior.
  - Adherence tracking: detect intent vs. behavior gaps; adapt suggestions and timing.
  - Safe generalization: require multiple consistent signals before solidifying a preference.

- __Guardrails__
  - Confirm‑before‑write for data‑changing actions.
  - Check‑before‑ask to avoid asking known facts again.
  - Repetition guard for responses and follow‑ups.

- __Privacy & Security__
  - Data classification (PII/PHI/general); least‑privilege access.
  - Encrypt in transit and at rest; rotate keys.
  - JWT on protected endpoints; short‑lived tokens; refresh securely.
  - Never log secrets, passwords, or tokens.

- __Observability__
  - Structured, privacy‑safe logs + metrics: latency, error rates, memory hit/miss, guardrail triggers.
  - Quality dashboards for hallucination/unsafe output incidents.

- __Resilience__
  - Idempotent APIs with request IDs; retries with backoff; circuit breakers on external dependencies.

---

## 2) Product Management Rules

- __Scope Discipline__
  - Ship the smallest learning loop that proves value: capture → retrieve → adapt.
  - Prioritize: “doesn’t re‑ask,” “remembers reliably,” “adapts scheduling.”
  - MVP Scope: Chat interface + reliable memory only (capture, retrieval, confirm‑before‑write). No calendar/bridges or wellness/fitness/nutrition features in MVP.
  - Deprecated domains: Fitness/nutrition features are removed from near‑term scope; supported trackers are hydration, mood, journal (post‑MVP, confirm‑before‑write).

- __Quality Gates__
  - DoD includes security review, memory persistence verified, smoke tests, demoable stories, telemetry dashboards.

- __Ethics & Trust__
  - Transparent “what I remember” UI, edit/delete.
  - Human tone, never misrepresent capabilities or identity.

---

## 3) Development Rules

- __Languages & Standards__
  - Python: PEP8, type hints on public functions.
  - TypeScript: strict mode; always type API responses.
  - UI: Tailwind only; no inline styles.

- __Architecture__
  - Layers: ingest → normalize → memory_service → retrieval → reasoning/guardrails → action layer → response generator.
  - Interfaces + DI for testability; clear contracts.

- __Memory Writes__
  - Require explicit trigger, confidence, provenance.
  - Upsert policies: deterministic merge/replace; never silent overwrites.

- __Interfaces & Contracts__
  - Versioned APIs; RFC 7807 errors.
  - Validate inputs at boundaries; sanitize user text; treat external content as untrusted.
  - Use a shared helper to produce `application/problem+json` responses consistently (status, type, title, detail, instance).

- __Security__
  - Never log secrets/tokens.
  - HTTPS in production; JWT required for protected endpoints.
  - Scope‑based permissions on actions.

---

## 4) Testing Rules

- __Test Pyramid__
  - Unit: memory transforms, retrieval ranking, guardrails.
  - Integration: chat → memory → retrieval → response.
  - E2E smoke: minimal, deterministic, fast.

- __Determinism__
  - Seed RNG; mock time; sanitize snapshots (no volatile IDs/timestamps).

- __Learning Verification__
  - Flows: first‑time user → learned preferences → adapted suggestions.
  - Negative: noisy/conflicting signals; ensure no overfitting or premature lock‑in.

- __Selective Execution__
  - Run changed + related tests locally; keep CI parallel and fast.
  - Clean temporary test artifacts.

---

## 5) DevOps/SRE Rules

- __Environments__
  - Strict dev/stage/prod isolation; distinct secrets and data.
  - Feature flags protect memory write paths and new heuristics.

- __CI/CD__
  - Pre‑merge: lint, type‑check, unit/integration, security scan.
  - Post‑deploy: smoke tests, canary, automatic rollback on SLO breach.

- __Secrets & Config__
  - Centralized secrets manager; never commit credentials.
  - Immutable infra where possible; per‑env config.

- __Monitoring__
  - Dashboards: memory write volume, retrieval latency, guardrails, error budgets.
  - Alerts on anomalies (duplication spikes, token failures).

---

## 6) Data & Privacy Rules

- __Minimization__
  - Collect only what’s necessary; TTL by memory type.
  - User controls: export and delete; soft/hard delete policies.

- __Compliance__
  - Audit trails for memory mutations.
  - Authenticated, rate‑limited data export/deletion endpoints.

- __Safety Filters__
  - Redact sensitive entities from logs.
  - Content filters to avoid unsafe outputs; never echo banned terms.

---

## 7) UX Rules

- __Transparency__
  - “What I learned” confirmations; Memory Center UI.
  - Undo/revise flows; “I suggested this because…” explanations.

- __Interaction Pattern__
  - Single concise confirmation for write actions.
  - Respect communication style preference consistently.

- __Accessibility__
  - Keyboard‑first, ARIA roles, contrast compliance, screen‑reader support.

---

## 8) Evaluation & Metrics Rules

- __Key Metrics__
  - Memory precision/recall, re‑ask rate, adherence improvement, suggestion acceptance, satisfaction.
  - Latency P50/P95, error rates, hallucinations, guardrail triggers.

- __Offline Evaluations__
  - Golden conversations with expected memory effects.
  - A/B retrieval/ranking; measure acceptance and re‑ask suppression.

- __Online Evaluations__
  - Incremental rollout of learning heuristics; monitor KPIs; define rollback thresholds.

---

## 9) Documentation Rules

- __Contracts & Diagrams__
  - Up‑to‑date API specs; sequence diagrams for write/read flows.
  - ADRs for architectural choices and deprecations.

- __Runbooks__
  - Incident guides: degraded retrieval, memory corruption detection, rollback steps.
  - Privacy/security playbooks with contacts and steps.

---

## 10) Rollout & Change Management Rules

- __Feature Flags__
  - Wrap learning/mutations; must be quickly disable‑able.
  - Backward‑compatible migrations; validate pre/post migration.

- __Change Reviews__
  - Security review for changes impacting memory, auth, PII.
  - PM sign‑off for UX changes affecting transparency/confirmations.

---

## 11) Anti‑Patterns to Avoid

- __Do not__
  - Overwrite preferences without confirmation.
  - Log PII/secrets; transmit sensitive data unencrypted.
  - Rely purely on embeddings without structured filters.
  - Introduce non‑deterministic tests/brittle snapshots.
  - Scope‑creep: expand domains before memory quality is proven.

---

## 12) Minimal Technical Blueprint

- __Backend__
  - Services: memory_service, retrieval_service, reasoning/guardrails, actions_service.
  - Storage: relational DB for structured memories; vector index for semantic retrieval.
  - Auth: JWT + scopes for action execution.

- __Frontend__
  - Strict TypeScript; Tailwind for styling.
  - Components: Chat UI, Memory Center, Confirm dialogs.
  - Never render sensitive data without explicit user intent.

- __Pipelines__
  - CI: lint, type, tests, security.
  - CD: canary, smoke, rollback automation.

---

## 13) Release Criteria

- __Must‑Haves__
  - Reliable preference persistence with edit/delete.
  - Re‑ask suppression demonstrated in E2E flows.
  - Clear confirm‑before‑write UX.
  - Security baseline met: HTTPS, JWT, no secret logging.

- __Nice‑to‑Haves__
  - Memory insights (timeline/graph).
  - Adherence analytics with actionable suggestions.

---

Use this playbook across roles (system design, PM, dev, test, SRE). It ensures the assistant learns responsibly, adapts genuinely, and remains secure, testable, and operable.
