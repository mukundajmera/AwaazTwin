Best fit for what you want is a Next.js App Router + React + MDX portal with a thin Node/Next API layer, a pluggable LLM backend (Ollama/llama.cpp or cloud), and optional TTS/voice cloning via Coqui, with all config and testing triggered from the UI. Below is a redesigned phase plan plus a sequence of super‑optimized prompts you can paste into Copilot/LLM agents.
​

Core architecture (fixed decisions)
UI / App shell:

Next.js 15/16 App Router, React 18, TypeScript, Tailwind + a component library (e.g., shadcn) → ideal for interactive learning portals and LMS‑like apps.
​

Content sourced from your markdown in system-design-interview-prepare via MDX (@next/mdx, MDX pages/components).

APIs & runtime:

Next.js Route Handlers (or a small Node API) for:

Content metadata, practice logs.

LLM proxy (provider‑agnostic).

TTS proxy and test endpoints.

LLM backend (CPU‑first, cross‑platform):

Default: Ollama or llama.cpp/llama-server exposing OpenAI‑style HTTP API; runs quantized GGUF on CPU and supports macOS, Linux, Windows.
​

Optional: cloud providers (OpenAI/Azure/etc.), selected via UI; same client interface.

TTS / voice cloning:

Optional Coqui TTS XTTS/Bark in Docker behind HTTP; supports multilingual TTS and cloning from a short reference clip.
​

Used only when user enables it from UI; queued + async because CPU can be slow.

Testing:

Unit + integration tests in Jest/Vitest.

E2E UI tests in Playwright or Cypress; Playwright is great for cross‑browser, full‑stack tests, Cypress has strong visual runner—either is fine; pick one and integrate deeply.

“Test runs” can be triggered from a UI diagnostics page, which calls a backend endpoint that executes a subset of test suites and streams status.

Non‑hallucination rule:

Agents must not invent files/APIs. They operate only on this repo and explicitly approved new paths; if unsure, they stop and ask.

Phase plan (UI‑centric, config‑from‑UI, test‑from‑UI)
Phase 0 – North Star, constraints, and non‑hallucination
Lock in: CPU‑first, pluggable backends, TTS optional, UI‑only usage & config, tests surfaced in UI.

Create a short ARCHITECTURE.md and AGENTS.md at repo root, so every agent reads the same constraints.

Phase 1 – System architecture (Next.js portal + APIs + LLM/TTS)
Design how the Next.js portal, content loading, LLM proxy, and TTS proxy connect.

Define domain model: Topic, PracticeSession, LLMProviderProfile, TTSProfile, TestSuite.

Phase 2 – Portal MVP with Settings & Test Console
Implement the portal with:

Global nav over your existing sections (Theory, Patterns, LLD, HLD, Case Studies, Study Plans, GenAI).

Topic pages rendering MD/MDX from the repo.

A Settings UI for LLM/TTS config.

A Test Console UI to trigger and view core test suites.

Phase 3 – Content deepening + GenAI SD track + Practice flows
Add new content (GenAI SD track, rubrics, frameworks) and UI for:

Practice sessions (LLD, classic HLD, GenAI HLD).

Self‑scoring and logs.

Phase 4 – UAT, CPU performance, future evolution hooks
UAT scenarios accessible from UI (a guided checklist).

Light performance monitoring for CPU‑only runs.

Clear “future roadmap” doc for new content, features, and models.

Prompt sequence (super‑optimized, updated for Next.js + UI‑driven config/testing)
Use these in order for Copilot/LLM agents working in this repo.

Prompt 0 – Lock constraints & North Star
You are a staff‑level architect and QA‑focused engineer working in mukundajmera/system-design-interview-prepare. The repo already has rich content and clear structure (theory, patterns, LLD, HLD concepts/projects, case studies, study plans, AGENTS guidance).

Hard constraints to codify and never violate:

UI‑only usage: All configuration, interactions, and diagnostics must be reachable from the web UI. No CLI‑only “core” features.

