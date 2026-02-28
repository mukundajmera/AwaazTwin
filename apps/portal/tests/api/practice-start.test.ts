import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "@/app/api/practice/start/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// Mock practice-store to use a temp file
let tmpDir: string;
let storePath: string;

vi.mock("@/lib/practice-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/practice-store")>(
    "@/lib/practice-store"
  );
  return {
    ...actual,
    saveSession: (session: import("@/lib/types").PracticeSession) =>
      actual.saveSession(session, storePath),
    getAllSessions: () => actual.getAllSessions(storePath),
    getSessionById: (id: string) => actual.getSessionById(id, storePath),
  };
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/practice/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/practice/start", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "practice-start-test-"));
    storePath = path.join(tmpDir, "sessions.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns 400 when templateId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("templateId is required");
  });

  it("returns 404 for unknown templateId", async () => {
    const res = await POST(makeRequest({ templateId: "nonexistent" }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Practice template not found");
  });

  it("creates a new session for valid templateId", async () => {
    const res = await POST(makeRequest({ templateId: "basic-voice-clone" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBeDefined();
    expect(json.templateId).toBe("basic-voice-clone");
    expect(json.status).toBe("in-progress");
    expect(json.startedAt).toBeDefined();
    expect(json.completedAt).toBeNull();
    expect(json.scores).toEqual({});
  });
});
