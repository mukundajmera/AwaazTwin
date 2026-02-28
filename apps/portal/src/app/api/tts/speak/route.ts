import { NextRequest, NextResponse } from "next/server";
import { speak } from "@/lib/tts-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, speakerId, language, serverUrl } = body as {
    text?: string;
    speakerId?: string;
    language?: string;
    serverUrl?: string;
  };

  if (!text || !serverUrl) {
    return NextResponse.json(
      { error: "text and serverUrl are required" },
      { status: 400 },
    );
  }

  try {
    const result = await speak(
      { text, speakerId, language },
      { serverUrl },
    );

    return NextResponse.json({
      audioBase64: result.audioBase64,
      contentType: result.contentType,
      durationMs: result.durationMs,
      message: "Audio generated successfully",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "TTS speak failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
