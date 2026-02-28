import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, type LLMRequestOptions } from "@/lib/llm-client";
import { validateServerUrl, isValidProvider, isValidChatRole, VALID_PROVIDERS_LIST, VALID_CHAT_ROLES_LIST } from "@/lib/url-validation";

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

  if (!messages || !Array.isArray(messages) || !baseUrl || !model) {
    return NextResponse.json(
      { error: "messages, baseUrl, and model are required" },
      { status: 400 },
    );
  }

  // Validate provider
  const resolvedProvider = provider ?? "ollama";
  if (!isValidProvider(resolvedProvider)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}. Must be one of: ${VALID_PROVIDERS_LIST}` },
      { status: 400 },
    );
  }

  // Validate baseUrl to prevent SSRF
  const urlError = validateServerUrl(baseUrl);
  if (urlError) {
    return NextResponse.json(
      { error: `Invalid baseUrl: ${urlError}` },
      { status: 400 },
    );
  }

  // Validate message roles and content
  for (const m of messages) {
    if (!isValidChatRole(m.role)) {
      return NextResponse.json(
        { error: `Invalid message role: "${m.role}". Must be one of: ${VALID_CHAT_ROLES_LIST}` },
        { status: 400 },
      );
    }
    if (typeof m.content !== "string" || !m.content.trim()) {
      return NextResponse.json(
        { error: "Each message must have a non-empty content string" },
        { status: 400 },
      );
    }
  }

  const opts: LLMRequestOptions = {
    provider: resolvedProvider as LLMRequestOptions["provider"],
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
