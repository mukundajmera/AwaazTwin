import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/tts/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

// Mock the tts-client module
vi.mock("@/lib/tts-client", () => ({
  testTTSConnection: vi.fn(),
}));

import { testTTSConnection } from "@/lib/tts-client";
import { POST } from "@/app/api/tts/test-connection/route";

const mockedTestTTS = vi.mocked(testTTSConnection);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/tts/test-connection", () => {
  it("returns 400 when serverUrl is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns success for valid request", async () => {
    mockedTestTTS.mockResolvedValueOnce({
      status: "ok",
      latencyMs: 85,
      serverUrl: "http://localhost:5002",
      availableModels: ["xtts_v2", "bark"],
      message: "Connected",
    });

    const res = await POST(
      makeRequest({ serverUrl: "http://localhost:5002" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.latencyMs).toBeTypeOf("number");
    expect(json.serverUrl).toBe("http://localhost:5002");
    expect(Array.isArray(json.availableModels)).toBe(true);
  });
});
