import { describe, it, expect, vi, beforeEach } from "vitest";
import { testLLMConnection, chatCompletion, type LLMRequestOptions } from "@/lib/llm-client";

const defaultOpts: LLMRequestOptions = {
  provider: "ollama",
  baseUrl: "http://localhost:11434",
  model: "llama3.2",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("llm-client", () => {
  describe("chatCompletion", () => {
    it("sends correct request to OpenAI-style endpoint", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Hello!" } }],
        model: "llama3.2",
        usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await chatCompletion(
        [{ role: "user", content: "Say hello" }],
        defaultOpts
      );

      expect(result.content).toBe("Hello!");
      expect(result.model).toBe("llama3.2");
      expect(result.usage?.totalTokens).toBe(6);

      // Verify the fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:11434/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("uses Azure URL format for Azure provider", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Hi" } }],
        model: "gpt-4",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await chatCompletion([{ role: "user", content: "Hi" }], {
        ...defaultOpts,
        provider: "azure",
        baseUrl: "https://myazure.openai.azure.com",
        model: "gpt-4",
        apiKey: "test-key",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/openai/deployments/gpt-4/chat/completions"),
        expect.objectContaining({
          headers: expect.objectContaining({ "api-key": "test-key" }),
        })
      );
    });

    it("includes Bearer token for OpenAI provider", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Hi" } }],
        model: "gpt-4",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      await chatCompletion([{ role: "user", content: "Hi" }], {
        ...defaultOpts,
        provider: "openai",
        baseUrl: "https://api.openai.com",
        apiKey: "sk-test",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer sk-test",
          }),
        })
      );
    });

    it("throws on HTTP error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Not found", { status: 404 })
      );

      await expect(
        chatCompletion([{ role: "user", content: "Hi" }], defaultOpts)
      ).rejects.toThrow(/LLM request failed/);
    });

    it("throws when no choices returned", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [] }), { status: 200 })
      );

      await expect(
        chatCompletion([{ role: "user", content: "Hi" }], defaultOpts)
      ).rejects.toThrow(/no choices/);
    });
  });

  describe("testLLMConnection", () => {
    it("returns ok on successful connection", async () => {
      const mockResponse = {
        choices: [{ message: { content: "ok" } }],
        model: "llama3.2",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await testLLMConnection(defaultOpts);
      expect(result.status).toBe("ok");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.model).toBe("llama3.2");
    });

    it("returns error on failed connection", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("Connection refused")
      );

      const result = await testLLMConnection(defaultOpts);
      expect(result.status).toBe("error");
      expect(result.message).toContain("Connection refused");
    });
  });
});
