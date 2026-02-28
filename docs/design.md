# AwaazTwin – System Design Document

> **Phase 1 deliverable** — Detailed architecture, domain model, API contracts, and testing strategy.
> No implementation yet; this document is the blueprint for Phase 2+.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Diagram & Data Flow](#2-component-diagram--data-flow)
3. [Domain Model](#3-domain-model)
4. [API Surface Design](#4-api-surface-design)
5. [LLM Client Abstraction](#5-llm-client-abstraction)
6. [TTS Proxy Interface](#6-tts-proxy-interface)
7. [State Persistence Strategy](#7-state-persistence-strategy)
8. [Content Strategy](#8-content-strategy)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Architecture Overview

AwaazTwin is a **Next.js App Router** application that serves as a voice cloning and TTS portal. The architecture is structured in four layers:

| Layer | Responsibility | Technology |
|---|---|---|
| **Presentation** | UI rendering, navigation, user interaction | Next.js App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **API** | Route handlers, business logic, proxy to backends | Next.js Route Handlers (Node.js runtime) |
| **Integration** | Communication with external LLM and TTS services | Provider-agnostic client abstractions |
| **Storage** | Persisting configuration, practice sessions, test results | Browser localStorage + server-side JSON file store |

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App structure | Single Next.js app at `apps/portal/` | Monorepo-ready; keeps portal isolated from docs |
| Router | App Router (not Pages) | Server components, layouts, streaming support |
| Styling | Tailwind CSS + shadcn/ui | Consistent design tokens, accessible components |
| Content format | MDX via `@next/mdx` | Rich interactive content from markdown files in repo |
| LLM integration | Provider-agnostic abstraction | Same interface for Ollama, llama.cpp, OpenAI, Azure |
| TTS integration | HTTP proxy to Coqui TTS | Opt-in, decoupled, graceful CPU degradation |
| State storage | localStorage (client) + JSON file (server) | Zero external DB dependency; portable; upgradeable |
| Testing | Vitest + React Testing Library + Playwright | Fast unit/integration; reliable E2E; UI-triggerable |

---

## 2. Component Diagram & Data Flow

### System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                  │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ Navigation │  │ Topic    │  │ Settings   │  │ Test        │  │
│  │ Layout     │  │ Pages    │  │ Page       │  │ Console     │  │
│  │            │  │ (MDX)    │  │ (LLM/TTS)  │  │ (Diagnostics│  │
│  └─────┬──────┘  └────┬─────┘  └─────┬──────┘  └──────┬──────┘  │
│        │              │              │                │          │
│  ┌─────┴──────────────┴──────────────┴────────────────┴───────┐  │
│  │              React Context (AppState)                      │  │
│  │  • LLM config    • TTS config    • Practice sessions       │  │
│  │  • Test results   • Content index • UI preferences         │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │ fetch / POST                          │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                Next.js Route Handlers (API Layer)                │
│                                                                  │
│  /api/content/*          Content metadata & rendered MDX         │
│  /api/llm/test-connection   LLM connectivity check              │
│  /api/llm/chat              LLM chat completions proxy          │
│  /api/tts/test-connection   TTS server connectivity check       │
│  /api/tts/speak             Text-to-speech generation           │
│  /api/tts/voices            List registered voices              │
│  /api/tts/clone             Register a cloned voice             │
│  /api/practice/start        Begin a practice session            │
│  /api/practice/finish       Complete and score a session        │
│  /api/practice/sessions     List past sessions                  │
│  /api/settings              Read/write app settings             │
│  /api/tests/run             Trigger test suite execution        │
│  /api/tests/status          Poll running test status            │
│                                                                  │
└──────┬─────────────────────┬────────────────────┬────────────────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Content      │   │ LLM Backend      │   │ TTS Backend      │
│ Store        │   │                  │   │ (Optional)       │
│              │   │ ┌──────────────┐ │   │                  │
│ MDX files    │   │ │ Ollama       │ │   │ Coqui TTS XTTS  │
│ in repo      │   │ │ (default)    │ │   │ or Bark          │
│ /content/    │   │ └──────────────┘ │   │ in Docker        │
│              │   │ ┌──────────────┐ │   │                  │
│              │   │ │ llama.cpp /  │ │   │ HTTP API:        │
│              │   │ │ llama-server │ │   │  POST /api/tts   │
│              │   │ └──────────────┘ │   │  POST /api/clone │
│              │   │ ┌──────────────┐ │   │  GET  /api/voices│
│              │   │ │ OpenAI /     │ │   │                  │
│              │   │ │ Azure (cloud)│ │   │                  │
│              │   │ └──────────────┘ │   │                  │
└──────────────┘   └──────────────────┘   └──────────────────┘
```

### Request Flow Examples

**Topic page load:**
```
Browser → GET /api/content/voice-cloning/getting-started
       → API reads /content/voice-cloning/getting-started.mdx
       → Returns { metadata, renderedContent }
       → TopicPage component renders MDX
```

**LLM test connection:**
```
Browser → POST /api/llm/test-connection { baseUrl, model }
       → API sends trivial prompt to LLM backend
       → Returns { status: "ok", latencyMs: 142, model: "llama3.2" }
       → Settings UI shows green checkmark + latency
```

**TTS voice cloning:**
```
Browser → POST /api/tts/clone (multipart/form-data: { audio, name, language })
       → API proxies to Coqui TTS Docker container
       → Returns { speakerId: "voice_abc123", status: "registered" }
       → Settings UI shows new voice in voice list
```

**Test suite execution:**
```
Browser → POST /api/tests/run { suiteId: "smoke" }
       → API spawns: npx playwright test tests/smoke.spec.ts
       → Returns { runId: "run_123", status: "running" }
       → Browser polls GET /api/tests/status?runId=run_123
       → Returns { status: "completed", passed: 5, failed: 0, duration: 12400 }
```

---

## 3. Domain Model

### TypeScript Interfaces

```typescript
// ─── Content ─────────────────────────────────────────────

interface Topic {
  /** Unique slug derived from file path: strip content/ prefix + .mdx extension,
   *  keep directory separators as "/". e.g. "content/voice-cloning/getting-started.mdx" → "voice-cloning/getting-started" */
  slug: string;
  /** Human-readable title */
  title: string;
  /** Content section: "voice-cloning", "tts", "models", "guides", "reference" */
  section: ContentSection;
  /** Brief summary for listings and search */
  summary: string;
  /** Difficulty level */
  difficulty?: "beginner" | "intermediate" | "advanced";
  /** Related topic slugs */
  relatedTopics?: string[];
  /** Tags for filtering */
  tags?: string[];
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

type ContentSection =
  | "voice-cloning"
  | "tts"
  | "models"
  | "guides"
  | "reference";

// ─── Practice ────────────────────────────────────────────

interface PracticeTemplate {
  /** Unique identifier */
  id: string;
  /** Display name */
  title: string;
  /** Brief description for listings and cards */
  description: string;
  /** Which section this belongs to */
  section: ContentSection;
  /** Ordered list of timed phases */
  phases: PracticePhase[];
  /** Scoring rubric dimensions */
  rubric: RubricDimension[];
  /**
   * Estimated total duration in seconds.
   * Computed field: sum of `phases[].durationSeconds`.
   * Not stored — derived at load time for display in PracticeTemplateCard.
   */
  // estimatedDurationSeconds: number; (computed, not persisted)
}

interface PracticePhase {
  /** Phase name, e.g. "Setup", "Configuration", "Execution", "Review" */
  name: string;
  /** Description of what the user should do */
  description: string;
  /** Suggested duration in seconds */
  durationSeconds: number;
}

interface RubricDimension {
  /** Dimension name, e.g. "Audio Quality", "Model Selection" */
  name: string;
  /** Description of what is being scored */
  description: string;
  /** Min score (inclusive) */
  minScore: number;
  /** Max score (inclusive) */
  maxScore: number;
}

interface PracticeSession {
  /** Unique session ID (UUID) */
  id: string;
  /** Reference to the PracticeTemplate used */
  templateId: string;
  /** When the session started (ISO 8601) */
  startedAt: string;
  /** When the session was completed (ISO 8601), null if in progress */
  completedAt: string | null;
  /** User's self-scores per rubric dimension */
  scores: Record<string, number>;
  /** Free-form notes from the user */
  notes: string;
  /** Index of the currently active phase (0-based). Only meaningful when completedAt is null (session in progress). Set to null when the session is completed. */
  currentPhase: number | null;
}

// ─── LLM ─────────────────────────────────────────────────

interface LLMProviderProfile {
  /** Unique profile ID */
  id: string;
  /** Display name, e.g. "Local Ollama", "OpenAI GPT-4" */
  name: string;
  /** Provider type */
  provider: "ollama" | "llama-cpp" | "openai" | "azure" | "custom";
  /** Base URL for the API, e.g. "http://localhost:11434" */
  baseUrl: string;
  /** Model identifier, e.g. "llama3.2", "gpt-4o" */
  model: string;
  /**
   * API key or token. SECURITY: stored server-side only, never included in
   * GET /api/settings responses, never sent to the browser. Write-only from
   * the Settings UI via PUT /api/settings.
   */
  apiKey?: string;
  /** Maximum tokens for completions */
  maxTokens: number;
  /** Temperature for sampling (0.0 – 2.0) */
  temperature: number;
  /** Whether this is the active/default profile */
  isDefault: boolean;
}

// ─── TTS ─────────────────────────────────────────────────

interface TTSProfile {
  /** Unique profile ID */
  id: string;
  /** Display name */
  name: string;
  /** TTS server base URL, e.g. "http://localhost:5002" */
  serverUrl: string;
  /** Whether TTS is enabled */
  enabled: boolean;
  /** Registered cloned voices */
  voices: TTSVoice[];
}

interface TTSVoice {
  /** Server-assigned speaker ID */
  speakerId: string;
  /** User-given name for this voice */
  name: string;
  /** Language code, e.g. "en", "hi", "es" */
  language: string;
  /** When the voice was registered */
  createdAt: string;
}

// ─── Testing ─────────────────────────────────────────────

interface TestSuiteDefinition {
  /** Unique suite ID, e.g. "smoke", "api", "llm-integration" */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description shown in Test Console UI */
  description: string;
  /** Playwright/Vitest command to execute */
  command: string;
  /** Estimated duration label, e.g. "~10s", "~2min" */
  estimatedDuration: string;
  /** Whether this requires external services (LLM/TTS) */
  requiresExternalServices: boolean;
}

interface TestRun {
  /** Unique run ID (UUID) */
  id: string;
  /** Which suite was executed */
  suiteId: string;
  /** Run status */
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  /** When the run started */
  startedAt: string;
  /** When the run finished (null if still running) */
  completedAt: string | null;
  /** Number of tests that passed */
  passed: number;
  /** Number of tests that failed */
  failed: number;
  /** Number of tests skipped */
  skipped: number;
  /** Total duration in milliseconds */
  durationMs: number | null;
  /** Log output (truncated for large runs) */
  logs: string;
}

// ─── App Settings ────────────────────────────────────────

interface AppSettings {
  /** Active LLM provider profile ID */
  activeLLMProfileId: string | null;
  /** Active TTS profile ID */
  activeTTSProfileId: string | null;
  /** All configured LLM profiles */
  llmProfiles: LLMProviderProfile[];
  /** All configured TTS profiles */
  ttsProfiles: TTSProfile[];
  /** UI preferences */
  ui: {
    /** Theme preference */
    theme: "light" | "dark" | "system";
    /** Sidebar collapsed state */
    sidebarCollapsed: boolean;
  };
}
```

### Entity Relationships

```
AppSettings
 ├── llmProfiles[] ──→ LLMProviderProfile
 ├── ttsProfiles[] ──→ TTSProfile
 │                      └── voices[] ──→ TTSVoice
 └── activeLLMProfileId / activeTTSProfileId

Topic (from MDX files)
 └── relatedTopics[] ──→ Topic (by slug)

PracticeTemplate
 ├── phases[] ──→ PracticePhase
 └── rubric[] ──→ RubricDimension

PracticeSession
 └── templateId ──→ PracticeTemplate

TestSuiteDefinition (static registry)
TestRun
 └── suiteId ──→ TestSuiteDefinition
```

---

## 4. API Surface Design

All endpoints are Next.js Route Handlers under `apps/portal/app/api/`.

### 4.1 Content API

#### `GET /api/content`

List all available topics with metadata.

**Response `200`:**
```json
{
  "topics": [
    {
      "slug": "voice-cloning/getting-started",
      "title": "Getting Started with Voice Cloning",
      "section": "voice-cloning",
      "summary": "Learn the basics of AI voice cloning...",
      "difficulty": "beginner",
      "tags": ["voice-cloning", "setup"],
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### `GET /api/content/[...slug]`

Fetch a single topic's metadata and rendered content.

**Response `200`:**
```json
{
  "topic": {
    "slug": "voice-cloning/getting-started",
    "title": "Getting Started with Voice Cloning",
    "section": "voice-cloning",
    "summary": "...",
    "difficulty": "beginner",
    "relatedTopics": ["tts/coqui-setup", "models/xtts-v2"],
    "tags": ["voice-cloning", "setup"],
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  "content": "<rendered HTML from MDX>"
}
```

**Response `404`:**
```json
{ "error": "Topic not found", "slug": "invalid/slug" }
```

### 4.2 LLM API

#### `POST /api/llm/test-connection`

Test connectivity to an LLM backend.

**Request:**
```json
{
  "provider": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "llama3.2",
  "apiKey": null
}
```

**Response `200`:**
```json
{
  "status": "ok",
  "provider": "ollama",
  "model": "llama3.2",
  "latencyMs": 142,
  "message": "Successfully connected to Ollama"
}
```

**Response `502`:**
```json
{
  "status": "error",
  "provider": "ollama",
  "message": "Connection refused at http://localhost:11434",
  "details": "Ensure Ollama is running. Start it with: ollama serve"
}
```

#### `POST /api/llm/chat`

Proxy a chat completion request to the configured LLM.

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful voice cloning assistant." },
    { "role": "user", "content": "How do I prepare an audio sample for cloning?" }
  ],
  "profileId": "profile_abc123"
}
```

**Response `200`:**
```json
{
  "response": {
    "role": "assistant",
    "content": "To prepare an audio sample for cloning, follow these steps..."
  },
  "usage": {
    "promptTokens": 42,
    "completionTokens": 156,
    "totalTokens": 198
  },
  "latencyMs": 2340
}
```

### 4.3 TTS API

#### `POST /api/tts/test-connection`

Test connectivity to the TTS backend.

**Request:**
```json
{
  "serverUrl": "http://localhost:5002"
}
```

**Response `200`:**
```json
{
  "status": "ok",
  "serverUrl": "http://localhost:5002",
  "latencyMs": 85,
  "availableModels": ["xtts_v2", "bark"],
  "message": "TTS server is reachable"
}
```

**Response `502`:**
```json
{
  "status": "error",
  "serverUrl": "http://localhost:5002",
  "message": "TTS server is not reachable",
  "details": "Ensure the Coqui TTS Docker container is running."
}
```

#### `POST /api/tts/speak`

Generate speech from text.

**Request:**
```json
{
  "text": "Hello, this is a test of the voice cloning system.",
  "speakerId": "voice_abc123",
  "language": "en"
}
```

**Response `200`:**
```
Content-Type: audio/wav
Body: <binary audio data>
```

**Response `202` (CPU-mode, queued):**
```json
{
  "status": "queued",
  "jobId": "job_xyz789",
  "estimatedWaitSeconds": 30,
  "message": "TTS generation queued. CPU-only mode may take longer."
}
```

#### `GET /api/tts/voices`

List all registered cloned voices.

**Response `200`:**
```json
{
  "voices": [
    {
      "speakerId": "voice_abc123",
      "name": "My Voice",
      "language": "en",
      "createdAt": "2025-01-20T14:30:00Z"
    }
  ]
}
```

#### `POST /api/tts/clone`

Register a new cloned voice from an audio sample.

**Request:**
```
Content-Type: multipart/form-data
Fields:
  - audio: <audio file, WAV/MP3, 10-30 seconds>
  - name: "My Voice"
  - language: "en"
```

**Response `201`:**
```json
{
  "speakerId": "voice_abc123",
  "name": "My Voice",
  "language": "en",
  "status": "registered",
  "message": "Voice registered successfully. You can now use it for TTS."
}
```

### 4.4 Practice API

#### `POST /api/practice/start`

Start a new practice session.

**Request:**
```json
{
  "templateId": "template_voice_cloning_101"
}
```

**Response `201`:**
```json
{
  "session": {
    "id": "session_abc123",
    "templateId": "template_voice_cloning_101",
    "startedAt": "2025-01-25T10:00:00Z",
    "completedAt": null,
    "scores": {},
    "notes": "",
    "currentPhase": 0
  }
}
```

#### `POST /api/practice/finish`

Complete a practice session with scores and notes.

**Request:**
```json
{
  "sessionId": "session_abc123",
  "scores": {
    "Audio Quality": 4,
    "Model Selection": 3,
    "Configuration": 5
  },
  "notes": "Good practice session. Need to work on model selection."
}
```

**Response `200`:**
```json
{
  "session": {
    "id": "session_abc123",
    "templateId": "template_voice_cloning_101",
    "startedAt": "2025-01-25T10:00:00Z",
    "completedAt": "2025-01-25T10:45:00Z",
    "scores": {
      "Audio Quality": 4,
      "Model Selection": 3,
      "Configuration": 5
    },
    "notes": "Good practice session. Need to work on model selection.",
    "currentPhase": null
  }
}
```

#### `GET /api/practice/sessions`

List all past practice sessions.

**Response `200`:**
```json
{
  "sessions": [
    {
      "id": "session_abc123",
      "templateId": "template_voice_cloning_101",
      "startedAt": "2025-01-25T10:00:00Z",
      "completedAt": "2025-01-25T10:45:00Z",
      "scores": { "Audio Quality": 4, "Model Selection": 3, "Configuration": 5 },
      "notes": "...",
      "currentPhase": null
    }
  ]
}
```

### 4.5 Settings API

#### `GET /api/settings`

Retrieve current app settings.

**Response `200`:**
```json
{
  "activeLLMProfileId": "profile_local_ollama",
  "activeTTSProfileId": null,
  "llmProfiles": [
    {
      "id": "profile_local_ollama",
      "name": "Local Ollama",
      "provider": "ollama",
      "baseUrl": "http://localhost:11434",
      "model": "llama3.2",
      "maxTokens": 2048,
      "temperature": 0.7,
      "isDefault": true
    }
  ],
  "ttsProfiles": [],
  "ui": { "theme": "system", "sidebarCollapsed": false }
}
```

> **Note:** API keys are never returned in GET responses. They are write-only fields.
>
> **UI preferences clarification:** The `ui` sub-object (`theme`, `sidebarCollapsed`) is stored **both** in the server-side JSON file (as part of `AppSettings`) and mirrored to browser `localStorage` for instant client-side reads. The canonical source is the server file; `GET /api/settings` returns it. On page load, the client reads `localStorage` first for a flash-free experience, then reconciles with the server response. Writes go to both `PUT /api/settings` and `localStorage` simultaneously.

#### `PUT /api/settings`

Update app settings (partial updates supported).

**Request:**
```json
{
  "activeLLMProfileId": "profile_local_ollama",
  "llmProfiles": [ { "..." : "..." } ],
  "ui": { "theme": "dark" }
}
```

**Response `200`:**
```json
{ "status": "ok", "message": "Settings updated" }
```

### 4.6 Test API

#### `POST /api/tests/run`

Trigger a test suite and return a run ID for status polling.

**Request:**
```json
{
  "suiteId": "smoke"
}
```

**Response `202`:**
```json
{
  "runId": "run_abc123",
  "suiteId": "smoke",
  "status": "running",
  "startedAt": "2025-01-25T11:00:00Z"
}
```

**Security / validation requirements:**

- This endpoint may start OS-level test runner processes (e.g., `npx playwright test ...`) on the server. It **must only be reachable from localhost or a strictly trusted internal network** and **must never be exposed to the public internet**.
- The server **must validate** the `suiteId` field against a fixed allowlist of registered test suite IDs (e.g., `["smoke", "api", "llm-integration", "tts-integration", "practice-flow"]`). Requests with any other `suiteId` must be rejected with `400 Bad Request`.
- Implementations must **not** interpolate raw `suiteId` (or any other user-controlled input) directly into shell command strings. Instead, map each allowed `suiteId` to a pre-defined command configuration on the server.
- Access to this endpoint should be restricted to trusted users (e.g., via admin-only auth or "local-only" use) and protected with basic **rate limiting** to prevent abuse.

#### `GET /api/tests/status?runId=run_abc123`

Poll the status of a running test suite.

**Response `200` (running):**
```json
{
  "runId": "run_abc123",
  "suiteId": "smoke",
  "status": "running",
  "startedAt": "2025-01-25T11:00:00Z",
  "completedAt": null,
  "passed": 3,
  "failed": 0,
  "skipped": 0,
  "durationMs": null,
  "logs": "Running test 4 of 6..."
}
```

**Response `200` (completed):**
```json
{
  "runId": "run_abc123",
  "suiteId": "smoke",
  "status": "completed",
  "startedAt": "2025-01-25T11:00:00Z",
  "completedAt": "2025-01-25T11:00:12Z",
  "passed": 5,
  "failed": 1,
  "skipped": 0,
  "durationMs": 12400,
  "logs": "...<truncated test output>..."
}
```

**Log handling strategy:**

- The `logs` field returns only the **last 10 KB** of log output. If the full log exceeds this limit, it is truncated from the beginning and prefixed with `[...truncated]\n`.
- Clients that need the full log should request it separately via `GET /api/tests/status?runId=<id>&fullLogs=true` (returns the complete log as `text/plain`).
- During polling (status `"running"`), logs contain only the latest progress line (e.g., `"Running test 4 of 6..."`), not the full accumulated output. The complete log is available only after the run finishes.

### Available Test Suites (Static Registry)

| Suite ID | Name | Command | Est. Duration | Requires External |
|---|---|---|---|---|
| `smoke` | Smoke UI Tests | `npx playwright test e2e/smoke.spec.ts` | ~10s | No |
| `api` | API Tests | `npx vitest run __tests__/integration/api/` | ~5s | No |
| `llm-integration` | LLM Integration Tests | `npx playwright test e2e/llm-integration.spec.ts` | ~30s | Yes (LLM) |
| `tts-integration` | TTS Integration Tests | `npx playwright test e2e/tts-integration.spec.ts` | ~1min | Yes (TTS) |
| `practice-flow` | Practice Flow E2E | `npx playwright test e2e/practice-flow.spec.ts` | ~30s | No |

---

## 5. LLM Client Abstraction

All LLM backends are accessed through a single abstraction. This ensures the Settings UI, test-connection endpoints, and chat proxy work identically regardless of provider.

### Interface

```typescript
interface LLMClient {
  /**
   * Test connectivity to the LLM backend.
   * Always resolves with an LLMConnectionResult (status "ok" or "error");
   * never throws for expected connection failures.
   */
  testConnection(): Promise<LLMConnectionResult>;

  /**
   * Send a chat completion request.
   * Follows the OpenAI chat completions format.
   */
  chat(request: LLMChatRequest): Promise<LLMChatResponse>;
}

interface LLMConnectionResult {
  status: "ok" | "error";
  latencyMs: number;
  model: string;
  message: string;
}

interface LLMChatRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

interface LLMChatResponse {
  response: { role: "assistant"; content: string };
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
}
```

### Provider Implementations

```typescript
// Factory function creates the correct client based on profile
function createLLMClient(profile: LLMProviderProfile): LLMClient {
  switch (profile.provider) {
    case "ollama":
      return new OllamaClient(profile);
    case "llama-cpp":
      return new LlamaCppClient(profile);
    case "openai":
    case "azure":
      return new OpenAICompatibleClient(profile);
    case "custom":
      return new OpenAICompatibleClient(profile); // Custom endpoints use OpenAI format
  }
}
```

**OllamaClient** — Talks to `http://localhost:11434/api/chat` (Ollama native format) or `/v1/chat/completions` (OpenAI compatibility mode).

**LlamaCppClient** — Talks to `http://localhost:8080/v1/chat/completions` (llama-server's OpenAI-compatible endpoint).

**OpenAICompatibleClient** — Generic client for any endpoint that speaks the OpenAI chat completions API (`/v1/chat/completions`). Works for OpenAI, Azure, and custom endpoints.

### Error Handling

All clients follow a consistent error contract:

- **`testConnection()`** returns `{ status: "error", ... }` for expected failures (server unreachable, auth failed). It never throws.
- **`chat()`** throws `LLMConnectionError` for transport/network failures. Application-level errors (e.g., content filter triggered) are returned in the response with an error field.

```typescript
class LLMConnectionError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
  }
}
```

---

## 6. TTS Proxy Interface

The TTS subsystem is **entirely optional**. When disabled, all TTS-related UI shows a clear "TTS not configured" state. When enabled, it proxies requests to a running Coqui TTS Docker container.

### Interface

```typescript
interface TTSClient {
  /**
   * Test connectivity to the TTS server.
   */
  testConnection(): Promise<TTSConnectionResult>;

  /**
   * Generate speech from text.
   * Returns audio data (WAV) or a queued job reference.
   */
  speak(request: TTSSpeakRequest): Promise<TTSSpeakResponse>;

  /**
   * List available/registered voices.
   */
  listVoices(): Promise<TTSVoice[]>;

  /**
   * Register a new cloned voice from an audio sample.
   */
  cloneVoice(request: TTSCloneRequest): Promise<TTSCloneResponse>;
}

interface TTSConnectionResult {
  status: "ok" | "error";
  latencyMs: number;
  availableModels: string[];
  message: string;
}

interface TTSSpeakRequest {
  text: string;
  speakerId?: string;
  language: string;
}

interface TTSSpeakResponse {
  /** If audio is ready immediately */
  audio?: ArrayBuffer;
  contentType?: string;
  /** If job is queued (CPU-mode) */
  jobId?: string;
  estimatedWaitSeconds?: number;
  status: "ready" | "queued";
}

interface TTSCloneRequest {
  audioData: ArrayBuffer;
  name: string;
  language: string;
}

interface TTSCloneResponse {
  speakerId: string;
  name: string;
  status: "registered";
}
```

### Coqui TTS Docker Integration

```
# CPU-only Docker setup (default, no GPU required):
docker run -d -p 5002:5002 \
  --name awaaz-tts \
  --cpus="2" --memory="4g" \
  ghcr.io/coqui-ai/tts \
  --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
  --use_cuda false

# GPU-accelerated setup (optional, for users with NVIDIA GPU):
# docker run -d -p 5002:5002 --gpus all \
#   --name awaaz-tts \
#   ghcr.io/coqui-ai/tts \
#   --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
#   --use_cuda true

# The TTS proxy maps to these Coqui endpoints:
# POST /api/tts          → Coqui POST /api/tts (text-to-speech)
# GET  /api/voices       → Coqui GET  /api/speakers
# POST /api/clone        → Coqui POST /api/tts (with reference audio)
```

### Graceful Degradation

When TTS is enabled but the server is unreachable:
1. UI shows a warning banner: "TTS server is not reachable. Check Settings."
2. All TTS actions are disabled with tooltips explaining the issue.
3. Non-TTS features remain fully functional.

When running on CPU:
1. TTS jobs are queued with estimated wait times shown in the UI.
2. A progress indicator shows "Generating audio... This may take longer on CPU-only."
3. Users can cancel long-running jobs.

---

## 7. State Persistence Strategy

### Decision: localStorage (client) + JSON file store (server)

**Rationale:** Zero external database dependency. Works offline. Portable. Can be upgraded to SQLite or a cloud DB later without changing the API contracts.

### What is stored where

| Data | Storage Location | Reason |
|---|---|---|
| UI preferences (theme, sidebar) | Browser localStorage | Instant access, per-device |
| LLM/TTS profiles (no secrets) | Browser localStorage + server JSON | Accessible to both UI and API |
| API keys / tokens | Server-side JSON file only | **Never** sent to client; write-only from Settings UI |
| Practice sessions | Server-side JSON file | Persist across browser sessions; accessible to API |
| Test run results | Server-side JSON file (ephemeral) | May be cleared; mainly for UI display |
| Content index | Built at startup from MDX files | Cached in memory; rebuilt on content change |

### Server-Side JSON Store

```
apps/portal/
  .data/                    # gitignored
    settings.json           # AppSettings (minus UI prefs)
    sessions.json           # PracticeSession[]
    test-runs.json          # TestRun[] (recent only)
```

The JSON store is accessed through a thin `DataStore` abstraction:

```typescript
interface DataStore {
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: Partial<AppSettings>): Promise<void>;
  getSessions(): Promise<PracticeSession[]>;
  saveSession(session: PracticeSession): Promise<void>;
  getTestRuns(): Promise<TestRun[]>;
  saveTestRun(run: TestRun): Promise<void>;
}
```

### Migration Path

When the app outgrows JSON files:
1. Implement a `SQLiteDataStore` that implements the same `DataStore` interface.
2. Swap it in `apps/portal/lib/data-store.ts`.
3. No API or UI changes needed.

---

## 8. Content Strategy

### Content Organization

AwaazTwin content lives in MDX files within the portal app:

```
apps/portal/content/
  voice-cloning/
    getting-started.mdx
    preparing-audio-samples.mdx
    best-practices.mdx
  tts/
    coqui-setup.mdx
    text-preprocessing.mdx
    multilingual-tts.mdx
  models/
    xtts-v2.mdx
    bark.mdx
    model-comparison.mdx
  guides/
    cpu-optimization.mdx
    docker-setup.mdx
    troubleshooting.mdx
  reference/
    api-reference.mdx
    configuration.mdx
    faq.mdx
```

### MDX Frontmatter

Each MDX file includes YAML frontmatter that maps to the `Topic` interface:

```mdx
---
title: "Getting Started with Voice Cloning"
section: "voice-cloning"
summary: "Learn the basics of AI voice cloning with AwaazTwin"
difficulty: "beginner"
tags: ["voice-cloning", "setup", "quickstart"]
relatedTopics: ["tts/coqui-setup", "models/xtts-v2"]
updatedAt: "2025-01-15T10:00:00Z"
---

# Getting Started with Voice Cloning

Welcome to AwaazTwin! This guide will walk you through...
```

### Content Loading

At build time (or dev server start), a content indexer:
1. Scans `apps/portal/content/` recursively for `.mdx` files.
2. Extracts frontmatter metadata into a `Topic[]` index.
3. Caches the index in memory for the `/api/content` endpoint.
4. Individual topic content is rendered on-demand via `@next/mdx`.

---

## 9. Testing Strategy

### Test Pyramid

```
         ┌───────────┐
         │   E2E     │  Playwright (5-10 tests)
         │ (Browser) │  Full user flows
         ├───────────┤
         │Integration│  Vitest + RTL (20-30 tests)
         │(Component)│  Component interactions, API handlers
         ├───────────┤
         │   Unit    │  Vitest (50+ tests)
         │(Function) │  Pure functions, utilities, domain logic
         └───────────┘
```

### Test Location & Organization

```
apps/portal/
  __tests__/
    unit/
      lib/
        llm-client.test.ts        # LLM client abstraction
        tts-client.test.ts        # TTS client abstraction
        data-store.test.ts        # JSON data store
        content-loader.test.ts    # MDX content indexer
      components/
        navigation.test.tsx       # Nav component logic
        settings-form.test.tsx    # Form validation
        topic-page.test.tsx       # Topic rendering
    integration/
      api/
        content-api.test.ts       # /api/content/* handlers
        llm-api.test.ts           # /api/llm/* handlers
        tts-api.test.ts           # /api/tts/* handlers
        practice-api.test.ts      # /api/practice/* handlers
        settings-api.test.ts      # /api/settings handler
        tests-api.test.ts         # /api/tests/* handlers
      components/
        settings-page.test.tsx    # Settings page + API integration
        test-console.test.tsx     # Test console + API integration
  e2e/
    smoke.spec.ts                 # Basic navigation, page loads
    settings-flow.spec.ts         # Configure LLM/TTS, test connection
    practice-flow.spec.ts         # Full practice session E2E
    test-console.spec.ts          # Trigger tests from UI, verify results
    llm-integration.spec.ts       # LLM chat flow (requires running LLM)
    tts-integration.spec.ts       # TTS speak/clone flow (requires running TTS)
```

### Test Tooling Configuration

| Tool | Config File | Scope |
|---|---|---|
| **Vitest** | `apps/portal/vitest.config.ts` | Unit + integration tests |
| **React Testing Library** | Imported in integration test files | Component rendering |
| **Playwright** | `apps/portal/playwright.config.ts` | E2E tests |

### Testing Commands

```bash
# Unit + integration tests
cd apps/portal && npx vitest run

# Unit + integration tests (watch mode)
cd apps/portal && npx vitest

# E2E tests (requires dev server or builds first)
cd apps/portal && npx playwright test

# Specific E2E suite
cd apps/portal && npx playwright test e2e/smoke.spec.ts
```

### How UI "Run Tests" Maps to Commands

The Test Console page offers buttons per test suite. Each maps to a specific command:

| UI Button | API Call | Backend Command |
|---|---|---|
| "Run Smoke Tests" | `POST /api/tests/run { suiteId: "smoke" }` | `npx playwright test e2e/smoke.spec.ts` |
| "Run API Tests" | `POST /api/tests/run { suiteId: "api" }` | `npx vitest run __tests__/integration/api/` |
| "Run LLM Tests" | `POST /api/tests/run { suiteId: "llm-integration" }` | `npx playwright test e2e/llm-integration.spec.ts` |
| "Run TTS Tests" | `POST /api/tests/run { suiteId: "tts-integration" }` | `npx playwright test e2e/tts-integration.spec.ts` |
| "Run Practice Tests" | `POST /api/tests/run { suiteId: "practice-flow" }` | `npx playwright test e2e/practice-flow.spec.ts` |

The `/api/tests/run` handler:
1. Spawns the command as a child process.
2. Captures stdout/stderr.
3. Returns a `runId` immediately (status: "running").
4. The client polls `/api/tests/status?runId=<id>` for progress.
5. On completion, parses output for pass/fail counts and stores the `TestRun`.

### Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| LLM backend | Vitest mock of `LLMClient`; returns canned responses |
| TTS backend | Vitest mock of `TTSClient`; returns fake audio buffers |
| File system (data store) | Vitest mock or in-memory `DataStore` implementation |
| MDX content | Test fixtures: minimal `.mdx` files in `__tests__/fixtures/` |
| External HTTP | `msw` (Mock Service Worker) for integration tests needing HTTP mocking |

### CI Integration

GitHub Actions workflow (to be created in Phase 3):

The monorepo uses **npm workspaces** with a root `package.json` that references `apps/portal`. CI commands use `npm -w apps/portal` to target the portal workspace.

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci                   # installs all workspaces
      - run: npm -w apps/portal run test  # vitest unit + integration
      - run: npx -w apps/portal playwright install --with-deps
      - run: npm -w apps/portal run test:e2e  # playwright smoke tests
```
