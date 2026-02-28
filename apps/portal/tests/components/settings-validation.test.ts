import { describe, it, expect } from "vitest";
import {
  isBaseUrlValid,
  isModelValid,
  isTemperatureValid,
  isMaxTokensValid,
  requiresApiKey,
  isTtsConfigValid,
} from "@/lib/validation";

describe("Settings validation", () => {
  describe("LLM settings validation", () => {
    it("should require baseUrl to be non-empty", () => {
      expect(isBaseUrlValid("")).toBe(false);
      expect(isBaseUrlValid("   ")).toBe(false);
      expect(isBaseUrlValid("http://localhost:11434")).toBe(true);
    });

    it("should require model to be non-empty", () => {
      expect(isModelValid("")).toBe(false);
      expect(isModelValid("   ")).toBe(false);
      expect(isModelValid("llama3.2")).toBe(true);
    });

    it("should validate temperature range (0-2)", () => {
      expect(isTemperatureValid(0)).toBe(true);
      expect(isTemperatureValid(0.7)).toBe(true);
      expect(isTemperatureValid(2)).toBe(true);
      expect(isTemperatureValid(-1)).toBe(false);
      expect(isTemperatureValid(3)).toBe(false);
      expect(isTemperatureValid(NaN)).toBe(false);
    });

    it("should validate maxTokens range (1-32768)", () => {
      expect(isMaxTokensValid(1)).toBe(true);
      expect(isMaxTokensValid(2048)).toBe(true);
      expect(isMaxTokensValid(32768)).toBe(true);
      expect(isMaxTokensValid(0)).toBe(false);
      expect(isMaxTokensValid(32769)).toBe(false);
      expect(isMaxTokensValid(1.5)).toBe(false);
    });

    it("should require apiKey for cloud providers", () => {
      expect(requiresApiKey("ollama")).toBe(false);
      expect(requiresApiKey("llama-cpp")).toBe(false);
      expect(requiresApiKey("openai")).toBe(true);
      expect(requiresApiKey("azure")).toBe(true);
      expect(requiresApiKey("custom")).toBe(false);
    });
  });

  describe("TTS settings validation", () => {
    it("should require serverUrl when TTS is enabled", () => {
      expect(isTtsConfigValid(false, "")).toBe(true);
      expect(isTtsConfigValid(true, "")).toBe(false);
      expect(isTtsConfigValid(true, "http://localhost:5002")).toBe(true);
    });
  });
});
