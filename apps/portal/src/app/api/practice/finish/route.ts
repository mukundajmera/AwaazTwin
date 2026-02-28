import { NextRequest, NextResponse } from "next/server";
import { getSessionById, saveSession } from "@/lib/practice-store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, scores, notes } = body as {
    sessionId?: string;
    scores?: Record<string, number>;
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

  session.completedAt = new Date().toISOString();
  session.status = "completed";
  if (scores && typeof scores === "object") {
    session.scores = scores;
  }
  if (typeof notes === "string") {
    session.notes = notes;
  }

  saveSession(session);

  return NextResponse.json(session);
}
