import { NextRequest, NextResponse } from "next/server";
import { testLLMConnection, type LLMRequestOptions } from "@/lib/llm-client";
import { validateServerUrl, isValidProvider, VALID_PROVIDERS_LIST } from "@/lib/url-validation";

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

  // Validate provider
  const resolvedProvider = provider ?? "ollama";
  if (!isValidProvider(resolvedProvider)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}. Must be one of: ${VALID_PROVIDERS_LIST}` },
      { status: 400 }
    );
  }

  // Validate baseUrl to prevent SSRF
  const urlError = validateServerUrl(baseUrl);
  if (urlError) {
    return NextResponse.json(
      { error: `Invalid baseUrl: ${urlError}` },
      { status: 400 }
    );
  }

  const opts: LLMRequestOptions = {
    provider: resolvedProvider as LLMRequestOptions["provider"],
    baseUrl,
    model,
    apiKey: apiKey || undefined,
  };

  try {
    const result = await testLLMConnection(opts);

    if (result.status === "error") {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error testing LLM connection";
    return NextResponse.json(
      { status: "error", latencyMs: 0, model, message },
      { status: 502 }
    );
  }
}
