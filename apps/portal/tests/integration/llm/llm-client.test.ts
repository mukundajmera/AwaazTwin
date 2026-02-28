/**
 * LLM integration tests.
 *
 * These tests call actual LLM endpoints when available.
 * If no LLM server is running they are expected to report clear
 * errors rather than crash.  Set LLM_BASE_URL env var to target
 * a running Ollama/llama-server instance.
 */
import { describe, it, expect } from "vitest";
import {
  testLLMConnection,
  chatCompletion,
  type LLMRequestOptions,
} from "@/lib/llm-client";

const LLM_BASE_URL = process.env.LLM_BASE_URL ?? "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";

const opts: LLMRequestOptions = {
  provider: "ollama",
  baseUrl: LLM_BASE_URL,
  model: LLM_MODEL,
};

describe("LLM integration", () => {
  it("testLLMConnection returns ok or error without crashing", async () => {
    const result = await testLLMConnection(opts);
    expect(result).toHaveProperty("status");
    expect(["ok", "error"]).toContain(result.status);
    expect(result).toHaveProperty("latencyMs");
    expect(typeof result.latencyMs).toBe("number");
    expect(result).toHaveProperty("message");
  });

  it("chatCompletion returns content when server is up (graceful otherwise)", async () => {
    try {
      const response = await chatCompletion(
        [{ role: "user", content: "Say hello" }],
        opts,
      );
      expect(response).toHaveProperty("content");
      expect(typeof response.content).toBe("string");
      expect(response).toHaveProperty("model");
    } catch (err) {
      // If server is not running, the error should be informative
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });

  it("handles invalid base URL gracefully", async () => {
    const result = await testLLMConnection({
      ...opts,
      baseUrl: "http://127.0.0.1:1",
    });
    expect(result.status).toBe("error");
    expect(result.message).toBeTruthy();
  });
});