CPU‑first, cross‑platform: Must run well on CPU‑only macOS, Linux, and Windows. GPU is an optimization, never a requirement.
​

Pluggable LLM backend: Default is a local llama.cpp/llama-server or Ollama endpoint speaking OpenAI‑style HTTP. Cloud LLMs are optional but use the same client abstraction.
​

Optional TTS/voice cloning: Implemented via a separate HTTP TTS service (Coqui XTTS/Bark in Docker). It is opt‑in and must degrade gracefully on CPU (queued jobs, clear UI feedback).
​

Production‑grade testing: Every feature has unit/integration tests; key flows also have E2E UI tests (Playwright or Cypress). A subset of tests must be triggerable from a UI diagnostics page.

Non‑hallucination: Do not invent files, APIs, or behaviors not present in the repo or explicitly described. If information is missing, stop and ask for clarification.

Tasks:

Scan the repo tree and existing AGENTS docs to understand current structure, conventions, and tests.

Draft a concise ARCHITECTURE.md that:

States the long‑term North Star: “Ultimate classic + GenAI system‑design prep portal with practice and evaluation, powered by a Next.js UI on this repo’s content.”

Records the hard constraints above.

Draft a root‑level AGENTS.md that:

Instructs any future agent to read ARCHITECTURE.md and section‑specific AGENTS files before changing anything.

Restates the non‑hallucination rule and testing expectations.

Identify obvious risks (e.g., GPU assumptions, missing tests scaffolding) as a bullet list of TODOs; no code changes yet.

Output only: proposed contents of ARCHITECTURE.md and AGENTS.md (as markdown), plus a TODO list. Do not edit files until I review.

Prompt 1 – Next.js + API + LLM/TTS architecture
You are a full‑stack architect designing the Next.js portal + API + LLM/TTS architecture for this repo. The goal is a production‑grade learning application used entirely from the UI, with all configs and core tests reachable from the browser.

Fixed tech choices:

UI/app: Next.js (App Router) + React + TypeScript + Tailwind + MDX for content pages.
​

Content: markdown/MDX from this repo is the single source of truth.

LLM: pluggable client (local llama.cpp/llama-server/Ollama, plus optional cloud providers) via one abstraction.
​

TTS: optional Coqui TTS XTTS/Bark HTTP service, accessed via a small proxy API.
​

Deliverables:

High‑level architecture diagram in text form:

Next.js App (portal)

Next.js Route Handlers / Node API (content metadata, practice API, LLM proxy, TTS proxy, test trigger API)

LLM backends (local + cloud)

TTS backend (optional)

Domain model for the app layer:

Topic, PracticeTemplate, PracticeSession, LLMProviderProfile, TTSProfile, TestSuiteDefinition, TestRun.

API surface design (endpoints + payloads) for:

