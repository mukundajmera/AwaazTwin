import { NextRequest, NextResponse } from "next/server";
import { cloneVoice } from "@/lib/tts-client";
import { validateServerUrl, MAX_AUDIO_BASE64_LENGTH } from "@/lib/url-validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { audioBase64, voiceName, language, serverUrl } = body as {
    audioBase64?: string;
    voiceName?: string;
    language?: string;
    serverUrl?: string;
  };

  if (
    typeof audioBase64 !== "string" ||
    typeof voiceName !== "string" ||
    typeof serverUrl !== "string" ||
    !audioBase64 ||
    !voiceName ||
    !serverUrl
  ) {
    return NextResponse.json(
      { error: "audioBase64, voiceName, and serverUrl are required" },
      { status: 400 },
    );
  }

  // Enforce a maximum size for the base64 audio payload to reduce DoS risk
  if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "audioBase64 payload is too large" },
      { status: 413 },
    );
  }

  // Validate serverUrl to prevent SSRF
  const urlError = validateServerUrl(serverUrl);
  if (urlError) {
    return NextResponse.json(
      { error: `Invalid serverUrl: ${urlError}` },
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
