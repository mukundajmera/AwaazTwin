import { NextRequest, NextResponse } from "next/server";

// TODO: Replace stub with real LLM connection test
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { baseUrl, model } = body as {
    provider?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
  };

  if (!baseUrl || !model) {
    return NextResponse.json(
      { error: "baseUrl and model are required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "ok",
    latencyMs: 142,
    model,
    message: "Connection successful (stubbed)",
  });
}
