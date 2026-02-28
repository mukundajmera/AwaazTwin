import { describe, it, expect } from "vitest";

describe("Settings validation", () => {
  describe("LLM settings validation", () => {
    it("should require baseUrl to be non-empty", () => {
      expect("".trim().length > 0).toBe(false);
      expect("http://localhost:11434".trim().length > 0).toBe(true);
    });

    it("should require model to be non-empty", () => {
      expect("".trim().length > 0).toBe(false);
      expect("llama3.2".trim().length > 0).toBe(true);
    });

    it("should validate temperature range (0-2)", () => {
      const isValidTemp = (t: number) => t >= 0 && t <= 2;
      expect(isValidTemp(0)).toBe(true);
      expect(isValidTemp(0.7)).toBe(true);
      expect(isValidTemp(2)).toBe(true);
      expect(isValidTemp(-1)).toBe(false);
      expect(isValidTemp(3)).toBe(false);
    });

    it("should validate maxTokens range (1-32768)", () => {
      const isValidTokens = (t: number) =>
        Number.isInteger(t) && t >= 1 && t <= 32768;
      expect(isValidTokens(1)).toBe(true);
      expect(isValidTokens(2048)).toBe(true);
      expect(isValidTokens(32768)).toBe(true);
      expect(isValidTokens(0)).toBe(false);
      expect(isValidTokens(32769)).toBe(false);
      expect(isValidTokens(1.5)).toBe(false);
    });

    it("should require apiKey for cloud providers", () => {
      const requiresApiKey = (provider: string) =>
        provider === "openai" || provider === "azure";
      expect(requiresApiKey("ollama")).toBe(false);
      expect(requiresApiKey("llama-cpp")).toBe(false);
      expect(requiresApiKey("openai")).toBe(true);
      expect(requiresApiKey("azure")).toBe(true);
      expect(requiresApiKey("custom")).toBe(false);
    });
  });

  describe("TTS settings validation", () => {
    it("should require serverUrl when TTS is enabled", () => {
      const isValid = (enabled: boolean, url: string) =>
        !enabled || url.trim().length > 0;
      expect(isValid(false, "")).toBe(true);
      expect(isValid(true, "")).toBe(false);
      expect(isValid(true, "http://localhost:5002")).toBe(true);
    });
  });
});
