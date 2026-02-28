import { describe, it, expect, vi, beforeEach } from "vitest";
import { testTTSConnection, speak, cloneVoice } from "@/lib/tts-client";

const defaultOpts = { serverUrl: "http://localhost:5002" };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("tts-client", () => {
  describe("testTTSConnection", () => {
    it("returns ok when server responds", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response("OK", { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([{ name: "default" }]), { status: 200 })
        );

      const result = await testTTSConnection(defaultOpts);
      expect(result.status).toBe("ok");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.availableModels).toContain("default");
    });

    it("returns ok with fallback models when speakers endpoint fails", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response("OK", { status: 200 })
        )
        .mockRejectedValueOnce(new Error("Not found"));

      const result = await testTTSConnection(defaultOpts);
      expect(result.status).toBe("ok");
      expect(result.availableModels).toContain("xtts_v2");
    });

    it("returns error when server is unreachable", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("Connection refused")
      );

      const result = await testTTSConnection(defaultOpts);
      expect(result.status).toBe("error");
      expect(result.message).toContain("Connection refused");
    });

    it("returns error when server returns non-200", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Internal error", { status: 500, statusText: "Internal Server Error" })
      );

      const result = await testTTSConnection(defaultOpts);
      expect(result.status).toBe("error");
      expect(result.message).toContain("500");
    });
  });

  describe("speak", () => {
    it("returns audio on success", async () => {
      const audioBuf = Buffer.from("fake-audio-data");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(audioBuf, {
          status: 200,
          headers: { "content-type": "audio/wav" },
        })
      );

      const result = await speak(
        { text: "Hello", language: "en" },
        defaultOpts
      );

      expect(result.audioBase64).toBe(audioBuf.toString("base64"));
      expect(result.contentType).toBe("audio/wav");
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("throws on HTTP error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Error", { status: 500 })
      );

      await expect(
        speak({ text: "Hello" }, defaultOpts)
      ).rejects.toThrow(/TTS speak failed/);
    });
  });

  describe("cloneVoice", () => {
    it("returns speaker ID on success", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            speaker_id: "spk_123",
            message: "Voice registered",
          }),
          { status: 200 }
        )
      );

      const result = await cloneVoice(
        { audioBase64: "base64data", voiceName: "test-voice" },
        defaultOpts
      );

      expect(result.speakerId).toBe("spk_123");
      expect(result.voiceName).toBe("test-voice");
    });

    it("throws on HTTP error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Error", { status: 500 })
      );

      await expect(
        cloneVoice(
          { audioBase64: "data", voiceName: "test" },
          defaultOpts
        )
      ).rejects.toThrow(/Voice cloning failed/);
    });
  });
});
