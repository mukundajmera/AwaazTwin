import { NextRequest, NextResponse } from "next/server";
import { testTTSConnection } from "@/lib/tts-client";
import { validateServerUrl } from "@/lib/url-validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serverUrl } = body as { serverUrl?: string };

  if (!serverUrl) {
    return NextResponse.json(
      { error: "serverUrl is required" },
      { status: 400 }
    );
  }

  // Validate serverUrl to prevent SSRF
  const urlError = validateServerUrl(serverUrl);
  if (urlError) {
    return NextResponse.json(
      { error: `Invalid serverUrl: ${urlError}` },
      { status: 400 }
    );
  }

  const result = await testTTSConnection({ serverUrl });

  if (result.status === "error") {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
