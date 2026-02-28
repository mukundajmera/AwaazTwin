import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateServerUrl,
  isValidProvider,
  isValidChatRole,
  MAX_AUDIO_BASE64_LENGTH,
  MAX_TTS_TEXT_LENGTH,
} from "@/lib/url-validation";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("url-validation", () => {
  describe("validateServerUrl", () => {
    it("accepts valid http URL in development", () => {
      expect(validateServerUrl("http://localhost:11434")).toBeNull();
    });

    it("accepts valid https URL", () => {
      expect(validateServerUrl("https://api.example.com")).toBeNull();
    });

    it("rejects invalid URLs", () => {
      expect(validateServerUrl("not-a-url")).toBeTruthy();
    });

    it("rejects non-http/https schemes", () => {
      expect(validateServerUrl("ftp://example.com")).toBeTruthy();
      expect(validateServerUrl("file:///etc/passwd")).toBeTruthy();
    });

    it("allows localhost in non-production", () => {
      expect(validateServerUrl("http://localhost:5002")).toBeNull();
      expect(validateServerUrl("http://127.0.0.1:11434")).toBeNull();
    });

    it("blocks localhost in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(validateServerUrl("http://localhost:5002")).toBeTruthy();
      expect(validateServerUrl("http://127.0.0.1:11434")).toBeTruthy();
    });

    it("blocks private IPs in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(validateServerUrl("http://10.0.0.1:8080")).toBeTruthy();
      expect(validateServerUrl("http://192.168.1.1:8080")).toBeTruthy();
      expect(validateServerUrl("http://172.16.0.1:8080")).toBeTruthy();
    });
  });

  describe("isValidProvider", () => {
    it("accepts supported providers", () => {
      expect(isValidProvider("ollama")).toBe(true);
      expect(isValidProvider("llama-cpp")).toBe(true);
      expect(isValidProvider("openai")).toBe(true);
      expect(isValidProvider("azure")).toBe(true);
      expect(isValidProvider("custom")).toBe(true);
    });

    it("rejects unsupported providers", () => {
      expect(isValidProvider("unknown")).toBe(false);
      expect(isValidProvider("")).toBe(false);
    });
  });

  describe("isValidChatRole", () => {
    it("accepts valid roles", () => {
      expect(isValidChatRole("system")).toBe(true);
      expect(isValidChatRole("user")).toBe(true);
      expect(isValidChatRole("assistant")).toBe(true);
    });

    it("rejects invalid roles", () => {
      expect(isValidChatRole("admin")).toBe(false);
      expect(isValidChatRole("")).toBe(false);
    });
  });

  describe("constants", () => {
    it("has reasonable limits", () => {
      expect(MAX_AUDIO_BASE64_LENGTH).toBeGreaterThan(0);
      expect(MAX_TTS_TEXT_LENGTH).toBeGreaterThan(0);
    });
  });
});
