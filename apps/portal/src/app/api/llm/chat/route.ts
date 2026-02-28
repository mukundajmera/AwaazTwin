import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, type LLMRequestOptions } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, provider, baseUrl, model, apiKey, maxTokens, temperature } =
    body as {
      messages?: { role: string; content: string }[];
      provider?: string;
      baseUrl?: string;
      model?: string;
      apiKey?: string;
      maxTokens?: number;
      temperature?: number;
    };

  if (!messages || !baseUrl || !model) {
    return NextResponse.json(
      { error: "messages, baseUrl, and model are required" },
      { status: 400 },
    );
  }

  const opts: LLMRequestOptions = {
    provider: (provider as LLMRequestOptions["provider"]) ?? "ollama",
    baseUrl,
    model,
    apiKey: apiKey || undefined,
    maxTokens,
    temperature,
  };

  try {
    const result = await chatCompletion(
      messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      opts,
    );

    return NextResponse.json({
      content: result.content,
      model: result.model,
      usage: result.usage,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "LLM chat request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
