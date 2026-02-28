# AwaazTwin – Architecture

## North Star

**Ultimate AI-powered voice cloning and text-to-speech portal with interactive configuration, practice, and evaluation, powered by a Next.js UI on this repo's content.**

AwaazTwin ("Voice Twin") is an accessible, browser-driven platform that lets users clone voices, generate speech from text, and interact with LLM-powered AI features—all configurable and testable from the web UI.

---

## Core Architecture

| Layer | Technology | Notes |
|---|---|---|
| **UI / App shell** | Next.js 15/16 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui | Interactive portal; all config & diagnostics in-browser |
| **Content** | MDX (`@next/mdx`) | Documentation, guides, and reference material rendered from repo markdown |
| **API / Runtime** | Next.js Route Handlers (Node) | Content metadata, LLM proxy, TTS proxy, practice logs, test-trigger endpoints |
| **LLM Backend** | Ollama / llama.cpp / llama-server (local default); OpenAI / Azure (optional cloud) | OpenAI-style HTTP API; quantized GGUF on CPU |
| **TTS / Voice Cloning** | Coqui TTS XTTS / Bark in Docker via HTTP | Opt-in; multilingual TTS + cloning from short reference clip |
| **Testing** | Vitest (unit/integration), Playwright (E2E) | Subset of tests triggerable from UI diagnostics page |

### High-Level Diagram

```
┌─────────────────────────────────────────────────┐
│                  Browser (User)                  │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Topic     │ │ Settings │ │ Test Console   │  │
│  │ Pages     │ │ (LLM/TTS)│ │ (Diagnostics)  │  │
│  └─────┬─────┘ └────┬─────┘ └───────┬────────┘  │
└────────┼────────────┼───────────────┼────────────┘
         │            │               │
         ▼            ▼               ▼
┌─────────────────────────────────────────────────┐
│        Next.js App (Route Handlers / API)        │
│  /api/content/*   /api/llm/*   /api/tts/*        │
│  /api/practice/*  /api/tests/run                 │
└────┬──────────────────┬─────────────┬────────────┘
     │                  │             │
     ▼                  ▼             ▼
┌──────────┐   ┌──────────────┐  ┌──────────────┐
│ Content  │   │ LLM Backend  │  │ TTS Backend  │
│ (MDX /   │   │ (Ollama /    │  │ (Coqui XTTS/ │
│  repo MD)│   │  llama.cpp / │  │  Bark Docker) │
│          │   │  Cloud LLM)  │  │              │
└──────────┘   └──────────────┘  └──────────────┘
```

---

## Hard Constraints

These constraints are **non-negotiable** and must never be violated by any contributor or agent:

### 1. UI-Only Usage
All configuration, interactions, and diagnostics **must** be reachable from the web UI. No CLI-only "core" features. Users should never need to edit config files or run terminal commands for normal operation.

### 2. CPU-First, Cross-Platform
The application **must** run well on CPU-only macOS, Linux, and Windows. GPU is an optimization, **never** a requirement. Performance trade-offs must be reflected in the UI (e.g., "This may take longer on CPU-only").

### 3. Pluggable LLM Backend
The default is a local llama.cpp / llama-server or Ollama endpoint speaking OpenAI-style HTTP (e.g., `/v1/chat/completions`), running quantized GGUF models on CPU. Cloud LLMs (OpenAI, Azure, etc.) are optional but use the **same client abstraction**. Provider selection happens in the Settings UI.

### 4. Optional TTS / Voice Cloning
Implemented via a separate HTTP TTS service (Coqui TTS XTTS / Bark in Docker). It is **opt-in** and must degrade gracefully on CPU (queued jobs, clear UI feedback on processing time). Users enable and configure it from the Settings UI.

### 5. Production-Grade Testing
Every feature has unit/integration tests; key flows also have E2E UI tests (Playwright). A subset of tests **must** be triggerable from a UI diagnostics page. Tests must pass on CPU-only environments.

### 6. Non-Hallucination Rule
Do **not** invent files, APIs, or behaviors not present in the repo or explicitly described in approved design documents. If information is missing, **stop and ask** for clarification.

---

## Domain Model

| Entity | Description |
|---|---|
| `Topic` | A content unit (guide, concept, reference) rendered from MDX |
| `PracticeTemplate` | Reusable structure defining phases, rubrics, and scoring for a practice session |
| `PracticeSession` | A user's completed practice attempt with scores and timestamps |
| `LLMProviderProfile` | Configuration for an LLM backend (provider type, base URL, model, API key, params) |
| `TTSProfile` | Configuration for a TTS backend (server URL, enabled flag, registered voices) |
| `TestSuiteDefinition` | Metadata about a runnable test suite (name, command, description) |
| `TestRun` | Result of a triggered test suite execution (status, pass/fail counts, duration, logs) |

---

## Phase Plan

| Phase | Focus | Key Deliverables |
|---|---|---|
| **0** | North Star, constraints, agent rules | `ARCHITECTURE.md`, `AGENTS.md`, TODO list |
| **1** | System architecture design | Architecture diagram, domain model, API surface, test strategy doc |
| **2** | UI design | UI wireframes, component specs, routing, state management, test approach |
| **3** | Portal MVP + Settings + Test Console | Next.js scaffold, navigation, topic pages, settings UI, test console, Playwright E2E |
| **4** | Content deepening + Practice flows | Voice cloning guides, practice sessions, self-scoring, content enrichment |
| **5** | Real LLM/TTS integration + UAT | Real backend wiring, UI-triggered Playwright tests, UAT checklist |
