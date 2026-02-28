import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "@/app/api/practice/finish/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import type { PracticeSession } from "@/lib/types";
import * as store from "@/lib/practice-store";

let tmpDir: string;
let storePath: string;

vi.mock("@/lib/practice-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/practice-store")>(
    "@/lib/practice-store"
  );
  return {
    ...actual,
    saveSession: (session: PracticeSession) =>
      actual.saveSession(session, storePath),
    getAllSessions: () => actual.getAllSessions(storePath),
    getSessionById: (id: string) => actual.getSessionById(id, storePath),
  };
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/practice/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/practice/finish", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "practice-finish-test-"));
    storePath = path.join(tmpDir, "sessions.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns 400 when sessionId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("sessionId is required");
  });

  it("returns 404 when session does not exist", async () => {
    const res = await POST(makeRequest({ sessionId: "nonexistent" }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Practice session not found");
  });

  it("completes an existing session with scores and notes", async () => {
    const session: PracticeSession = {
      id: "test-session-finish",
      templateId: "basic-voice-clone",
      startedAt: "2025-01-15T10:00:00Z",
      completedAt: null,
      currentPhaseIndex: 0,
      scores: {},
      notes: "",
      status: "in-progress",
    };
    store.saveSession(session);

    const res = await POST(
      makeRequest({
        sessionId: "test-session-finish",
        scores: { requirements: 4, "pipeline-design": 3 },
        notes: "Good session",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("completed");
    expect(json.completedAt).toBeDefined();
    expect(json.scores).toEqual({ requirements: 4, "pipeline-design": 3 });
    expect(json.notes).toBe("Good session");
  });
});