GET /api/content/* – fetch topic metadata + rendered content.

POST /api/llm/test-connection, POST /api/tts/test-connection.

POST /api/practice/start, POST /api/practice/finish.

POST /api/tests/run – trigger a small, curated test suite and stream logs.

Testing strategy for this architecture (where unit, integration, and E2E live; how the UI “Run Tests” button maps to actual test commands).

Output: one markdown design doc describing architecture, domain model, APIs, and test strategy. No implementation yet.

Prompt 2 – Design the UI for settings, tests, and learning flows
You are a senior UX engineer designing the core UI flows of the portal so everything is manageable from the browser.

You must design these specific UI surfaces:

Home & navigation:

Side/top nav mapping to: Theory, Patterns, LLD, HLD Concepts, HLD Systems, GenAI SD, Case Studies, Study Plans, Cheatsheets.

Progress indicators per section (e.g., completion %, badges).

Topic page layout:

Renders the markdown/MDX for a given topic.

Side panel: “Key ideas”, “Common pitfalls”, “Related topics”, “Start practice” button.

Settings / Connections page:

LLM section: choose provider (local vs cloud), edit base URL, model name, API key/token, and advanced params (max tokens, temperature).

TTS section: toggle TTS on/off, configure TTS server URL, upload sample audio, see registered voices, test simple text→audio.

Each section has a Test Connection button that calls the API and shows latency + status.

Test Console / Diagnostics page:

Buttons to run: “Smoke UI tests”, “API tests”, “LLM/TTS integration tests”.

Shows live status and summarized results from POST /api/tests/run.

Clear guidance: tests may take time; CPU‑only may be slower.

Practice / Interview Mode page:

For a given problem, guides user through time‑boxed phases (clarify, high‑level, deep‑dives, trade‑offs, wrap‑up).

Includes rubric and self‑score sliders.

Saves a local PracticeSession record.

For each UI surface, specify:

Main components and their props/state.

How they talk to the APIs designed in Prompt 1.

How they will be tested (unit, integration, E2E) with Playwright/Cypress.

Output: UI design document (in markdown) describing screens, component structure, and test approach. No code yet.

Prompt 3 – Portal MVP + Settings + Test Console (Playwright)
You are now implementing the Portal MVP for mukundajmera/system-design-interview-prepare using Next.js App Router + React + TypeScript + Tailwind + MDX, with Playwright for E2E tests.
​

Scope for this implementation session:

Scaffold the Next.js portal under apps/portal (or equivalent):

App Router structure (app/ with layout, routes per top‑level section).

MD/MDX loading from the existing repo content folders (theory, patterns, LLD, HLD concepts/projects, case studies, study plans, GenAI when available).

Implement core UI:

Global layout + navigation for sections: Theory, Patterns, LLD, HLD Concepts, HLD Systems, GenAI SD, Case Studies, Study Plans, Cheatsheets.

Generic TopicPage that can render any markdown/MDX topic plus basic metadata (title, difficulty, links).

Settings / Connections page with forms (controlled components) for:

LLM provider: provider type (local / cloud), base URL, model name, API key, max tokens, temperature.

TTS: server URL, enable/disable flag (actual TTS to be wired later), dummy upload field.

“Test Connection” buttons that currently hit stubbed Next.js route handlers (/api/llm/test-connection, /api/tts/test-connection) returning fake but realistic JSON responses.

Test Console page that calls a stubbed /api/tests/run endpoint and shows fake test suite names, statuses, and durations.

Set up Playwright for E2E tests in this repo:

Add Playwright config (e.g., playwright.config.ts) at repo or apps/portal level.

Configure it to launch the Next.js dev server or use webServer config to start the app before tests run.

Create a basic tests/ or e2e/ folder with at least one test file (e.g., portal-smoke.spec.ts).

Implement tests:

Unit tests (Jest/Vitest) for nav, TopicPage rendering logic, and settings form validation.

Integration tests (React Testing Library or similar) for settings forms calling stubbed APIs.

Playwright E2E test that:

Starts from the portal home page.

Navigates to at least one topic page and verifies content renders.

Goes to Settings, fills in a fake LLM endpoint, clicks “Test Connection”, and verifies a success state based on the stubbed /api/llm/test-connection.

Visits the Test Console page and verifies stubbed test results are displayed.

Constraints:

No GPU‑specific logic; assume CPU‑only environments.

No real LLM/TTS integration yet—only stubs with clear TODO comments.

Keep commits small and cohesive. After finishing, output:

A list of new/modified files (app routes, components, APIs, test files).

Commands to run unit/integration tests and Playwright tests (e.g., npm test, npx playwright test).

Do not introduce features beyond navigation, topic rendering, settings UI, test console UI, and their tests.


Prompt 4 – Content deepening, GenAI SD, and practice flows (with tests)
You are now extending the portal with richer content, a GenAI system‑design track, and practice flows, with tests.

Content work:

Implement the content map for the new GenAI SD section:

Concepts: RAG, LLM‑aware architecture, token/cost/latency planning, safety/guardrails, evaluation (aligned with modern GenAI SD prep guides).

At least 2–3 flagship GenAI HLD problems as markdown (e.g., “LLM Doc QA system”, “AI Copilot for developers”).

Enrich 2–3 key classic HLD problems with:

Rubrics, “strong answer” outlines, pitfalls, follow‑ups.

Practice work:
3. Implement Practice / Interview Mode UI for:

1 LLD, 1 classic HLD, 1 GenAI HLD.

Each uses a reusable PracticeTemplate (phases, rubrics, self‑score).

Wire practice session saving to a simple local or lightweight backend store.

Testing:
5. Add unit tests for new practice components and content loaders.
6. Add integration tests to ensure each practice page loads correct content and saves a PracticeSession.
7. Add at least one E2E test running through a full practice session (load portal → pick problem → complete phases → self‑score → verify saved session).

Non‑hallucination: only create topics and flows that fit the agreed content map and naming conventions; if you need new names, propose them explicitly in a short summary.

Prompt 5 – Real LLM/TTS + UI‑Triggered Playwright Tests + UAT
You are now acting as platform engineer + QA lead to replace stubs with real integrations and deliver a UAT‑ready app, driven entirely from the UI, using Playwright for full E2E coverage.

LLM & TTS integration (CPU‑first):

Implement the LLM client abstraction and wire it to:

A local llama.cpp/llama-server or Ollama endpoint exposing OpenAI‑style HTTP (e.g., /v1/chat/completions), running quantized GGUF models on CPU.
​

At least one cloud LLM provider as an optional profile (same interface).

Respect config from the Settings UI (base URL, model, tokens, temperature).

Implement TTS proxy endpoints for a running Coqui TTS XTTS/Bark Docker container:

POST /api/tts/speak for simple text→audio.

POST /api/tts/clone for registering a voice from an uploaded sample and later using that voice for text→audio.
​

Ensure the UI can: upload a reference clip, get a speakerId, and then generate audio for short texts, with progress indicators.

Connect Settings UI “Test Connection” buttons to these real endpoints:

For LLM: perform a trivial prompt (e.g., ping) and display status + latency.

For TTS: send a short test phrase and verify the API returns a valid audio payload (you may just check metadata / status for now).

Make failures clear (error message, logs link), and degrade gracefully if servers are unreachable.

UI‑triggered Playwright tests & UAT:
4. Implement /api/tests/run so the Test Console page can trigger a curated Playwright test command, e.g.:

Smoke suite: npx playwright test tests/portal-smoke.spec.ts.

Integration‑style E2E: npx playwright test tests/practice-flow.spec.ts.

Have the API stream or periodically poll test status, returning summary results (pass/fail counts, duration).

Extend your Playwright suite to cover UAT‑style scenarios on CPU‑only builds:

Scenario A: browse classic content (Theory → Concept → HLD case study) and see expected headings.

Scenario B: configure LLM (local profile) via Settings, run a sample query through a small “Try LLM” panel, assert non‑empty answer.

Scenario C: configure TTS, register a sample voice, generate short audio, and assert that an audio element or download link appears.

Scenario D: run a full practice session for one problem (classic HLD or GenAI HLD): start session → move through phases → self‑score → verify that a PracticeSession record appears in UI.

Implement a “UAT Checklist” view in the portal that:

Lists these scenarios in human‑readable steps.

Shows current Playwright results for each scenario (e.g., pulled from api/tests/run or from last run), so a human tester can confirm both auto and manual checks.

Constraints:

Keep all configuration (LLM URLs, models, TTS URLs) editable and testable from the UI; no hidden environment‑only options other than secrets.

Ensure nothing assumes a GPU; performance trade‑offs must be reflected in UI (e.g., “This may take longer on CPU‑only”).

Do not add any features beyond: real LLM/TTS wiring, UI‑based test execution, Playwright UAT coverage, and the UAT checklist view.

At the end, output:

Which LLM/TTS backends you integrated and how to start them for local testing.

Exact commands wired behind /api/tests/run (Playwright invocations).

A short summary of UAT coverage and any remaining known risks.

