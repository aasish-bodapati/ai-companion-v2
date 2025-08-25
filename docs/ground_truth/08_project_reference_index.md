# Project Reference Index

This document lists **all source-of-truth files** for the AI Companion v2 project.
The AI builder and developers must reference these before generating answers, code, or documentation.

---

## 📂 Core Project Files
- `01_product_vision.md` → Product vision, pillars, MVP scope, metrics, roadmap themes.
- `architecture_overview.md` → System architecture, tech stack, deployment flow.
- `memory_system_design.md` → How long-term memory works, data structures, retrieval logic.
- `data_models.md` → Database schemas (Users, Conversations, Messages).
- `api_endpoints.md` → All REST and WebSocket endpoints with parameters & example calls.
- `34_coaching_api_contracts.md` → Coaching MVP endpoints: Goals, Routines, Trackers, Reviews, Actions
  - See: [Plans (Fitness/Nutrition)](34_coaching_api_contracts.md#plans)
  - See: [Actions → Set Current Plans (`fitness.set_current_plan`, `nutrition.set_current_plan`)](34_coaching_api_contracts.md#actions-tool-invocation)
 - `36_trackers_ui_behavior.md` → Trackers UI behavior and frontend API usage (MVP)
 - `37_milestone_plan_trackers_reviews_ops.md` → 1–2 sprint plan for Trackers, Reviews, Memory UX polish, and Ops maturity
- `35_action_suggestions_format.md` → Chat action suggestions: fenced `actions` blocks, confirmation flow, execution
- `frontend_structure.md` → Next.js folder structure, component hierarchy, state management rules.
- `backend_structure.md` → FastAPI folder structure, CRUD rules, service layers.
- `onboarding_flow.md` → First-run onboarding UX, data model, and API contract.
- `09_continuous_context_ingestion.md` → Passive memory hooks, auto-summaries, real-time promotion.
- `10_proactive_engagement.md` → Scheduled nudges, opportunistic pings, mood-based triggers.
- `11_memory_evolution.md` → Decay, temporal awareness, personality reflection, goal tracking.
- `12_cross_session_intelligence.md` → Proactive triggers, multi-modal memories, life timeline.
- `12_retrieval_and_scoring.md` → Retrieval scoring, boosts, decay
- `31_memory_scoring.md` → Source of truth for relevance vs importance scoring (backend config + algorithms)
- `32_retrieval_diagnostics.md` → Retrieval debug endpoint, fields, and frontend UI behavior
- `38_per_user_memory_toggle.md` → Per-user memory enable/disable behavior, API, and gating rules
- `13_memory_promotion_policy.md` → Memory capture/promotion policy, tunables
- `14_brain_meter_and_provenance.md` → Brain meter UX and memory provenance rules
- `15_document_uploads_to_memory.md` → Uploads UX, API, and security for adding documents/images to memory
- `17_unified_in_chat_uploads.md` → Canonical in-chat uploads workflow (replaces Documents page)
- `16_feature_flags.md` → Frontend feature flags and gating guidance for MVP focus.
- `18_memory_capture_policy.md` → Remember flag, smart gating, thresholds, and backend behavior
- `19_memory_api_contract.md` → Memory API contract and response shapes (memory_metadata as object)
- `20_model_selection_and_routing.md` → Environment-driven model choices and provider config
- `21_vision_analysis_workflow.md` → Vision analysis workflow in chat attachments
- `21_chat_actions_and_shortcuts.md` → Chat message actions and keyboard shortcuts (source of truth)
- `22_error_response_standard.md` → Canonical standardized error response shape and examples
- `23_memory_quality_playbook.md` → Retrieval quality (MMR, recency, config) single source of truth
- `24_weekly_digest.md` → Weekly Digest API, response shape, and UI guidance
 - `24_timeline_events.md` → Timeline SSE events, feature flags, and chat timing UI
 - `32_retrieval_diagnostics.md` → Retrieval diagnostics (debug flag, API, UI)
 - `25_privacy_profile_disclosure.md` → Profile disclosure policy and config flag
 - `26_birthday_gating.md` → Birthday disclosure and wish gating rules
 - `27_message_llm_extraction.md` → Message LLM extraction workflow (messages → concise memory facts)
- `29_always_respond_prompt_guard.md` → System rule to prevent empty replies and enforce clarifying questions
 - `30_memory_policy.md` → Memory capture, gating, quotas, and PII policy (source of truth)

---

## ⚙️ Operational Rules & Workflows
- `rules_security.md` → Authentication rules, data privacy policies, session management.
- `rules_coding_standards.md` → Code style, naming conventions, testing standards.
- `rules_memory_usage.md` → How to store, update, and retrieve user-specific memory safely.
- `workflow_development.md` → Development workflow, CI/CD steps.
- `workflow_bug_fixes.md` → How to report, reproduce, and fix bugs.
- `cleanup_standards.md` → Project cleanup rules, deprecations, file hygiene, and structural standards.
 - `16_feature_flags.md` → Frontend feature flags and gating guidance for MVP focus.
 - `22_error_response_standard.md` → Standard error shape contract for backend and frontend handling
 - `23_memory_quality_playbook.md` → Memory retrieval quality guidance and tuning parameters
 - `25_privacy_profile_disclosure.md` → Profile disclosure policy and config flag
- `28_calendar_chat_commands.md` → Chat-driven calendar commands, parsing rules, and backend/UX behavior
 - `32_calendar_intents_endpoint.md` → Unified backend NL intents endpoint for Calendar (request/response, behavior)
 - `30_memory_policy.md` → Memory capture, gating, quotas, and PII policy
- `33_actions_registry.md` → Source of truth for chat-invoked domain actions (tooling) and contracts

---

## 🛠 Known Limitations & References
- `known_issues.md` → Current bugs, blockers, and workarounds.
- `20_model_selection_and_routing.md` → Current LLM provider setup (OpenRouter), default models, and env configuration.
- `deployment_guide.md` → Environment setup, Docker config, hosting details.

---

## 🧠 AI Builder Instruction
**Rule for AI Builder:**  
Before answering any prompt or generating output:
1. Search all `.md` files listed above.
2. If an answer exists, use it exactly.
3. If no answer exists, ask the user for clarification before creating new content.
4. Never override or ignore documented rules without explicit confirmation from the user.
