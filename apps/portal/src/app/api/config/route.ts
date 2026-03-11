import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

/**
 * GET /api/config
 *
 * Returns the effective (non-secret) AwaazTwin configuration so the
 * Settings UI can pre-populate fields from centralized config
 * (awaaztwin.yaml + AWAAZTWIN_* env vars).
 *
 * API keys are never exposed.
 */
export async function GET() {
  const cfg = getConfig();

  return NextResponse.json({
    env: cfg.env,
    server: {
      host: cfg.server.host,
      port: cfg.server.port,
      baseUrl: cfg.server.baseUrl,
    },
    llm: {
      provider: cfg.llm.provider,
      baseUrl: cfg.llm.baseUrl,
      model: cfg.llm.model,
      maxTokens: cfg.llm.maxTokens,
      temperature: cfg.llm.temperature,
      // apiKey intentionally omitted
    },
    tts: {
      serverUrl: cfg.tts.serverUrl,
      enabled: cfg.tts.enabled,
    },
    limits: cfg.limits,
  });
}
