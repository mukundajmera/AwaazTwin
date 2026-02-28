import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

describe("config", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "config-test-"));
    // Reset module cache so each test gets a fresh singleton
    vi.resetModules();
    // Clear relevant env vars
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("AWAAZTWIN_")) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns built-in defaults when no YAML and no env vars", async () => {
    // Point to a non-existent config file
    process.env.AWAAZTWIN_CONFIG = path.join(tmpDir, "nope.yaml");
    const { getConfig, resetConfig } = await import("@/lib/config");
    resetConfig();
    const cfg = getConfig();

    expect(cfg.env).toBe("local");
    expect(cfg.server.port).toBe(3000);
    expect(cfg.llm.provider).toBe("ollama");
    expect(cfg.llm.baseUrl).toBe("http://localhost:11434");
    expect(cfg.tts.enabled).toBe(false);
  });

  it("merges values from a YAML file", async () => {
    const yamlPath = path.join(tmpDir, "awaaztwin.yaml");
    fs.writeFileSync(
      yamlPath,
      `env: staging\nllm:\n  model: mistral\ntts:\n  enabled: true\n`,
    );
    process.env.AWAAZTWIN_CONFIG = yamlPath;

    const { getConfig, resetConfig } = await import("@/lib/config");
    resetConfig();
    const cfg = getConfig();

    expect(cfg.env).toBe("staging");
    expect(cfg.llm.model).toBe("mistral");
    expect(cfg.llm.provider).toBe("ollama"); // not overridden → default
    expect(cfg.tts.enabled).toBe(true);
  });

  it("environment variables override YAML and defaults", async () => {
    const yamlPath = path.join(tmpDir, "awaaztwin.yaml");
    fs.writeFileSync(yamlPath, `llm:\n  model: mistral\n`);
    process.env.AWAAZTWIN_CONFIG = yamlPath;
    process.env.AWAAZTWIN_LLM_MODEL = "phi3";
    process.env.AWAAZTWIN_TTS_ENABLED = "true";

    const { getConfig, resetConfig } = await import("@/lib/config");
    resetConfig();
    const cfg = getConfig();

    expect(cfg.llm.model).toBe("phi3"); // env wins over YAML
    expect(cfg.tts.enabled).toBe(true); // env wins over default
  });

  it("caches the config as a singleton", async () => {
    process.env.AWAAZTWIN_CONFIG = path.join(tmpDir, "nope.yaml");
    const { getConfig, resetConfig } = await import("@/lib/config");
    resetConfig();

    const a = getConfig();
    const b = getConfig();
    expect(a).toBe(b); // exact same reference
  });

  it("handles malformed YAML gracefully", async () => {
    const yamlPath = path.join(tmpDir, "bad.yaml");
    fs.writeFileSync(yamlPath, `: broken: -\n`);
    process.env.AWAAZTWIN_CONFIG = yamlPath;

    const { getConfig, resetConfig } = await import("@/lib/config");
    resetConfig();
    // Should not throw; falls back to defaults
    const cfg = getConfig();
    expect(cfg.env).toBe("local");
  });
});
