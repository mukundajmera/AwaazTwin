import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/llm/test-connection/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/llm/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/llm/test-connection", () => {
  it("returns 400 when baseUrl is missing", async () => {
    const res = await POST(makeRequest({ model: "llama3.2" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 when model is missing", async () => {
    const res = await POST(makeRequest({ baseUrl: "http://localhost:11434" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns success for valid request", async () => {
    const res = await POST(
      makeRequest({
        baseUrl: "http://localhost:11434",
        model: "llama3.2",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.latencyMs).toBeTypeOf("number");
    expect(json.model).toBe("llama3.2");
  });
});
