"use client";

import { useState } from "react";
import { testSuites } from "@/lib/test-suites";
import type { TestRun } from "@/lib/types";

export default function TestConsolePage() {
  const [results, setResults] = useState<Record<string, TestRun>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  async function runSuite(suiteId: string) {
    setRunning((prev) => ({ ...prev, [suiteId]: true }));
    try {
      const res = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId }),
      });
      const data: TestRun = await res.json();
      setResults((prev) => ({ ...prev, [suiteId]: data }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [suiteId]: {
          id: "",
          suiteId,
          status: "failed",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          passed: 0,
          failed: 0,
          skipped: 0,
          durationMs: null,
          logs: "Network error: could not reach test runner",
        },
      }));
    } finally {
      setRunning((prev) => ({ ...prev, [suiteId]: false }));
    }
  }

  return (
    <div data-testid="test-console-page" className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Test Console</h1>
      <p className="text-gray-600 text-sm">
        Run test suites against your local environment to verify everything is working.
      </p>

      <div className="space-y-4">
        {testSuites.map((suite) => {
          const isRunning = running[suite.id] ?? false;
          const result = results[suite.id];

          return (
            <div
              key={suite.id}
              data-testid="test-suite-card"
              className="border border-gray-200 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{suite.name}</h3>
                  <p className="text-sm text-gray-600">{suite.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>⏱ {suite.estimatedDuration}</span>
                    {suite.requiresExternalServices && (
                      <span className="text-amber-600 font-medium">
                        ⚠ Requires external services
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="run-test-button"
                  onClick={() => runSuite(suite.id)}
                  disabled={isRunning || suite.comingSoon}
                  className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {suite.comingSoon ? "Coming Soon" : isRunning ? "Running…" : "Run"}
                </button>
              </div>

              {result && (
                <div data-testid="test-results" className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <StatusBadge status={result.status} />
                    <span className="text-green-700">✅ {result.passed} passed</span>
                    <span className="text-red-700">❌ {result.failed} failed</span>
                    <span className="text-gray-500">⏭ {result.skipped} skipped</span>
                    {result.durationMs != null && (
                      <span className="text-gray-500">{result.durationMs}ms</span>
                    )}
                  </div>

                  {result.logs && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLogs((prev) => ({
                            ...prev,
                            [suite.id]: !prev[suite.id],
                          }))
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {expandedLogs[suite.id] ? "▾ Hide Logs" : "▸ Show Logs"}
                      </button>
                      {expandedLogs[suite.id] && (
                        <pre
                          data-testid="test-logs"
                          className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded-md overflow-x-auto max-h-64 overflow-y-auto font-mono"
                        >
                          {result.logs}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TestRun["status"] }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    running: "bg-blue-100 text-blue-800",
    queued: "bg-gray-100 text-gray-800",
    cancelled: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? styles.queued}`}>
      {status}
    </span>
  );
}
