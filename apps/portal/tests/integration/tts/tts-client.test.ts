/**
 * TTS integration tests.
 *
 * These tests call actual TTS endpoints when available.
 * If no TTS server is running they are expected to report clear
 * errors rather than crash.  Set TTS_SERVER_URL env var to target
 * a running Coqui TTS instance.
 */
import { describe, it, expect } from "vitest";
import { testTTSConnection, speak, type TTSRequestOptions } from "@/lib/tts-client";

const TTS_SERVER_URL = process.env.TTS_SERVER_URL ?? "http://localhost:5002";

const opts: TTSRequestOptions = {
  serverUrl: TTS_SERVER_URL,
};

describe("TTS integration", () => {
  it("testTTSConnection returns ok or error without crashing", async () => {
    const result = await testTTSConnection(opts);
    expect(result).toHaveProperty("status");
    expect(["ok", "error"]).toContain(result.status);
    expect(result).toHaveProperty("latencyMs");
    expect(typeof result.latencyMs).toBe("number");
    expect(result).toHaveProperty("message");
  });

  it("speak returns audio or fails gracefully", async () => {
    try {
      const result = await speak(
        { text: "Hello world", language: "en" },
        opts,
      );
      expect(result).toHaveProperty("audioBase64");
      expect(typeof result.audioBase64).toBe("string");
      expect(result).toHaveProperty("contentType");
    } catch (err) {
      // If server is not running, the error should be informative
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });

  it("handles invalid server URL gracefully", async () => {
    const result = await testTTSConnection({
      serverUrl: "http://127.0.0.1:1",
    });
    expect(result.status).toBe("error");
    expect(result.message).toBeTruthy();
  });
});
