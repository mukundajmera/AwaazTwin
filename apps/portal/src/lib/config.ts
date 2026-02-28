/**
 * Centralised configuration loader for AwaazTwin.
 *
 * Load order (later sources win):
 *   1. Built-in defaults
 *   2. awaaztwin.yaml (path from AWAAZTWIN_CONFIG env, or ./awaaztwin.yaml)
 *   3. Environment variables (AWAAZTWIN_*)
 *
 * The module exposes a singleton via `getConfig()`.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";

// ── Config types ─────────────────────────────────────────────────────

export interface ServerConfig {
  host: string;
  port: number;
  baseUrl: string;
}

export interface LLMConfig {
  provider: "ollama" | "llama-cpp" | "openai" | "azure" | "custom";
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
}

export interface TTSConfig {
  serverUrl: string;
  enabled: boolean;
}

export interface LimitsConfig {
  maxJobsPerMinute: number;
  maxAudioMinutesPerMonth: number;
}

export interface AwaazTwinConfig {
  env: string;
  server: ServerConfig;
  llm: LLMConfig;
  tts: TTSConfig;
  limits: LimitsConfig;
}

// ── Defaults ─────────────────────────────────────────────────────────

const DEFAULTS: AwaazTwinConfig = {
  env: "local",
  server: {
    host: "0.0.0.0",
    port: 3000,
    baseUrl: "http://localhost:3000",
  },
  llm: {
    provider: "ollama",
    baseUrl: "http://localhost:11434",
    model: "llama3.2",
    maxTokens: 2048,
    temperature: 0.7,
  },
  tts: {
    serverUrl: "http://localhost:5002",
    enabled: false,
  },
  limits: {
    maxJobsPerMinute: 30,
    maxAudioMinutesPerMonth: 200,
  },
};

// ── Loader helpers ───────────────────────────────────────────────────

function loadYaml(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = parseYaml(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    console.warn(`[config] Failed to parse ${filePath}; using defaults.`);
    return {};
  }
}

/**
 * Deep-merge `source` into `target` (non-destructive).
 * Only merges plain objects; arrays and primitives are overwritten.
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (
      typeof srcVal === "object" &&
      srcVal !== null &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === "object" &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      result[key] = srcVal;
    }
  }
  return result as T;
}

/**
 * Apply AWAAZTWIN_* environment variable overrides.
 *
 * Mapping (env var → config key):
 *   AWAAZTWIN_ENV                → env
 *   AWAAZTWIN_SERVER_HOST        → server.host
 *   AWAAZTWIN_SERVER_PORT        → server.port
 *   AWAAZTWIN_SERVER_BASE_URL    → server.baseUrl
 *   AWAAZTWIN_LLM_PROVIDER      → llm.provider
 *   AWAAZTWIN_LLM_BASE_URL      → llm.baseUrl
 *   AWAAZTWIN_LLM_MODEL         → llm.model
 *   AWAAZTWIN_LLM_API_KEY       → llm.apiKey
 *   AWAAZTWIN_LLM_MAX_TOKENS    → llm.maxTokens
 *   AWAAZTWIN_LLM_TEMPERATURE   → llm.temperature
 *   AWAAZTWIN_TTS_SERVER_URL    → tts.serverUrl
 *   AWAAZTWIN_TTS_ENABLED       → tts.enabled
 */
function applyEnvOverrides(cfg: AwaazTwinConfig): AwaazTwinConfig {
  const e = process.env;

  if (e.AWAAZTWIN_ENV) cfg.env = e.AWAAZTWIN_ENV;

  if (e.AWAAZTWIN_SERVER_HOST) cfg.server.host = e.AWAAZTWIN_SERVER_HOST;
  if (e.AWAAZTWIN_SERVER_PORT)
    cfg.server.port = parseInt(e.AWAAZTWIN_SERVER_PORT, 10) || cfg.server.port;
  if (e.AWAAZTWIN_SERVER_BASE_URL)
    cfg.server.baseUrl = e.AWAAZTWIN_SERVER_BASE_URL;

  if (e.AWAAZTWIN_LLM_PROVIDER)
    cfg.llm.provider = e.AWAAZTWIN_LLM_PROVIDER as LLMConfig["provider"];
  if (e.AWAAZTWIN_LLM_BASE_URL) cfg.llm.baseUrl = e.AWAAZTWIN_LLM_BASE_URL;
  if (e.AWAAZTWIN_LLM_MODEL) cfg.llm.model = e.AWAAZTWIN_LLM_MODEL;
  if (e.AWAAZTWIN_LLM_API_KEY) cfg.llm.apiKey = e.AWAAZTWIN_LLM_API_KEY;
  if (e.AWAAZTWIN_LLM_MAX_TOKENS)
    cfg.llm.maxTokens =
      parseInt(e.AWAAZTWIN_LLM_MAX_TOKENS, 10) || cfg.llm.maxTokens;
  if (e.AWAAZTWIN_LLM_TEMPERATURE)
    cfg.llm.temperature =
      parseFloat(e.AWAAZTWIN_LLM_TEMPERATURE) ?? cfg.llm.temperature;

  if (e.AWAAZTWIN_TTS_SERVER_URL)
    cfg.tts.serverUrl = e.AWAAZTWIN_TTS_SERVER_URL;
  if (e.AWAAZTWIN_TTS_ENABLED)
    cfg.tts.enabled = e.AWAAZTWIN_TTS_ENABLED === "true";

  return cfg;
}

// ── Singleton ────────────────────────────────────────────────────────

let _config: AwaazTwinConfig | null = null;

/**
 * Load and return the singleton config.
 * Safe to call multiple times; only loads from disk on first invocation.
 */
export function getConfig(): AwaazTwinConfig {
  if (_config) return _config;

  const configPath = resolve(
    process.env.AWAAZTWIN_CONFIG ?? "./awaaztwin.yaml",
  );
  const yamlOverrides = loadYaml(configPath);

  // 1. Start with defaults
  // 2. Merge YAML on top
  // 3. Env vars win last
  let cfg = deepMerge(
    structuredClone(DEFAULTS) as unknown as Record<string, unknown>,
    yamlOverrides,
  ) as unknown as AwaazTwinConfig;
  cfg = applyEnvOverrides(cfg);

  _config = cfg;
  return _config;
}

/** Reset the cached config – useful in tests. */
export function resetConfig(): void {
  _config = null;
}
