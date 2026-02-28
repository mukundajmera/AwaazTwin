import { describe, it, expect } from "vitest";
import {
  practiceTemplates,
  getPracticeTemplateById,
} from "@/lib/practice-templates";

describe("practice-templates", () => {
  it("contains exactly 3 templates", () => {
    expect(practiceTemplates).toHaveLength(3);
  });

  it("each template has a unique id", () => {
    const ids = practiceTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each template has required fields", () => {
    for (const t of practiceTemplates) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(["beginner", "intermediate", "advanced"]).toContain(t.difficulty);
      expect(t.summary).toBeTruthy();
      expect(t.phases.length).toBeGreaterThan(0);
      expect(t.rubric.length).toBeGreaterThan(0);
    }
  });

  it("each phase has valid duration", () => {
    for (const t of practiceTemplates) {
      for (const phase of t.phases) {
        expect(phase.id).toBeTruthy();
        expect(phase.name).toBeTruthy();
        expect(phase.durationMinutes).toBeGreaterThan(0);
      }
    }
  });

  it("each rubric item has a valid maxScore", () => {
    for (const t of practiceTemplates) {
      for (const item of t.rubric) {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.maxScore).toBeGreaterThan(0);
      }
    }
  });

  describe("getPracticeTemplateById", () => {
    it("returns template for valid id", () => {
      const result = getPracticeTemplateById("basic-voice-clone");
      expect(result).toBeDefined();
      expect(result!.id).toBe("basic-voice-clone");
      expect(result!.title).toBe("Basic Voice Clone Pipeline");
    });

    it("returns undefined for unknown id", () => {
      const result = getPracticeTemplateById("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  it("covers all three categories", () => {
    const categories = new Set(practiceTemplates.map((t) => t.category));
    expect(categories).toContain("voice-cloning");
    expect(categories).toContain("tts-pipeline");
    expect(categories).toContain("architecture");
  });
});
