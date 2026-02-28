import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { getAllTopics, getTopicBySlug } from "@/lib/content";

describe("content", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "content-test-"));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getAllTopics", () => {
    it("returns empty array when content directory does not exist", () => {
      const topics = getAllTopics();
      expect(topics).toEqual([]);
    });

    it("returns topics from MDX files with frontmatter", () => {
      const sectionDir = path.join(tmpDir, "content", "guides");
      fs.mkdirSync(sectionDir, { recursive: true });
      fs.writeFileSync(
        path.join(sectionDir, "getting-started.mdx"),
        `---
title: Getting Started
summary: A beginner guide
difficulty: beginner
tags:
  - intro
---
# Hello`
      );

      const topics = getAllTopics();
      expect(topics).toHaveLength(1);
      expect(topics[0].slug).toBe("guides/getting-started");
      expect(topics[0].title).toBe("Getting Started");
      expect(topics[0].section).toBe("guides");
      expect(topics[0].summary).toBe("A beginner guide");
      expect(topics[0].difficulty).toBe("beginner");
      expect(topics[0].tags).toEqual(["intro"]);
    });

    it("uses slug as title when frontmatter title is missing", () => {
      const sectionDir = path.join(tmpDir, "content", "tts");
      fs.mkdirSync(sectionDir, { recursive: true });
      fs.writeFileSync(path.join(sectionDir, "overview.md"), "# Overview");

      const topics = getAllTopics();
      expect(topics).toHaveLength(1);
      expect(topics[0].title).toBe("tts/overview");
    });

    it("handles multiple sections and files", () => {
      for (const section of ["guides", "models"]) {
        const dir = path.join(tmpDir, "content", section);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, "topic-a.mdx"),
          "---\ntitle: A\n---\n# A"
        );
        fs.writeFileSync(
          path.join(dir, "topic-b.md"),
          "---\ntitle: B\n---\n# B"
        );
      }

      const topics = getAllTopics();
      expect(topics).toHaveLength(4);
    });
  });

  describe("getTopicBySlug", () => {
    it("returns null for non-existent slug", async () => {
      fs.mkdirSync(path.join(tmpDir, "content"), { recursive: true });
      const result = await getTopicBySlug("guides/nonexistent");
      expect(result).toBeNull();
    });

    it("reads .mdx file and returns topic with rendered HTML", async () => {
      const dir = path.join(tmpDir, "content", "guides");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "intro.mdx"),
        `---
title: Intro Guide
summary: Introduction
---
# Welcome

Hello **world**`
      );

      const result = await getTopicBySlug("guides/intro");
      expect(result).not.toBeNull();
      expect(result!.topic.title).toBe("Intro Guide");
      expect(result!.topic.section).toBe("guides");
      expect(result!.content).toContain("<h1>Welcome</h1>");
      expect(result!.content).toContain("<strong>world</strong>");
    });

    it("falls back to .md when .mdx does not exist", async () => {
      const dir = path.join(tmpDir, "content", "reference");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "api.md"),
        "---\ntitle: API Ref\n---\n# API"
      );

      const result = await getTopicBySlug("reference/api");
      expect(result).not.toBeNull();
      expect(result!.topic.title).toBe("API Ref");
    });

    it("prefers .mdx over .md when both exist", async () => {
      const dir = path.join(tmpDir, "content", "guides");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "dual.mdx"),
        "---\ntitle: MDX Version\n---\n# MDX"
      );
      fs.writeFileSync(
        path.join(dir, "dual.md"),
        "---\ntitle: MD Version\n---\n# MD"
      );

      const result = await getTopicBySlug("guides/dual");
      expect(result).not.toBeNull();
      expect(result!.topic.title).toBe("MDX Version");
    });
  });
});
