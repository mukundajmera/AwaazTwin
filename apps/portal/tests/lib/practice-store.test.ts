import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  getAllSessions,
  getSessionById,
  saveSession,
} from "@/lib/practice-store";
import type { PracticeSession } from "@/lib/types";

describe("practice-store", () => {
  let tmpDir: string;
  let storePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "practice-store-test-"));
    storePath = path.join(tmpDir, "sessions.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
    return {
      id: "test-session-1",
      templateId: "basic-voice-clone",
      startedAt: "2025-01-15T10:00:00Z",
      completedAt: null,
      currentPhaseIndex: 0,
      scores: {},
      notes: "",
      status: "in-progress",
      ...overrides,
    };
  }

  describe("getAllSessions", () => {
    it("returns empty array when store file does not exist", () => {
      expect(getAllSessions(storePath)).toEqual([]);
    });

    it("returns empty array when store file contains invalid JSON", () => {
      fs.writeFileSync(storePath, "not valid json");
      expect(getAllSessions(storePath)).toEqual([]);
    });

    it("returns sessions from store file", () => {
      const sessions = [makeSession()];
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(sessions));
      expect(getAllSessions(storePath)).toHaveLength(1);
      expect(getAllSessions(storePath)[0].id).toBe("test-session-1");
    });
  });

  describe("getSessionById", () => {
    it("returns undefined when session not found", () => {
      expect(getSessionById("nonexistent", storePath)).toBeUndefined();
    });

    it("returns session by id", () => {
      const session = makeSession();
      saveSession(session, storePath);
      const result = getSessionById("test-session-1", storePath);
      expect(result).toBeDefined();
      expect(result!.id).toBe("test-session-1");
    });
  });

  describe("saveSession", () => {
    it("creates store file and directory if they do not exist", () => {
      const deepPath = path.join(tmpDir, "nested", "deep", "store.json");
      saveSession(makeSession(), deepPath);
      expect(fs.existsSync(deepPath)).toBe(true);
    });

    it("saves a new session", () => {
      saveSession(makeSession(), storePath);
      const sessions = getAllSessions(storePath);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe("test-session-1");
    });

    it("updates an existing session by id", () => {
      saveSession(makeSession(), storePath);
      saveSession(
        makeSession({
          status: "completed",
          completedAt: "2025-01-15T11:00:00Z",
          scores: { requirements: 4 },
        }),
        storePath
      );
      const sessions = getAllSessions(storePath);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe("completed");
      expect(sessions[0].scores).toEqual({ requirements: 4 });
    });

    it("appends multiple sessions", () => {
      saveSession(makeSession({ id: "session-1" }), storePath);
      saveSession(makeSession({ id: "session-2" }), storePath);
      expect(getAllSessions(storePath)).toHaveLength(2);
    });
  });
});
