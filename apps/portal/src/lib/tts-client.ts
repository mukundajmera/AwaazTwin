/**
 * TTS client abstraction for Coqui TTS (XTTS / Bark) HTTP service.
 *
 * The service is expected to be a running Docker container (or any
 * compatible HTTP server) exposing at a minimum:
 *
 *   GET  /                       → health / version info
 *   POST /api/tts                → text-to-speech (returns audio bytes)
 *   POST /api/tts/clone          → register a cloned voice from a sample
 *   GET  /api/tts/speakers       → list registered speakers
 *
 * All operations are opt-in and degrade gracefully on CPU (may be slow).
 */

export interface TTSRequestOptions {
  serverUrl: string;
}

export interface TTSSpeakRequest {
  text: string;
  speakerId?: string;
  language?: string;
}

export interface TTSSpeakResult {
  /** Base-64 encoded WAV audio */
  audioBase64: string;
  contentType: string;
  durationMs: number;
}

export interface TTSCloneRequest {
  /** Base-64 encoded audio sample */
  audioBase64: string;
  voiceName: string;
  language?: string;
}

export interface TTSCloneResult {
  speakerId: string;
  voiceName: string;
  message: string;
}

export interface TTSSpeaker {
  speakerId: string;
  name: string;
}

export interface TTSTestResult {
  status: "ok" | "error";
  latencyMs: number;
  serverUrl: string;
  availableModels: string[];
  message: string;
}

/** Remove trailing slashes from a URL. */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Test connectivity to the TTS server.
 */
export async function testTTSConnection(
  opts: TTSRequestOptions,
): Promise<TTSTestResult> {
  const base = normalizeUrl(opts.serverUrl);
  const start = Date.now();

  try {
    // Try the root endpoint for a basic health-check
    const res = await fetch(base, {
      method: "GET",
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`TTS server returned ${res.status}: ${res.statusText}`);
    }

    const latencyMs = Date.now() - start;

    // Attempt to get available speakers/models
    let availableModels: string[] = [];
    try {
      const speakersRes = await fetch(`${base}/api/tts/speakers`, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
      });
      if (speakersRes.ok) {
        const speakers = await speakersRes.json();
        if (Array.isArray(speakers)) {
          availableModels = speakers.map(
            (s: { name?: string }) => s.name ?? "unknown",
          );
        }
      }
    } catch {
      // Speakers endpoint may not exist – that's fine
    }

    return {
      status: "ok",
      latencyMs,
      serverUrl: opts.serverUrl,
      availableModels:
        availableModels.length > 0 ? availableModels : ["xtts_v2", "bark"],
      message: `TTS server connected in ${latencyMs}ms`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message =
      err instanceof Error
        ? err.message
        : "Unknown error connecting to TTS server";
    return {
      status: "error",
      latencyMs,
      serverUrl: opts.serverUrl,
      availableModels: [],
      message,
    };
  }
}

/**
 * Generate speech from text via the Coqui TTS HTTP API.
 */
export async function speak(
  req: TTSSpeakRequest,
  opts: TTSRequestOptions,
): Promise<TTSSpeakResult> {
  const base = normalizeUrl(opts.serverUrl);
  const start = Date.now();

  const body: Record<string, unknown> = {
    text: req.text,
    language: req.language ?? "en",
  };
  if (req.speakerId) {
    body.speaker_id = req.speakerId;
  }

  const res = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // TTS can be slow on CPU
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TTS speak failed (${res.status}): ${text || res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = res.headers.get("content-type") ?? "audio/wav";
  const durationMs = Date.now() - start;

  return { audioBase64, contentType, durationMs };
}

/**
 * Register a cloned voice from an uploaded audio sample.
 */
export async function cloneVoice(
  req: TTSCloneRequest,
  opts: TTSRequestOptions,
): Promise<TTSCloneResult> {
  const base = normalizeUrl(opts.serverUrl);

  const body = {
    audio_base64: req.audioBase64,
    voice_name: req.voiceName,
    language: req.language ?? "en",
  };

  const res = await fetch(`${base}/api/tts/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Voice cloning failed (${res.status}): ${text || res.statusText}`,
    );
  }

  const data = await res.json();
  const speakerId = data.speaker_id ?? data.speakerId;
  if (!speakerId || typeof speakerId !== "string") {
    throw new Error(
      "Voice cloning failed: missing speaker id in successful response",
    );
  }
  return {
    speakerId,
    voiceName: req.voiceName,
    message: data.message ?? "Voice registered successfully",
  };
}
