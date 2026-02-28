import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPracticeTemplateById } from "@/lib/practice-templates";
import { saveSession } from "@/lib/practice-store";
import type { PracticeSession } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { templateId } = body as { templateId?: string };

  if (!templateId || typeof templateId !== "string") {
    return NextResponse.json(
      { error: "templateId is required" },
      { status: 400 }
    );
  }

  const template = getPracticeTemplateById(templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Practice template not found", templateId },
      { status: 404 }
    );
  }

  const session: PracticeSession = {
    id: uuidv4(),
    templateId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentPhaseIndex: 0,
    scores: {},
    notes: "",
    status: "in-progress",
  };

  saveSession(session);

  return NextResponse.json(session, { status: 201 });
}
