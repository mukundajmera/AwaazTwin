// Content
export interface Topic {
  slug: string;
  title: string;
  section: ContentSection;
  summary: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  relatedTopics?: string[];
  tags?: string[];
  updatedAt: string;
}

export type ContentSection =
  | "voice-cloning"
  | "tts"
  | "models"
  | "guides"
  | "reference";

// LLM
export interface LLMProviderProfile {
  id: string;
  name: string;
  provider: "ollama" | "llama-cpp" | "openai" | "azure" | "custom";
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
}

// TTS
export interface TTSProfile {
  id: string;
  name: string;
  serverUrl: string;
  enabled: boolean;
  voices: TTSVoice[];
}

export interface TTSVoice {
  speakerId: string;
  name: string;
  language: string;
  createdAt: string;
}

// Testing
export interface TestSuiteDefinition {
  id: string;
  name: string;
  description: string;
  command: string;
  estimatedDuration: string;
  requiresExternalServices: boolean;
  /** When true, the suite is a placeholder and not yet runnable */
  comingSoon?: boolean;
}

export interface TestRun {
  id: string;
  suiteId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number | null;
  logs: string;
}

// Practice
export type PracticeCategory = "voice-cloning" | "tts-pipeline" | "architecture";

export interface PracticePhase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface RubricItem {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export interface PracticeTemplate {
  id: string;
  title: string;
  category: PracticeCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  summary: string;
  phases: PracticePhase[];
  rubric: RubricItem[];
}

export interface PracticeSession {
  id: string;
  templateId: string;
  startedAt: string;
  completedAt: string | null;
  currentPhaseIndex: number;
  scores: Record<string, number>;
  notes: string;
  status: "in-progress" | "completed";
}

// App Settings
export interface AppSettings {
  activeLLMProfileId: string | null;
  activeTTSProfileId: string | null;
  llmProfiles: LLMProviderProfile[];
  ttsProfiles: TTSProfile[];
  ui: {
    theme: "light" | "dark" | "system";
    sidebarCollapsed: boolean;
  };
}
