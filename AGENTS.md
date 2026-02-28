# AwaazTwin – Agent Guidelines

## Preamble

This document governs every AI agent, Copilot session, and automated contributor working in the `mukundajmera/AwaazTwin` repository. **Read this file and `ARCHITECTURE.md` in full before making any changes.**

---

## Mandatory Reading Order

Before modifying **any** file in this repo, every agent **must**:

1. Read **`ARCHITECTURE.md`** – understand the North Star, hard constraints, domain model, and phase plan.
2. Read **this file (`AGENTS.md`)** – understand behavioral rules and testing expectations.
3. Read any **section-specific AGENTS files** (e.g., `apps/portal/AGENTS.md`, `docs/AGENTS.md`) if they exist in the directory you are about to modify.
4. Read **`instruction.md`** – understand the full prompt sequence and phased delivery plan.

If any of these files are missing or contradictory, **stop and ask** the human maintainer for clarification before proceeding.

---

## Non-Hallucination Rule

> **Do not invent files, APIs, endpoints, components, or behaviors that are not present in the repo or explicitly described in an approved design document.**

Specifically:

- **Do not create** source files, routes, or components unless the current phase's prompt explicitly requests them.
- **Do not reference** APIs or services that have not been implemented or stubbed in the codebase.
- **Do not assume** the existence of directories, packages, or configuration files. Verify by scanning the repo tree first.
- **If information is missing**, stop and ask the human maintainer. Never guess or fill in gaps with plausible-sounding but unverified content.

Violations of this rule will result in rejected PRs and reverted commits.

---

## Testing Expectations

### Every Feature Must Be Tested

| Test Type | Tool | Scope |
|---|---|---|
| **Unit** | Vitest | Individual functions, utilities, component logic |
| **Integration** | Vitest + React Testing Library | Component interactions, API handler behavior |
| **E2E** | Playwright | Full user flows through the browser UI |

### Testing Rules

1. **No feature without tests.** Every new component, API route, or user flow must have corresponding tests before the PR is considered complete.
2. **Tests must pass on CPU-only environments.** Do not write tests that require a GPU, external paid API, or network access to third-party services (mock/stub external dependencies).
3. **UI-triggerable tests.** A curated subset of the test suite must be runnable from the Test Console / Diagnostics page in the portal UI.
4. **Do not delete or modify existing passing tests** unless the change is directly required by the current task. If an existing test breaks due to your changes, fix the test to match the new correct behavior—do not simply remove it.
5. **Keep tests fast.** Unit and integration tests should complete in under 30 seconds total. E2E tests should complete in under 2 minutes.

---

## Code Style & Conventions

- **Language:** TypeScript (strict mode) for all application code.
- **Styling:** Tailwind CSS with shadcn/ui components.
- **Framework:** Next.js App Router (not Pages Router).
- **State management:** React hooks and context; avoid heavy state libraries unless justified.
- **API design:** Next.js Route Handlers returning JSON. Follow REST conventions.
- **Commits:** Small, cohesive commits with clear messages. One logical change per commit.
- **File naming:** kebab-case for files, PascalCase for React components.

---

## Constraint Reminders

These are restated from `ARCHITECTURE.md` for quick reference:

| # | Constraint | Summary |
|---|---|---|
| 1 | UI-Only Usage | All features accessible from the browser. No CLI-only functionality. |
| 2 | CPU-First | Must run on CPU-only macOS, Linux, Windows. GPU is never required. |
| 3 | Pluggable LLM | Local (Ollama/llama.cpp) default, cloud optional, same abstraction. |
| 4 | Optional TTS | Coqui TTS in Docker, opt-in, graceful degradation on CPU. |
| 5 | Production Testing | Unit + integration + E2E; subset triggerable from UI. |
| 6 | Non-Hallucination | Never invent. If unsure, stop and ask. |

---

## Workflow for Agents

1. **Plan** – State what you intend to do and which files you will create or modify. Get approval if the scope is large.
2. **Implement** – Write code following the constraints and conventions above.
3. **Test** – Run existing tests, add new tests for your changes, and verify all pass.
4. **Document** – Update relevant docs (README, ARCHITECTURE, inline comments) if your changes affect the architecture or user-facing behavior.
5. **Review** – Submit small, focused PRs. Call out any risks or TODOs explicitly.
