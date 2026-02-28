import { describe, it, expect } from "vitest";
import { testSuites } from "@/lib/test-suites";

describe("test-suites", () => {
  it("exports a non-empty array of test suite definitions", () => {
    expect(Array.isArray(testSuites)).toBe(true);
    expect(testSuites.length).toBeGreaterThan(0);
  });

  it("each suite has required fields", () => {
    for (const suite of testSuites) {
      expect(suite.id).toBeTruthy();
      expect(suite.name).toBeTruthy();
      expect(suite.description).toBeTruthy();
      expect(suite.command).toBeTruthy();
      expect(suite.estimatedDuration).toBeTruthy();
      expect(typeof suite.requiresExternalServices).toBe("boolean");
    }
  });

  it("each suite has a unique id", () => {
    const ids = testSuites.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
