import { NextRequest, NextResponse } from "next/server";
import { getSessionById, saveSession } from "@/lib/practice-store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, scores, notes } = body as {
    sessionId?: string;
    scores?: Record<string, unknown>;
    notes?: string;
  };

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const session = getSessionById(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Practice session not found", sessionId },
      { status: 404 }
    );
  }

  if (session.status !== "completed" || !session.completedAt) {
    session.completedAt = new Date().toISOString();
  }
  session.status = "completed";

  if (scores && typeof scores === "object" && scores !== null && !Array.isArray(scores)) {
    const validScores: Record<string, number> = {};
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        validScores[key] = value;
      }
    }
    if (Object.keys(validScores).length > 0) {
      session.scores = validScores;
    }
  }
  if (typeof notes === "string") {
    session.notes = notes;
  }

  saveSession(session);

  return NextResponse.json(session);
}
