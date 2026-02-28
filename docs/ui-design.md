# AwaazTwin – UI Design Document

> **Phase 2 deliverable** — Detailed UI surface designs, component structure, API interaction patterns, and testing approach for every screen in the portal.
> No implementation yet; this document guides Phase 3 (Portal MVP) development.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Application Shell & Navigation](#2-application-shell--navigation)
3. [Topic Page Layout](#3-topic-page-layout)
4. [Settings / Connections Page](#4-settings--connections-page)
5. [Test Console / Diagnostics Page](#5-test-console--diagnostics-page)
6. [Practice / Interview Mode Page](#6-practice--interview-mode-page)
7. [Shared Components](#7-shared-components)
8. [Routing & URL Structure](#8-routing--url-structure)
9. [State Management](#9-state-management)
10. [Responsive & Accessibility](#10-responsive--accessibility)
11. [Testing Approach](#11-testing-approach)

---

## 1. Design Principles

| Principle | Guideline |
|---|---|
| **Browser-first** | Every feature is reachable from the UI. No CLI-only functionality. |
| **Progressive disclosure** | Show essentials first; advanced options behind expandable sections or tabs. |
| **CPU-aware feedback** | Any operation that may be slow on CPU (TTS, LLM) shows estimated time and progress. |
| **Graceful degradation** | TTS/LLM sections degrade to clear "not configured" states; never blank/broken. |
| **Consistent patterns** | All forms use the same validation style, all status indicators use the same color scheme. |
| **Accessible** | WCAG 2.1 AA: keyboard navigable, screen-reader labels, sufficient contrast. |

### Color & Status Scheme

| State | Color | Icon | Usage |
|---|---|---|---|
| Success / Connected | Green (`text-green-600`) | ✓ checkmark | Test connection passed, test suite passed |
| Warning / Slow | Amber (`text-amber-500`) | ⚠ triangle | High latency, CPU-mode notice |
| Error / Failed | Red (`text-red-600`) | ✕ cross | Connection failed, test failed |
| Info / Neutral | Blue (`text-blue-500`) | ℹ circle | Informational banners, hints |
| Disabled / Not configured | Gray (`text-gray-400`) | — dash | Feature not enabled, no profile |

---

## 2. Application Shell & Navigation

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────┐                              🔔  ⚙️  🎨        │
│  │ AwaazTwin│   Home │ Topics │ Practice │ Settings │ Tests  │
│  └─────────┘                   (breadcrumb trail below)      │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  SECTIONS    │                                               │
│              │                                               │
│  📘 Voice    │          Main Content Area                    │
│     Cloning  │                                               │
│  🔊 TTS      │          (TopicPage / Settings /              │
│  🤖 Models   │           TestConsole / Practice)             │
│  📖 Guides   │                                               │
│  📋 Reference│                                               │
│              │                                               │
│  ─────────── │                                               │
│  ⚙️ Settings │                                               │
│  🧪 Tests    │                                               │
│  🎯 Practice │                                               │
│              │                                               │
├──────────────┴───────────────────────────────────────────────┤
│  AwaazTwin v0.1  │  CPU Mode  │  LLM: Not configured        │
└──────────────────────────────────────────────────────────────┘
```

### Component: `AppShell`

**File:** `apps/portal/app/layout.tsx`

```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Responsibilities:**
- Renders the top header bar with logo, breadcrumbs, and quick-action icons
- Renders the collapsible sidebar with section navigation
- Renders the status footer with runtime info
- Provides `AppStateProvider` context to all children

**Sub-components:**

#### `Header`

| Element | Description |
|---|---|
| Logo + title | "AwaazTwin" — links to home `/` |
| Breadcrumb trail | Dynamic: e.g. "Voice Cloning > Getting Started" |
| Theme toggle | Light / Dark / System |
| Settings shortcut | ⚙️ icon → `/settings` |

#### `Sidebar`

| Element | Description |
|---|---|
| Content sections | Grouped navigation items mapping to content sections |
| Utility links | Settings, Test Console, Practice |
| Collapse toggle | Hamburger icon to collapse sidebar to icons-only |
| Progress badges | Per-section: small chip showing "3/12" topics viewed |

```typescript
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  sections: SidebarSection[];
  activePath: string;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  /** Number of topics in this section */
  totalTopics: number;
  /** Number of topics the user has viewed */
  viewedTopics: number;
}
```

**Sections mapped to routes:**

| Section | Route | Icon |
|---|---|---|
| Voice Cloning | `/topics/voice-cloning` | 📘 |
| TTS | `/topics/tts` | 🔊 |
| Models | `/topics/models` | 🤖 |
| Guides | `/topics/guides` | 📖 |
| Reference | `/topics/reference` | 📋 |
| Settings | `/settings` | ⚙️ |
| Test Console | `/tests` | 🧪 |
| Practice | `/practice` | 🎯 |

#### `StatusBar` (Footer)

```typescript
interface StatusBarProps {
  version: string;
  llmStatus: "connected" | "disconnected" | "not-configured";
  ttsStatus: "connected" | "disconnected" | "not-configured" | "disabled";
  llmProfileName: string | null;
}
```

Displays at-a-glance: app version, LLM connection status, TTS status. Clicking LLM/TTS status opens Settings.

### API Interaction

- `GET /api/content` on initial load → populates sidebar section counts
- `GET /api/settings` on initial load → populates LLM/TTS status in footer
- Sidebar section progress tracked via localStorage (`viewedTopics` per section)

---

## 3. Topic Page Layout

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar  │                                    │ Side Panel  │
│           │  ┌─────────────────────────────┐   │             │
│           │  │ Getting Started with         │   │ KEY IDEAS   │
│           │  │ Voice Cloning               │   │ • Concept A │
│           │  │                             │   │ • Concept B │
│           │  │ ═══════════════════════     │   │             │
│           │  │                             │   │ PITFALLS    │
│           │  │ [MDX content rendered here] │   │ ⚠ Don't ... │
│           │  │                             │   │ ⚠ Avoid ... │
│           │  │ ## Prerequisites            │   │             │
│           │  │ ...                         │   │ RELATED     │
│           │  │                             │   │ → TTS Setup │
│           │  │ ## Step 1: Record Audio     │   │ → XTTS v2   │
│           │  │ ...                         │   │             │
│           │  │                             │   │ ┌─────────┐ │
│           │  │ ## Step 2: Configure        │   │ │ Start   │ │
│           │  │ ...                         │   │ │Practice │ │
│           │  │                             │   │ └─────────┘ │
│           │  └─────────────────────────────┘   │             │
└───────────┴────────────────────────────────────┴─────────────┘
```

### Component: `TopicPage`

**File:** `apps/portal/app/topics/[...slug]/page.tsx`

```typescript
interface TopicPageProps {
  params: { slug: string[] };
}

interface TopicPageData {
  topic: Topic;
  content: string; // Rendered HTML from MDX
}
```

**Responsibilities:**
- Fetches topic metadata and rendered MDX content from `/api/content/[...slug]`
- Renders MDX content in the main area with proper styling (headings, code blocks, images, tables)
- Renders the side panel with extracted metadata
- Tracks topic as "viewed" in localStorage for progress indicators

**Sub-components:**

#### `TopicContent`

```typescript
interface TopicContentProps {
  /** Rendered HTML from MDX */
  htmlContent: string;
  /** Topic title for the page heading */
  title: string;
  /** Difficulty badge */
  difficulty?: "beginner" | "intermediate" | "advanced";
  /** Tags for display */
  tags?: string[];
}
```

Renders:
- Title with difficulty badge (color-coded: green/amber/red)
- Tags as small pills
- MDX HTML content with Tailwind Typography (`prose`) styling
- Auto-generated table of contents from headings (optional, collapsible)

#### `TopicSidePanel`

```typescript
interface TopicSidePanelProps {
  /** Key concepts extracted from frontmatter or content */
  keyIdeas: string[];
  /** Common pitfalls */
  pitfalls: string[];
  /** Related topic slugs with titles */
  relatedTopics: Array<{ slug: string; title: string }>;
  /** Whether a practice template exists for this topic */
  hasPractice: boolean;
  /** Slug for starting practice */
  practiceTemplateId?: string;
}
```

Sections:
1. **Key Ideas** — Bullet list of core concepts
2. **Common Pitfalls** — Warning-styled list of mistakes to avoid
3. **Related Topics** — Clickable links to related topic pages
4. **Start Practice** — Button that navigates to `/practice/session?template=<id>` (shown only if `hasPractice` is true)

### Section Listing Page

**File:** `apps/portal/app/topics/[section]/page.tsx`

When navigating to a section (e.g., `/topics/voice-cloning`), shows a listing of all topics in that section.

```typescript
interface SectionListingProps {
  params: { section: string };
}
```

Renders:
- Section title and description
- Grid/list of topic cards, each showing: title, summary, difficulty badge, tags
- Filter/sort options: by difficulty, by tag, alphabetical

#### `TopicCard`

```typescript
interface TopicCardProps {
  topic: Topic;
  /** Whether the user has viewed this topic */
  isViewed: boolean;
}
```

Card displays: title, summary (truncated), difficulty badge, "Viewed" checkmark if already read.

### API Interaction

- **Section listing:** `GET /api/content?section=voice-cloning` → filtered topic list
- **Topic page:** `GET /api/content/voice-cloning/getting-started` → full topic with content
- **Progress tracking:** localStorage key `awaaz:viewedTopics` (array of slugs)

---

## 4. Settings / Connections Page

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar  │  Settings                                        │
│           │                                                  │
│           │  ┌─── LLM Configuration ──────────────────────┐  │
│           │  │                                            │  │
│           │  │  Provider:    [Local (Ollama) ▾]           │  │
│           │  │  Base URL:    [http://localhost:11434    ]  │  │
│           │  │  Model:       [llama3.2                 ]  │  │
│           │  │  API Key:     [••••••••      ] (optional)  │  │
│           │  │                                            │  │
│           │  │  ▸ Advanced Options                        │  │
│           │  │    Max Tokens: [2048    ]                   │  │
│           │  │    Temperature: [0.7  ] ────●──────         │  │
│           │  │                                            │  │
│           │  │  [Test Connection]     ✓ Connected (142ms)  │  │
│           │  │  [Save Profile]                             │  │
│           │  │                                            │  │
│           │  └────────────────────────────────────────────┘  │
│           │                                                  │
│           │  ┌─── TTS Configuration ──────────────────────┐  │
│           │  │                                            │  │
│           │  │  Enable TTS:  [■ On]                       │  │
│           │  │  Server URL:  [http://localhost:5002     ]  │  │
│           │  │                                            │  │
│           │  │  [Test Connection]     ✕ Not reachable      │  │
│           │  │                                            │  │
│           │  │  ── Registered Voices ──                    │  │
│           │  │  (No voices registered yet)                 │  │
│           │  │                                            │  │
│           │  │  ── Upload Voice Sample ──                  │  │
│           │  │  [Choose file...]  Voice name: [         ]  │  │
│           │  │  Language: [English ▾]  [Register Voice]    │  │
│           │  │                                            │  │
│           │  │  ── Quick Test ──                           │  │
│           │  │  Text: [Hello, this is a test.           ]  │  │
│           │  │  Voice: [Default ▾]  [▶ Generate Audio]     │  │
│           │  │  🔊 [audio player]                          │  │
│           │  │                                            │  │
│           │  │  [Save Profile]                             │  │
│           │  └────────────────────────────────────────────┘  │
│           │                                                  │
│           │  ┌─── UI Preferences ─────────────────────────┐  │
│           │  │  Theme: (○ Light  ● Dark  ○ System)        │  │
│           │  └────────────────────────────────────────────┘  │
└───────────┴──────────────────────────────────────────────────┘
```

### Component: `SettingsPage`

**File:** `apps/portal/app/settings/page.tsx`

```typescript
// No props — this is a route page component.
// Fetches settings from API on mount.
```

**Responsibilities:**
- Loads current settings from `GET /api/settings`
- Provides tabbed or stacked sections for LLM, TTS, and UI preferences
- Handles form validation and save operations
- Manages test-connection flows with loading and result states

**Sub-components:**

#### `LLMSettingsForm`

```typescript
interface LLMSettingsFormProps {
  /** Initial profile data (null for new profile) */
  profile: LLMProviderProfile | null;
  /** Callback when profile is saved */
  onSave: (profile: LLMProviderProfile) => void;
}

interface LLMSettingsFormState {
  provider: "ollama" | "llama-cpp" | "openai" | "azure" | "custom";
  baseUrl: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  /** Whether advanced options section is expanded */
  showAdvanced: boolean;
  /** Test connection state */
  connectionTest: {
    status: "idle" | "testing" | "success" | "error";
    latencyMs?: number;
    message?: string;
  };
  /** Form validation errors */
  errors: Record<string, string>;
}
```

**Validation rules:**
- `baseUrl`: Required, must be a valid URL
- `model`: Required, non-empty string
- `apiKey`: Required for `openai` and `azure` providers; optional for local
- `maxTokens`: Integer, 1–32768
- `temperature`: Number, 0.0–2.0

**Behavior:**
- Provider dropdown changes which fields are required/visible
- "Test Connection" button calls `POST /api/llm/test-connection` with current form values
- Shows spinner during test, then success (green check + latency) or error (red X + message)
- "Save Profile" calls `PUT /api/settings` with the profile data

#### `TTSSettingsForm`

```typescript
interface TTSSettingsFormProps {
  profile: TTSProfile | null;
  onSave: (profile: TTSProfile) => void;
}

interface TTSSettingsFormState {
  enabled: boolean;
  serverUrl: string;
  connectionTest: {
    status: "idle" | "testing" | "success" | "error";
    latencyMs?: number;
    message?: string;
    availableModels?: string[];
  };
  /** Voice registration form */
  voiceUpload: {
    file: File | null;
    name: string;
    language: string;
    status: "idle" | "uploading" | "success" | "error";
    message?: string;
  };
  /** Quick TTS test */
  ttsTest: {
    text: string;
    speakerId: string;
    status: "idle" | "generating" | "ready" | "error";
    audioUrl?: string;
  };
  errors: Record<string, string>;
}
```

**Behavior:**
- Enable/disable toggle grays out the entire section when off
- "Test Connection" calls `POST /api/tts/test-connection`
- Voice list shown from `GET /api/tts/voices` (refreshed after registration)
- "Register Voice" uploads audio via `POST /api/tts/clone` with multipart form data
- "Generate Audio" calls `POST /api/tts/speak` and shows an `<audio>` player
- CPU-mode notice: "TTS generation may take 30-60s on CPU-only machines"

#### `UIPreferencesForm`

```typescript
interface UIPreferencesFormProps {
  preferences: AppSettings["ui"];
  onSave: (prefs: AppSettings["ui"]) => void;
}
```

Simple form with:
- Theme radio group (Light / Dark / System)
- Auto-saves on change (debounced)

### API Interaction

| User Action | API Call | Response Handling |
|---|---|---|
| Page load | `GET /api/settings` | Populate all forms |
| Test LLM Connection | `POST /api/llm/test-connection` | Show status + latency |
| Save LLM Profile | `PUT /api/settings` (llmProfiles) | Show save confirmation toast |
| Test TTS Connection | `POST /api/tts/test-connection` | Show status + available models |
| Register Voice | `POST /api/tts/clone` (multipart) | Add to voice list, show confirmation |
| Generate Test Audio | `POST /api/tts/speak` | Show `<audio>` player with result |
| List Voices | `GET /api/tts/voices` | Populate voice dropdown + list |
| Save TTS Profile | `PUT /api/settings` (ttsProfiles) | Show save confirmation toast |
| Change Theme | `PUT /api/settings` (ui) | Immediate UI update + save |

---

## 5. Test Console / Diagnostics Page

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar  │  Test Console                                    │
│           │                                                  │
│           │  Run automated test suites from the browser.      │
│           │  ℹ Tests run on the server; CPU-only may be       │
│           │    slower. Do not close this page during a run.   │
│           │                                                  │
│           │  ┌─── Available Test Suites ─────────────────┐   │
│           │  │                                           │   │
│           │  │  ┌─────────────────────────────────────┐  │   │
│           │  │  │ 🧪 Smoke UI Tests        ~10s      │  │   │
│           │  │  │ Basic navigation and page loading    │  │   │
│           │  │  │ [Run]                               │  │   │
│           │  │  └─────────────────────────────────────┘  │   │
│           │  │                                           │   │
│           │  │  ┌─────────────────────────────────────┐  │   │
│           │  │  │ 🔌 API Tests             ~5s       │  │   │
│           │  │  │ Route handler unit tests             │  │   │
│           │  │  │ [Run]                               │  │   │
│           │  │  └─────────────────────────────────────┘  │   │
│           │  │                                           │   │
│           │  │  ┌─────────────────────────────────────┐  │   │
│           │  │  │ 🤖 LLM Integration Tests   ~30s    │  │   │
│           │  │  │ ⚠ Requires running LLM backend      │  │   │
│           │  │  │ [Run]                               │  │   │
│           │  │  └─────────────────────────────────────┘  │   │
│           │  │                                           │   │
│           │  │  ┌─────────────────────────────────────┐  │   │
│           │  │  │ 🔊 TTS Integration Tests   ~1min   │  │   │
│           │  │  │ ⚠ Requires running TTS server       │  │   │
│           │  │  │ [Run]                               │  │   │
│           │  │  └─────────────────────────────────────┘  │   │
│           │  │                                           │   │
│           │  │  ┌─────────────────────────────────────┐  │   │
│           │  │  │ 🎯 Practice Flow E2E       ~30s    │  │   │
│           │  │  │ Full practice session flow           │  │   │
│           │  │  │ [Run]                               │  │   │
│           │  │  └─────────────────────────────────────┘  │   │
│           │  │                                           │   │
│           │  │  [Run All]                                │   │
│           │  └───────────────────────────────────────────┘   │
│           │                                                  │
│           │  ┌─── Results ───────────────────────────────┐   │
│           │  │                                           │   │
│           │  │  Run: smoke  │ ✓ Passed  │ 5/5  │ 10.2s  │   │
│           │  │  ──────────────────────────────────────── │   │
│           │  │  ✓ Home page loads                        │   │
│           │  │  ✓ Navigation works                       │   │
│           │  │  ✓ Topic page renders content             │   │
│           │  │  ✓ Settings page loads                    │   │
│           │  │  ✓ Test console page loads                │   │
│           │  │                                           │   │
│           │  │  ┌─ Logs ─────────────────────────────┐  │   │
│           │  │  │ Running 5 tests using 1 worker     │  │   │
│           │  │  │ [1/5] portal-smoke.spec.ts:10      │  │   │
│           │  │  │   ✓ home page loads (1.2s)         │  │   │
│           │  │  │ ...                                │  │   │
│           │  │  └────────────────────────────────────┘  │   │
│           │  └───────────────────────────────────────────┘   │
└───────────┴──────────────────────────────────────────────────┘
```

### Component: `TestConsolePage`

**File:** `apps/portal/app/tests/page.tsx`

```typescript
// No props — route page component.
```

**Responsibilities:**
- Displays list of available test suites (from static registry or API)
- Allows running individual suites or all at once
- Shows live status during run (polling)
- Displays results with pass/fail counts and logs

**Sub-components:**

#### `TestSuiteCard`

```typescript
interface TestSuiteCardProps {
  suite: TestSuiteDefinition;
  /** Current run status for this suite (if any) */
  run: TestRun | null;
  /** Whether another suite is currently running */
  isOtherRunning: boolean;
  onRun: (suiteId: string) => void;
}
```

Renders:
- Suite name, description, estimated duration
- Warning badge if `requiresExternalServices` is true
- "Run" button (disabled while another suite runs)
- Status indicator: idle / running (spinner) / passed (green) / failed (red)
- Pass/fail/skip counts when completed

#### `TestResultsPanel`

```typescript
interface TestResultsPanelProps {
  run: TestRun;
}
```

Renders:
- Summary bar: suite name, status, pass/fail counts, total duration
- Individual test results (parsed from logs if available)
- Collapsible log viewer with monospace text

#### `RunAllButton`

```typescript
interface RunAllButtonProps {
  suites: TestSuiteDefinition[];
  runs: Map<string, TestRun>;
  isRunning: boolean;
  onRunAll: () => void;
}
```

Triggers all suites sequentially. Shows overall progress: "Running suite 2 of 5..."

### API Interaction

| User Action | API Call | Response Handling |
|---|---|---|
| Page load | Static suite registry from `lib/test-suites.ts` | Populate suite cards |
| Run single suite | `POST /api/tests/run { suiteId }` | Start polling |
| Poll status | `GET /api/tests/status?runId=<id>` (every 2s) | Update status + counts |
| Run all | Sequential `POST /api/tests/run` for each suite | Queue and run one at a time |

**Polling behavior:**
1. After `POST /api/tests/run`, receive `{ runId, status: "running" }`
2. Poll `GET /api/tests/status?runId=<id>` every 2 seconds
3. Stop polling when `status` is `"completed"`, `"failed"`, or `"cancelled"`
4. Display final results from the last poll response

---

## 6. Practice / Interview Mode Page

### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar  │  Practice: Voice Cloning Setup                   │
│           │                                                  │
│           │  Template: Voice Cloning Configuration            │
│           │  Phase 2 of 4: Model Selection  ⏱ 8:42 remaining │
│           │                                                  │
│           │  ┌─── Phase Progress ────────────────────────┐   │
│           │  │ ✓ Setup (5min)                            │   │
│           │  │ ● Model Selection (10min)     ← current   │   │
│           │  │ ○ Execution (15min)                       │   │
│           │  │ ○ Review (5min)                           │   │
│           │  └───────────────────────────────────────────┘   │
│           │                                                  │
│           │  ┌─── Current Phase ─────────────────────────┐   │
│           │  │                                           │   │
│           │  │  Model Selection                          │   │
│           │  │                                           │   │
│           │  │  Choose the appropriate TTS model for     │   │
│           │  │  your use case. Consider:                 │   │
│           │  │  • Language requirements                  │   │
│           │  │  • Audio quality vs speed trade-offs      │   │
│           │  │  • CPU/GPU requirements                   │   │
│           │  │                                           │   │
│           │  │  ┌─ Notes ────────────────────────────┐   │   │
│           │  │  │ (editable text area for user's     │   │   │
│           │  │  │  notes during this phase)          │   │   │
│           │  │  └────────────────────────────────────┘   │   │
│           │  │                                           │   │
│           │  │  [← Previous Phase]       [Next Phase →]  │   │
│           │  └───────────────────────────────────────────┘   │
│           │                                                  │
│           │  (After all phases complete:)                     │
│           │                                                  │
│           │  ┌─── Self-Assessment ───────────────────────┐   │
│           │  │                                           │   │
│           │  │  Audio Quality          ●────────── 4/5   │   │
│           │  │  Model Selection        ──●──────── 2/5   │   │
│           │  │  Configuration          ──────●──── 4/5   │   │
│           │  │  Overall Execution      ────●────── 3/5   │   │
│           │  │                                           │   │
│           │  │  Notes: [                               ] │   │
│           │  │                                           │   │
│           │  │  [Complete & Save Session]                 │   │
│           │  └───────────────────────────────────────────┘   │
└───────────┴──────────────────────────────────────────────────┘
```

### Page Flow

```
Practice Landing (/practice)
  │
  ├── Browse available templates (grouped by section)
  │
  └── Start Session (/practice/session?template=<id>)
        │
        ├── Phase 1: Setup → countdown timer, notes area
        ├── Phase 2: ... → auto-advance or manual next
        ├── Phase N: Final phase
        │
        └── Self-Assessment (/practice/session?template=<id>&step=score)
              │
              └── Save → redirects to /practice/history
```

### Component: `PracticeLandingPage`

**File:** `apps/portal/app/practice/page.tsx`

```typescript
// Displays available practice templates grouped by section
```

**Sub-component: `PracticeTemplateCard`**

```typescript
interface PracticeTemplateCardProps {
  template: PracticeTemplate;
  /** Number of completed sessions for this template */
  completedSessions: number;
  /** Best score (average across rubric dimensions) */
  bestScore: number | null;
}
```

Renders: template title, section, phase count, estimated total duration, "Start" button, past performance summary.

### Component: `PracticeSessionPage`

**File:** `apps/portal/app/practice/session/page.tsx`

```typescript
interface PracticeSessionPageProps {
  searchParams: { template: string };
}

interface PracticeSessionState {
  session: PracticeSession;
  template: PracticeTemplate;
  /** Countdown timer for current phase (seconds remaining) */
  timeRemaining: number;
  /** Whether timer is paused */
  timerPaused: boolean;
  /** Per-phase notes */
  phaseNotes: Record<number, string>;
  /** Step: "phases" or "scoring" */
  step: "phases" | "scoring";
}
```

**Responsibilities:**
- Creates a new `PracticeSession` via `POST /api/practice/start`
- Manages phase timer with countdown
- Allows navigation between phases (previous/next)
- Auto-advances to next phase when timer expires (with notification)
- Transitions to scoring step after all phases complete

**Sub-components:**

#### `PhaseProgress`

```typescript
interface PhaseProgressProps {
  phases: PracticePhase[];
  currentPhase: number;
  completedPhases: number[];
}
```

Vertical stepper showing all phases with status (completed ✓, current ●, upcoming ○).

#### `PhaseTimer`

```typescript
interface PhaseTimerProps {
  durationSeconds: number;
  onExpire: () => void;
  isPaused: boolean;
  onPauseToggle: () => void;
}
```

Circular or linear countdown timer. Shows minutes:seconds remaining. Flashes amber at 20% time remaining. Optional pause button.

#### `PhaseContent`

```typescript
interface PhaseContentProps {
  phase: PracticePhase;
  notes: string;
  onNotesChange: (notes: string) => void;
}
```

Shows phase name, description, and a notes textarea for the user.

#### `ScoringPanel`

```typescript
interface ScoringPanelProps {
  rubric: RubricDimension[];
  scores: Record<string, number>;
  onScoreChange: (dimension: string, score: number) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onComplete: () => void;
}
```

Renders:
- One slider per rubric dimension (min to max score)
- Each slider has the dimension name, description, and current value
- Overall notes textarea
- "Complete & Save Session" button

### Component: `PracticeHistoryPage`

**File:** `apps/portal/app/practice/history/page.tsx`

```typescript
// Displays list of past practice sessions
```

Fetches from `GET /api/practice/sessions`. Shows table or card list:
- Template name, date, duration, average score, per-dimension scores
- Click to view details

### API Interaction

| User Action | API Call | Response Handling |
|---|---|---|
| Load templates | Static registry bundled in `lib/practice-templates.ts` | Populate template cards |
| Start session | `POST /api/practice/start { templateId }` | Create session, navigate to session page |
| Save session | `POST /api/practice/finish { sessionId, scores, notes }` | Persist, show confirmation, redirect |
| View history | `GET /api/practice/sessions` | Populate history list |

---

## 7. Shared Components

These components are reused across multiple pages.

### `ConnectionStatusBadge`

```typescript
interface ConnectionStatusBadgeProps {
  status: "idle" | "testing" | "success" | "error";
  latencyMs?: number;
  message?: string;
}
```

Small inline badge showing connection test results. Used in Settings and StatusBar.

### `LoadingSpinner`

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string; // Screen-reader label
}
```

### `Toast` / `Notification`

```typescript
interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number; // Auto-dismiss in ms
}
```

Used for save confirmations, error alerts, connection test results.

### `EmptyState`

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}
```

Shown when a list is empty (no voices, no practice sessions, no test results).

### `Badge`

```typescript
interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
}
```

Color-coded pill for difficulty levels, test status, connection status.

### `SliderInput`

```typescript
interface SliderInputProps {
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Display format, e.g. "3/5" or "0.7" */
  formatValue?: (value: number) => string;
}
```

Used for temperature, scoring rubric sliders.

### `CollapsibleSection`

```typescript
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
```

Used for "Advanced Options" in Settings, log viewer in Test Console.

---

## 8. Routing & URL Structure

### App Router File Structure

```
apps/portal/app/
├── layout.tsx                     # AppShell (sidebar + header + footer)
├── page.tsx                       # Home / dashboard
├── topics/
│   ├── [section]/
│   │   └── page.tsx               # Section listing (e.g., /topics/voice-cloning)
│   └── [...slug]/
│       └── page.tsx               # Topic page (e.g., /topics/voice-cloning/getting-started)
├── settings/
│   └── page.tsx                   # Settings / Connections
├── tests/
│   └── page.tsx                   # Test Console / Diagnostics
├── practice/
│   ├── page.tsx                   # Practice landing (template browser)
│   ├── session/
│   │   └── page.tsx               # Active practice session
│   └── history/
│       └── page.tsx               # Past session history
├── api/
│   ├── content/
│   │   ├── route.ts               # GET /api/content (list all)
│   │   └── [...slug]/
│   │       └── route.ts           # GET /api/content/[...slug]
│   ├── llm/
│   │   ├── test-connection/
│   │   │   └── route.ts           # POST /api/llm/test-connection
│   │   └── chat/
│   │       └── route.ts           # POST /api/llm/chat
│   ├── tts/
│   │   ├── test-connection/
│   │   │   └── route.ts           # POST /api/tts/test-connection
│   │   ├── speak/
│   │   │   └── route.ts           # POST /api/tts/speak
│   │   ├── voices/
│   │   │   └── route.ts           # GET /api/tts/voices
│   │   └── clone/
│   │       └── route.ts           # POST /api/tts/clone
│   ├── practice/
│   │   ├── start/
│   │   │   └── route.ts           # POST /api/practice/start
│   │   ├── finish/
│   │   │   └── route.ts           # POST /api/practice/finish
│   │   └── sessions/
│   │       └── route.ts           # GET /api/practice/sessions
│   ├── settings/
│   │   └── route.ts               # GET + PUT /api/settings
│   └── tests/
│       ├── run/
│       │   └── route.ts           # POST /api/tests/run
│       └── status/
│           └── route.ts           # GET /api/tests/status
└── globals.css                    # Tailwind base styles
```

### URL Examples

| URL | Page | Description |
|---|---|---|
| `/` | Home | Dashboard with section overview |
| `/topics/voice-cloning` | Section listing | All voice cloning topics |
| `/topics/voice-cloning/getting-started` | Topic page | Rendered MDX content |
| `/settings` | Settings | LLM/TTS/UI configuration |
| `/tests` | Test Console | Run and view test suites |
| `/practice` | Practice landing | Browse practice templates |
| `/practice/session?template=vc-101` | Practice session | Active timed session |
| `/practice/history` | Practice history | Past session records |

---

## 9. State Management

### Architecture

```
┌────────────────────────────────────────────┐
│           AppStateProvider (Context)        │
│                                            │
│  ┌──────────────┐  ┌───────────────────┐   │
│  │ Settings     │  │ UI State          │   │
│  │ (from API)   │  │ (local)           │   │
│  │              │  │                   │   │
│  │ llmProfiles  │  │ sidebarCollapsed  │   │
│  │ ttsProfiles  │  │ theme             │   │
│  │ activeIds    │  │ viewedTopics[]    │   │
│  └──────────────┘  └───────────────────┘   │
│                                            │
│  ┌──────────────┐  ┌───────────────────┐   │
│  │ Test State   │  │ Practice State    │   │
│  │ (ephemeral)  │  │ (session-scoped)  │   │
│  │              │  │                   │   │
│  │ activeRuns   │  │ currentSession    │   │
│  │ results[]    │  │ timerState        │   │
│  └──────────────┘  └───────────────────┘   │
└────────────────────────────────────────────┘
```

### Context Provider

```typescript
interface AppState {
  /** Settings loaded from API */
  settings: AppSettings | null;
  settingsLoading: boolean;

  /** Content index */
  topics: Topic[];
  topicsLoading: boolean;

  /** Sidebar state */
  sidebarCollapsed: boolean;

  /** Viewed topics tracking */
  viewedTopics: Set<string>;
}

interface AppActions {
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  loadTopics: () => Promise<void>;
  toggleSidebar: () => void;
  markTopicViewed: (slug: string) => void;
}
```

### Data Flow

1. **On app mount:** `AppStateProvider` calls `GET /api/settings` and `GET /api/content` to hydrate state
2. **Settings changes:** Forms call `updateSettings()` → `PUT /api/settings` → update context
3. **Topic progress:** `markTopicViewed()` → update localStorage + context
4. **Test runs:** Managed locally in `TestConsolePage` state (not global context)
5. **Practice sessions:** Managed locally in `PracticeSessionPage` state; saved via API on completion

### localStorage Keys

| Key | Type | Description |
|---|---|---|
| `awaaz:theme` | `"light" \| "dark" \| "system"` | UI theme preference |
| `awaaz:sidebarCollapsed` | `boolean` | Sidebar collapse state |
| `awaaz:viewedTopics` | `string[]` | Array of viewed topic slugs |

---

## 10. Responsive & Accessibility

### Breakpoints

| Breakpoint | Layout | Sidebar |
|---|---|---|
| `< 768px` (mobile) | Single column, full-width content | Hidden; hamburger toggle |
| `768px–1024px` (tablet) | Two column; narrower sidebar | Icons-only sidebar |
| `> 1024px` (desktop) | Full three-column on topic pages | Full sidebar with labels |

### Mobile Considerations

- Settings page: stacked sections instead of side-by-side
- Practice session: timer prominently at top; notes below
- Test Console: cards stack vertically; logs in accordion
- Topic side panel: collapsible below content on mobile

### Accessibility Requirements

| Requirement | Implementation |
|---|---|
| Keyboard navigation | All interactive elements focusable via Tab; Enter/Space to activate |
| Screen reader labels | `aria-label` on icon buttons; `aria-live` regions for status updates |
| Focus management | Focus trap in modals; return focus after dialog close |
| Color contrast | Minimum 4.5:1 for text; 3:1 for large text/icons |
| Reduced motion | Respect `prefers-reduced-motion`; disable timer animations |
| Status announcements | `aria-live="polite"` for connection test results, test run status |

---

## 11. Testing Approach

### Per-Surface Test Plan

#### Navigation & Shell

| Test Type | What to Test | Tool |
|---|---|---|
| Unit | Sidebar section rendering, collapse toggle, active link highlighting | Vitest + RTL |
| Unit | StatusBar renders correct connection states | Vitest + RTL |
| Integration | Sidebar populates from mocked `/api/content` response | Vitest + RTL + msw |
| E2E | Navigate between all sections; verify sidebar active state | Playwright |

#### Topic Pages

| Test Type | What to Test | Tool |
|---|---|---|
| Unit | `TopicContent` renders HTML with correct styling | Vitest + RTL |
| Unit | `TopicSidePanel` renders key ideas, pitfalls, related links | Vitest + RTL |
| Unit | `TopicCard` renders title, summary, difficulty badge | Vitest + RTL |
| Integration | `TopicPage` fetches from mocked API and renders full page | Vitest + RTL + msw |
| E2E | Navigate to topic page, verify MDX content, side panel, breadcrumbs | Playwright |

#### Settings Page

| Test Type | What to Test | Tool |
|---|---|---|
| Unit | `LLMSettingsForm` validation (URL format, required fields, range checks) | Vitest + RTL |
| Unit | `TTSSettingsForm` enable/disable toggle disables fields | Vitest + RTL |
| Unit | Provider dropdown changes required fields | Vitest + RTL |
| Integration | "Test Connection" button calls API and shows result | Vitest + RTL + msw |
| Integration | "Save Profile" sends correct payload to `PUT /api/settings` | Vitest + RTL + msw |
| E2E | Fill LLM form → Test Connection → see success → Save | Playwright |
| E2E | Enable TTS → fill URL → Test Connection → see result | Playwright |

#### Test Console

| Test Type | What to Test | Tool |
|---|---|---|
| Unit | `TestSuiteCard` renders suite info, disables when other running | Vitest + RTL |
| Unit | `TestResultsPanel` renders pass/fail counts and logs | Vitest + RTL |
| Integration | "Run" triggers `POST /api/tests/run` and polls status | Vitest + RTL + msw |
| E2E | Click "Run" on Smoke suite → see spinner → see results | Playwright |

#### Practice Mode

| Test Type | What to Test | Tool |
|---|---|---|
| Unit | `PhaseTimer` counts down, calls onExpire, pauses | Vitest + RTL |
| Unit | `PhaseProgress` renders correct step states | Vitest + RTL |
| Unit | `ScoringPanel` slider values update correctly | Vitest + RTL |
| Integration | Start session → navigate phases → score → save | Vitest + RTL + msw |
| E2E | Full practice flow: select template → complete all phases → score → verify saved | Playwright |

### Test File Organization

```
apps/portal/
  __tests__/
    unit/
      components/
        sidebar.test.tsx
        status-bar.test.tsx
        topic-content.test.tsx
        topic-side-panel.test.tsx
        topic-card.test.tsx
        llm-settings-form.test.tsx
        tts-settings-form.test.tsx
        test-suite-card.test.tsx
        test-results-panel.test.tsx
        phase-timer.test.tsx
        phase-progress.test.tsx
        scoring-panel.test.tsx
        connection-status-badge.test.tsx
        slider-input.test.tsx
    integration/
      pages/
        topic-page.test.tsx
        settings-page.test.tsx
        test-console-page.test.tsx
        practice-session-page.test.tsx
  e2e/
    smoke.spec.ts
    settings-flow.spec.ts
    test-console.spec.ts
    practice-flow.spec.ts
```

### E2E Test Scenarios (Playwright)

#### `smoke.spec.ts`
1. Home page loads with correct title
2. Sidebar shows all content sections
3. Navigate to each section → page loads without errors
4. Navigate to Settings → form loads
5. Navigate to Test Console → suite cards load

#### `settings-flow.spec.ts`
1. Open Settings → LLM form is visible
2. Select "Local (Ollama)" provider → fill base URL and model
3. Click "Test Connection" → spinner appears → success badge shows
4. Click "Save Profile" → toast confirms save
5. Toggle TTS on → fill server URL → Test Connection → verify result
6. Change theme → UI updates immediately

#### `test-console.spec.ts`
1. Open Test Console → all suite cards visible
2. Click "Run" on Smoke suite → spinner appears → results show
3. Verify pass/fail counts displayed
4. Open logs section → log text visible

#### `practice-flow.spec.ts`
1. Open Practice → template cards visible
2. Click "Start" on a template → session page loads
3. Timer starts counting down
4. Navigate through phases using "Next Phase"
5. After last phase → scoring panel appears
6. Move all rubric sliders → enter notes
7. Click "Complete & Save Session"
8. Redirect to history → new session appears in list
