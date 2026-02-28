import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/tests/run/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new Request("http://localhost:3000/api/tests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/tests/run", () => {
  it("returns 404 for unknown suite ID", async () => {
    const res = await POST(makeRequest({ suiteId: "nonexistent" }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns completed run for valid suite ID", async () => {
    const res = await POST(makeRequest({ suiteId: "smoke" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("completed");
    expect(json.suiteId).toBe("smoke");
    expect(json.id).toBeDefined();
    expect(json.passed).toBeTypeOf("number");
    expect(json.durationMs).toBeTypeOf("number");
    expect(json.logs).toBeTypeOf("string");
  });
});
