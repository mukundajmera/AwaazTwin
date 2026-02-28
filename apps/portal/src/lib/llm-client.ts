/**
 * Provider-agnostic LLM client abstraction.
 *
 * Supports local backends (Ollama, llama.cpp/llama-server) speaking
 * OpenAI-style HTTP and cloud providers (OpenAI, Azure) via the same
 * interface.  Configuration comes from the Settings UI.
 */

export interface LLMRequestOptions {
  provider: "ollama" | "llama-cpp" | "openai" | "azure" | "custom";
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMTestResult {
  status: "ok" | "error";
  latencyMs: number;
  model: string;
  message: string;
}

/**
 * Build the chat-completions URL for the given provider / base URL.
 *
 * Ollama, llama.cpp, and custom providers expose
 * `{baseUrl}/v1/chat/completions`.  OpenAI and Azure have their own
 * patterns but we normalise to the same path where possible.
 */
function buildChatUrl(opts: LLMRequestOptions): string {
  const base = opts.baseUrl.replace(/\/+$/, "");

  switch (opts.provider) {
    case "azure": {
      // Azure uses {baseUrl}/openai/deployments/{model}/chat/completions?api-version=…
      const version = "2024-02-01";
      return `${base}/openai/deployments/${encodeURIComponent(opts.model)}/chat/completions?api-version=${version}`;
    }
    default:
      // Ollama, llama-cpp, openai, custom → standard OpenAI-compatible path
      return `${base}/v1/chat/completions`;
  }
}

function buildHeaders(opts: LLMRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts.provider === "azure" && opts.apiKey) {
    headers["api-key"] = opts.apiKey;
  } else if (opts.apiKey) {
    headers["Authorization"] = `Bearer ${opts.apiKey}`;
  }

  return headers;
}

/**
 * Send a chat completion request and return parsed content.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: LLMRequestOptions,
): Promise<LLMChatResponse> {
  const url = buildChatUrl(opts);
  const headers = buildHeaders(opts);

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `LLM request failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const data = await res.json();

  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("LLM returned no choices");
  }

  return {
    content: choice.message?.content ?? "",
    model: data.model ?? opts.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
  };
}

/**
 * Test connectivity to the LLM backend with a trivial prompt.
 * Returns status, latency, and a short message.
 */
export async function testLLMConnection(
  opts: LLMRequestOptions,
): Promise<LLMTestResult> {
  const start = Date.now();

  try {
    const response = await chatCompletion(
      [{ role: "user", content: "Respond with exactly: ok" }],
      { ...opts, maxTokens: 16, temperature: 0 },
    );

    const latencyMs = Date.now() - start;
    return {
      status: "ok",
      latencyMs,
      model: response.model,
      message: `Connected – model responded in ${latencyMs}ms`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message =
      err instanceof Error ? err.message : "Unknown error connecting to LLM";
    return {
      status: "error",
      latencyMs,
      model: opts.model,
      message,
    };
  }
}
