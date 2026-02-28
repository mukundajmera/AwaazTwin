# AwaazTwin – Identified Risks & TODOs

> Generated during Phase 0 (North Star, constraints, agent rules).
> These items must be addressed in subsequent phases before the app is production-ready.

---

## Risks

### 🔴 Critical

- **No application code exists yet.** The repo currently contains only `README.md`, `instruction.md`, and the Phase 0 docs. All application scaffolding (Next.js, package.json, TypeScript config, etc.) must be created from scratch in Phase 1–2.

- **No test infrastructure.** There is no testing framework, test runner, or test files. Vitest, Playwright, and React Testing Library must all be set up before any feature work begins.

- **No CI/CD pipeline.** There are no GitHub Actions workflows, linting configs, or automated checks. Without CI, regressions can slip through undetected.

### 🟡 High

- **GPU assumptions in TTS/Voice Cloning.** Coqui TTS XTTS and Bark models can be extremely slow on CPU. Real-world voice cloning may take minutes per short clip on CPU-only machines. The UI must clearly communicate expected wait times, and the backend must handle long-running jobs asynchronously (queuing, progress polling).

- **LLM model availability.** The default local LLM flow assumes Ollama or llama-server is installed and running with a compatible GGUF model. Users on constrained machines may not have the ~4–8 GB RAM needed for even small quantized models. The Settings UI must validate connectivity and give clear error messages.

- **Cross-platform Docker dependency.** TTS via Coqui requires Docker. Docker Desktop is not freely available for all commercial use cases, and some corporate environments restrict Docker. A non-Docker fallback path (or clear docs on alternatives) should be considered. This is a **blocker for Phase 4 TTS work** if Docker is unavailable.

- **Content sourcing and repo scope.** `instruction.md` references content structures from a separate system-design repo, but AwaazTwin's North Star focuses on voice cloning and TTS. Content must be authored specifically for AwaazTwin's domain: voice cloning workflows, TTS configuration guides, AI-powered audio features, and model selection. The scope of content work is significant and must be planned explicitly in Phase 1.

### 🟢 Medium

- **MDX rendering complexity.** Loading and rendering arbitrary MDX from the repo at runtime in Next.js App Router requires careful configuration (`@next/mdx`, content loaders, dynamic imports). Edge cases (images, code blocks, custom components) need testing.

- **State persistence.** PracticeSession and configuration data need a storage strategy. Options include: browser localStorage (simple but not portable), a lightweight SQLite/JSON backend (requires server state), or a cloud database (adds complexity). This decision should be made in Phase 1.

- **Security of API keys.** The Settings UI will handle LLM API keys and TTS service credentials. These must never be logged, exposed in client-side code, or committed to the repo. A secure storage mechanism (encrypted localStorage, server-side env vars, or a secrets manager) is needed.

- **Playwright browser dependencies.** Playwright requires specific browser binaries. CI environments and some developer machines may need `npx playwright install` to work. This should be documented and automated.

---

## TODOs (by Phase)

### Phase 1 – System Architecture
- [x] Clarify content scope: define what content AwaazTwin will serve (voice cloning guides, TTS tutorials, AI audio workflows) → see `docs/design.md` §8
- [x] Create detailed architecture design document (API surface, domain model, data flow) → see `docs/design.md`
- [x] Decide on state persistence strategy (localStorage + server-side JSON file store) → see `docs/design.md` §7
- [x] Define API endpoint contracts with request/response schemas → see `docs/design.md` §4
- [x] Document LLM client abstraction interface → see `docs/design.md` §5
- [x] Document TTS proxy interface → see `docs/design.md` §6
- [x] Define testing strategy document (what gets tested where, coverage targets) → see `docs/design.md` §9

### Phase 2 – UI Design
- [x] Design Home & Navigation: sidebar with content sections, progress indicators, status bar → see `docs/ui-design.md` §2
- [x] Design Topic Page Layout: MDX rendering, side panel (key ideas, pitfalls, related topics, practice button) → see `docs/ui-design.md` §3
- [x] Design Settings / Connections Page: LLM config form, TTS config form, test connection buttons, voice management → see `docs/ui-design.md` §4
- [x] Design Test Console / Diagnostics Page: suite cards, run/poll flow, results panel with logs → see `docs/ui-design.md` §5
- [x] Design Practice / Interview Mode Page: timed phases, phase progress stepper, scoring sliders, session persistence → see `docs/ui-design.md` §6
- [x] Define shared components (ConnectionStatusBadge, Toast, EmptyState, SliderInput, etc.) → see `docs/ui-design.md` §7
- [x] Define routing & URL structure with App Router file layout → see `docs/ui-design.md` §8
- [x] Define state management architecture (AppStateProvider, localStorage keys) → see `docs/ui-design.md` §9
- [x] Define responsive breakpoints & accessibility requirements → see `docs/ui-design.md` §10
- [x] Define per-surface testing approach with test file organization → see `docs/ui-design.md` §11

### Phase 3 – Portal MVP Implementation
- [ ] Scaffold Next.js App Router project (`apps/portal` or root-level)
- [ ] Set up TypeScript, Tailwind CSS, shadcn/ui
- [ ] Set up Vitest for unit/integration tests
- [ ] Set up Playwright for E2E tests
- [ ] Implement global navigation and layout
- [ ] Implement TopicPage component for MDX rendering
- [ ] Implement Settings / Connections page (LLM + TTS config forms)
- [ ] Implement Test Console / Diagnostics page
- [ ] Create stubbed API route handlers (`/api/llm/test-connection`, `/api/tts/test-connection`, `/api/tests/run`)
- [ ] Write unit, integration, and E2E tests for all MVP features
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Phase 4 – Content & Practice Flows
- [ ] Create content for all sections (Voice Cloning Guides, TTS Tutorials, Model Selection, Audio Processing Workflows, etc.)
- [ ] Implement PracticeTemplate and PracticeSession components
- [ ] Implement practice / interview mode UI with timed phases
- [ ] Implement self-scoring with rubric sliders
- [ ] Wire practice session persistence
- [ ] Add tests for practice flows (unit, integration, E2E)

### Phase 5 – Real Integration & UAT
- [ ] Replace LLM stubs with real Ollama/llama-server client
- [ ] Replace TTS stubs with real Coqui TTS proxy
- [ ] Implement voice cloning flow (upload sample → register voice → generate speech)
- [ ] Wire UI "Test Connection" buttons to real endpoints
- [ ] Implement `/api/tests/run` to trigger actual Playwright suites
- [ ] Create UAT checklist view in the portal
- [ ] Write comprehensive Playwright UAT scenarios (content browsing, LLM query, TTS generation, full practice session)
- [ ] Performance testing on CPU-only machines
- [ ] Security review (API key handling, input sanitization, CORS)
- [ ] Documentation for local development setup and deployment
