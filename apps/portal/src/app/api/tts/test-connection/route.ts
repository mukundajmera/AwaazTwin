import { NextRequest, NextResponse } from "next/server";

// TODO: Replace stub with real TTS connection test
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serverUrl } = body as { serverUrl?: string };

  if (!serverUrl) {
    return NextResponse.json(
      { error: "serverUrl is required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "ok",
    latencyMs: 85,
    serverUrl,
    availableModels: ["xtts_v2", "bark"],
    message: "TTS server connected (stubbed)",
  });
}
