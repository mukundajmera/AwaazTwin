import { NextRequest, NextResponse } from "next/server";
import { cloneVoice } from "@/lib/tts-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { audioBase64, voiceName, language, serverUrl } = body as {
    audioBase64?: string;
    voiceName?: string;
    language?: string;
    serverUrl?: string;
  };

  if (!audioBase64 || !voiceName || !serverUrl) {
    return NextResponse.json(
      { error: "audioBase64, voiceName, and serverUrl are required" },
      { status: 400 },
    );
  }

  try {
    const result = await cloneVoice(
      { audioBase64, voiceName, language },
      { serverUrl },
    );

    return NextResponse.json({
      speakerId: result.speakerId,
      voiceName: result.voiceName,
      message: result.message,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Voice cloning failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
