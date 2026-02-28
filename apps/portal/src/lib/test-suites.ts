import { TestSuiteDefinition } from "./types";

export const testSuites: TestSuiteDefinition[] = [
  {
    id: "smoke",
    name: "Smoke UI Tests",
    description: "Basic navigation and page loading",
    command: "npx playwright test e2e/portal-smoke.spec.ts",
    estimatedDuration: "~10s",
    requiresExternalServices: false,
  },
  {
    id: "api",
    name: "API Tests",
    description: "Route handler unit tests",
    command: "npx vitest run --reporter=verbose tests/api",
    estimatedDuration: "~5s",
    requiresExternalServices: false,
  },
  {
    id: "llm-integration",
    name: "LLM Integration Tests",
    description: "LLM backend connectivity and response tests",
    command: "npx vitest run --reporter=verbose tests/integration/llm",
    estimatedDuration: "~30s",
    requiresExternalServices: true,
    comingSoon: true,
  },
  {
    id: "tts-integration",
    name: "TTS Integration Tests",
    description: "TTS server connectivity and audio generation tests",
    command: "npx vitest run --reporter=verbose tests/integration/tts",
    estimatedDuration: "~1min",
    requiresExternalServices: true,
    comingSoon: true,
  },
  {
    id: "practice-flow",
    name: "Practice Flow E2E",
    description: "Full practice session flow",
    command: "npx playwright test e2e/practice-flow.spec.ts",
    estimatedDuration: "~30s",
    requiresExternalServices: false,
  },
];
