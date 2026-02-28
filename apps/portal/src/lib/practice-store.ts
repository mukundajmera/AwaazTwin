import fs from "fs";
import path from "path";
import { PracticeSession } from "./types";

const defaultStorePath = path.join(process.cwd(), ".data", "practice-sessions.json");

function ensureStoreDir(storePath: string): void {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readSessions(storePath: string = defaultStorePath): PracticeSession[] {
  if (!fs.existsSync(storePath)) return [];
  const raw = fs.readFileSync(storePath, "utf-8");
  try {
    return JSON.parse(raw) as PracticeSession[];
  } catch {
    return [];
  }
}

function writeSessions(
  sessions: PracticeSession[],
  storePath: string = defaultStorePath
): void {
  ensureStoreDir(storePath);
  fs.writeFileSync(storePath, JSON.stringify(sessions, null, 2), "utf-8");
}

export function getAllSessions(
  storePath: string = defaultStorePath
): PracticeSession[] {
  return readSessions(storePath);
}

export function getSessionById(
  id: string,
  storePath: string = defaultStorePath
): PracticeSession | undefined {
  return readSessions(storePath).find((s) => s.id === id);
}

export function saveSession(
  session: PracticeSession,
  storePath: string = defaultStorePath
): PracticeSession {
  const sessions = readSessions(storePath);
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  writeSessions(sessions, storePath);
  return session;
}
