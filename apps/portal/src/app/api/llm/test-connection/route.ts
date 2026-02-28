import { NextRequest, NextResponse } from "next/server";
import { testLLMConnection, type LLMRequestOptions } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, baseUrl, model, apiKey } = body as {
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

  const opts: LLMRequestOptions = {
    provider: (provider as LLMRequestOptions["provider"]) ?? "ollama",
    baseUrl,
    model,
    apiKey: apiKey || undefined,
  };

  const result = await testLLMConnection(opts);

  if (result.status === "error") {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
