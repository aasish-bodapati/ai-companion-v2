# Project Reference Index

This document lists **all source-of-truth files** for the AI Companion v2 project.
The AI builder and developers must reference these before generating answers, code, or documentation.

---

## 📂 Core Project Files
- `architecture_overview.md` → System architecture, tech stack, deployment flow.
- `memory_system_design.md` → How long-term memory works, data structures, retrieval logic.
- `data_models.md` → Database schemas (Users, Conversations, Messages).
- `api_endpoints.md` → All REST and WebSocket endpoints with parameters & example calls.
- `frontend_structure.md` → Next.js folder structure, component hierarchy, state management rules.
- `backend_structure.md` → FastAPI folder structure, CRUD rules, service layers.

---

## ⚙️ Operational Rules & Workflows
- `rules_security.md` → Authentication rules, data privacy policies, session management.
- `rules_coding_standards.md` → Code style, naming conventions, testing standards.
- `rules_memory_usage.md` → How to store, update, and retrieve user-specific memory safely.
- `workflow_development.md` → Development workflow, CI/CD steps.
- `workflow_bug_fixes.md` → How to report, reproduce, and fix bugs.
- `cleanup_standards.md` → Project cleanup rules, deprecations, file hygiene, and structural standards.

---

## 🛠 Known Limitations & References
- `known_issues.md` → Current bugs, blockers, and workarounds.
- `integration_providers.md` → LLM and embeddings provider details (Together AI, OpenAI).
- `deployment_guide.md` → Environment setup, Docker config, hosting details.

---

## 🧠 AI Builder Instruction
**Rule for AI Builder:**  
Before answering any prompt or generating output:
1. Search all `.md` files listed above.
2. If an answer exists, use it exactly.
3. If no answer exists, ask the user for clarification before creating new content.
4. Never override or ignore documented rules without explicit confirmation from the user.
