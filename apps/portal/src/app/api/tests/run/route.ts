import { NextRequest, NextResponse } from "next/server";
import { testSuites } from "@/lib/test-suites";
import { exec } from "child_process";
import path from "path";

export async function POST(request: NextRequest) {
  // Only allow test execution in non-production environments
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test execution is disabled in production" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { suiteId } = body as { suiteId?: string };

  const suite = testSuites.find((s) => s.id === suiteId);
  if (!suite) {
    return NextResponse.json(
      { error: "Test suite not found", suiteId },
      { status: 404 }
    );
  }

  if (suite.comingSoon) {
    return NextResponse.json(
      { error: "This test suite is not yet available", suiteId },
      { status: 400 }
    );
  }

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Execute the test command in the portal directory.
  // SECURITY: `suite.command` comes from the hardcoded `testSuites` constant in
  // `@/lib/test-suites` – it is never derived from user input.  The `suiteId`
  // parameter is only used as a lookup key into that constant array.
  const portalDir = path.resolve(process.cwd());
  const command = suite.command;

  try {
    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      exec(
        command,
        {
          cwd: portalDir,
          timeout: 300_000, // 5 min max
          env: { ...process.env, FORCE_COLOR: "0", CI: "true" },
        },
        (error, stdout, stderr) => {
          const exitCode =
            error == null
              ? 0
              : typeof error.code === "number"
              ? error.code
              : 1;
          resolve({
            stdout: stdout ?? "",
            stderr: stderr ?? "",
            code: exitCode,
          });
        }
      );
    });

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const logs = (result.stdout + "\n" + result.stderr).trim();

    // Parse pass/fail counts from output
    const { passed, failed, skipped } = parseTestResults(logs);

    return NextResponse.json({
      id: runId,
      suiteId,
      status: result.code === 0 ? "completed" : "failed",
      startedAt,
      completedAt,
      passed,
      failed,
      skipped,
      durationMs,
      logs,
    });
  } catch (err) {
    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const message = err instanceof Error ? err.message : "Test execution failed";

    return NextResponse.json({
      id: runId,
      suiteId,
      status: "failed",
      startedAt,
      completedAt,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs,
      logs: message,
    });
  }
}

/**
 * Attempt to parse pass/fail/skip counts from test runner output.
 * Works with both Vitest and Playwright output formats.
 */
function parseTestResults(output: string): {
  passed: number;
  failed: number;
  skipped: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Vitest: "Tests  50 passed (50)" or "Tests  3 failed | 47 passed (50)"
  const vitestMatch = output.match(
    /Tests?\s+(?:(\d+)\s+failed\s*\|?\s*)?(\d+)\s+passed/i
  );
  if (vitestMatch) {
    failed = parseInt(vitestMatch[1] ?? "0", 10);
    passed = parseInt(vitestMatch[2] ?? "0", 10);
    const skipMatch = output.match(/(\d+)\s+skipped/i);
    if (skipMatch) skipped = parseInt(skipMatch[1], 10);
    return { passed, failed, skipped };
  }

  // Playwright: "5 passed" / "2 failed" / "1 skipped"
  const pwPassed = output.match(/(\d+)\s+passed/i);
  const pwFailed = output.match(/(\d+)\s+failed/i);
  const pwSkipped = output.match(/(\d+)\s+skipped/i);
  if (pwPassed) passed = parseInt(pwPassed[1], 10);
  if (pwFailed) failed = parseInt(pwFailed[1], 10);
  if (pwSkipped) skipped = parseInt(pwSkipped[1], 10);

  return { passed, failed, skipped };
}
