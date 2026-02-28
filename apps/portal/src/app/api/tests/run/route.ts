import { NextRequest, NextResponse } from "next/server";
import { testSuites } from "@/lib/test-suites";

// TODO: Replace stub with actual test runner execution
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { suiteId } = body as { suiteId?: string };

  const suite = testSuites.find((s) => s.id === suiteId);
  if (!suite) {
    return NextResponse.json(
      { error: "Test suite not found", suiteId },
      { status: 404 }
    );
  }

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const completedAt = new Date(Date.now() + 10200).toISOString();

  return NextResponse.json({
    id: runId,
    suiteId,
    status: "completed",
    startedAt,
    completedAt,
    passed: 5,
    failed: 0,
    skipped: 0,
    durationMs: 10200,
    logs: [
      "Running 5 tests using 1 worker",
      "[1/5] test-file.spec.ts:10",
      "  ✓ home page loads (1.2s)",
      "[2/5] test-file.spec.ts:20",
      "  ✓ navigation works (2.1s)",
      "[3/5] test-file.spec.ts:30",
      "  ✓ topic page renders content (1.8s)",
      "[4/5] test-file.spec.ts:40",
      "  ✓ settings page loads (2.4s)",
      "[5/5] test-file.spec.ts:50",
      "  ✓ test console page loads (2.7s)",
      "",
      "5 passed (10.2s)",
    ].join("\n"),
  });
}
