"use client";

import { useState } from "react";

interface UATScenario {
  id: string;
  title: string;
  description: string;
  steps: string[];
  playwrightTest: string;
  requiresExternalServices: boolean;
}

const scenarios: UATScenario[] = [
  {
    id: "scenario-a",
    title: "Scenario A – Browse Classic Content",
    description:
      "Verify that users can navigate the portal, view content sections, and read topic pages.",
    steps: [
      "Open the portal home page",
      "Verify section cards are displayed (Voice Cloning, TTS, Models, Guides, Reference)",
      "Click 'Voice Cloning' section",
      "Verify at least one topic card is listed",
      "Open a topic and verify content renders with heading and body text",
      "Navigate back via breadcrumbs",
    ],
    playwrightTest: "e2e/uat-scenarios.spec.ts – Scenario A",
    requiresExternalServices: false,
  },
  {
    id: "scenario-b",
    title: "Scenario B – Configure & Test LLM Connection",
    description:
      "Verify that users can configure an LLM provider and test connectivity from the Settings UI.",
    steps: [
      "Navigate to Settings page",
      "Select a provider (e.g., Ollama)",
      "Enter Base URL (e.g., http://localhost:11434)",
      "Enter Model name (e.g., llama3.2)",
      "Click 'Test Connection'",
      "Verify connection status shows success or a clear error message",
      "If LLM is not running, verify graceful degradation (error message, not crash)",
    ],
    playwrightTest: "e2e/uat-scenarios.spec.ts – Scenario B",
    requiresExternalServices: true,
  },
  {
    id: "scenario-c",
    title: "Scenario C – Configure & Test TTS Connection",
    description:
      "Verify TTS configuration, voice registration, and audio generation.",
    steps: [
      "Navigate to Settings page",
      "Enable TTS checkbox",
      "Enter TTS Server URL (e.g., http://localhost:5002)",
      "Click 'Test Connection'",
      "Verify connection status shows success or a clear error message",
      "If TTS is not running, verify graceful degradation",
    ],
    playwrightTest: "e2e/uat-scenarios.spec.ts – Scenario C",
    requiresExternalServices: true,
  },
  {
    id: "scenario-d",
    title: "Scenario D – Full Practice Session",
    description:
      "Run through a complete practice session: select a problem, progress through phases, self-score, and verify the session record.",
    steps: [
      "Navigate to Practice page",
      "Select a practice template (e.g., 'Basic Voice Clone Pipeline')",
      "Click 'Start Session'",
      "Move through at least two phases using 'Next Phase'",
      "Fill in rubric scores using sliders",
      "Add practice notes",
      "Click 'Finish Session'",
      "Verify the completion screen with score breakdown is displayed",
    ],
    playwrightTest: "e2e/uat-scenarios.spec.ts – Scenario D",
    requiresExternalServices: false,
  },
];

type ScenarioResult = {
  status: "pending" | "pass" | "fail";
  message?: string;
};

export default function UATChecklistPage() {
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [runningAll, setRunningAll] = useState(false);

  function markScenario(id: string, status: "pass" | "fail", message?: string) {
    setResults((prev) => ({ ...prev, [id]: { status, message } }));
  }

  async function runAllUAT() {
    setRunningAll(true);
    try {
      const res = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId: "uat" }),
      });
      const data = await res.json();

      // Mark all scenarios based on overall result
      const passed = data.status === "completed" && data.failed === 0;
      for (const s of scenarios) {
        if (!s.requiresExternalServices) {
          setResults((prev) => ({
            ...prev,
            [s.id]: {
              status: passed ? "pass" : "fail",
              message: passed
                ? `Passed (${data.durationMs}ms)`
                : `Suite ${data.status}: ${data.passed} passed, ${data.failed} failed`,
            },
          }));
        }
      }
    } catch (err) {
      for (const s of scenarios) {
        if (!s.requiresExternalServices) {
          setResults((prev) => ({
            ...prev,
            [s.id]: {
              status: "fail",
              message: err instanceof Error ? err.message : "Failed to run UAT",
            },
          }));
        }
      }
    } finally {
      setRunningAll(false);
    }
  }

  const totalScenarios = scenarios.length;
  const passedCount = Object.values(results).filter((r) => r.status === "pass").length;
  const failedCount = Object.values(results).filter((r) => r.status === "fail").length;

  return (
    <div data-testid="uat-checklist-page" className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">UAT Checklist</h1>
        <p className="text-gray-600 mt-2">
          User acceptance test scenarios for verifying the portal works end-to-end.
          Run automated tests or manually verify each scenario.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          ⚠ Scenarios requiring external services (LLM/TTS) need those services running locally.
          On CPU-only machines, tests may take longer.
        </p>
      </div>

      {/* Summary */}
      <div data-testid="uat-summary" className="flex gap-6 text-sm border border-gray-200 rounded-lg p-4">
        <span>Total: <strong>{totalScenarios}</strong></span>
        <span className="text-green-700">Passed: <strong>{passedCount}</strong></span>
        <span className="text-red-700">Failed: <strong>{failedCount}</strong></span>
        <span className="text-gray-500">
          Pending: <strong>{totalScenarios - passedCount - failedCount}</strong>
        </span>
        <button
          type="button"
          data-testid="run-all-uat"
          onClick={runAllUAT}
          disabled={runningAll}
          className="ml-auto px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {runningAll ? "Running…" : "Run Automated Tests"}
        </button>
      </div>

      {/* Scenarios */}
      <div className="space-y-6">
        {scenarios.map((scenario) => {
          const result = results[scenario.id] ?? { status: "pending" };
          return (
            <div
              key={scenario.id}
              data-testid="uat-scenario"
              className="border border-gray-200 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{scenario.title}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                  {scenario.requiresExternalServices && (
                    <span className="text-xs text-amber-600 font-medium">
                      ⚠ Requires external services
                    </span>
                  )}
                </div>
                <StatusBadge status={result.status} />
              </div>

              <div className="pl-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Steps
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {scenario.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="text-xs text-gray-500">
                Playwright test: <code>{scenario.playwrightTest}</code>
              </div>

              {result.message && (
                <div
                  className={`text-xs px-3 py-2 rounded ${
                    result.status === "pass"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {result.message}
                </div>
              )}

              {/* Manual verification buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="mark-pass"
                  onClick={() => markScenario(scenario.id, "pass", "Manually verified")}
                  className="px-3 py-1 text-xs font-medium rounded-md border border-green-300 text-green-700 hover:bg-green-50"
                >
                  ✅ Mark Pass
                </button>
                <button
                  type="button"
                  data-testid="mark-fail"
                  onClick={() => markScenario(scenario.id, "fail", "Manually marked as failed")}
                  className="px-3 py-1 text-xs font-medium rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                >
                  ❌ Mark Fail
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "pass" | "fail" }) {
  const styles = {
    pending: "bg-gray-100 text-gray-600",
    pass: "bg-green-100 text-green-800",
    fail: "bg-red-100 text-red-800",
  };
  const labels = {
    pending: "Pending",
    pass: "Passed",
    fail: "Failed",
  };

  return (
    <span
      data-testid="scenario-status"
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
