/**
 * Shared URL validation utilities for server-side route handlers.
 *
 * Provides SSRF protection by validating and restricting URLs
 * accepted from request bodies before making server-side fetches.
 */

const VALID_PROVIDERS = new Set([
  "ollama",
  "llama-cpp",
  "openai",
  "azure",
  "custom",
]);

const VALID_CHAT_ROLES = new Set(["system", "user", "assistant"]);

/** Comma-separated string of valid providers for error messages. */
export const VALID_PROVIDERS_LIST = [...VALID_PROVIDERS].join(", ");

/** Comma-separated string of valid chat roles for error messages. */
export const VALID_CHAT_ROLES_LIST = [...VALID_CHAT_ROLES].join(", ");

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
]);

const IPV4_PRIVATE_PATTERN =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})$/;

/**
 * Validate that a URL is safe for server-side fetching.
 *
 * In development (`NODE_ENV !== "production"`), localhost and private
 * IPs are allowed since LLM/TTS backends typically run locally.
 * In production, they are blocked to prevent SSRF attacks.
 *
 * Returns an error string if validation fails, or null if the URL is acceptable.
 */
export function validateServerUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "URL is not valid";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "URL must use http or https";
  }

  // In production, block private/loopback addresses
  if (process.env.NODE_ENV === "production") {
    const hostname = parsed.hostname;

    if (DISALLOWED_HOSTNAMES.has(hostname)) {
      return "URL host is not allowed in production";
    }

    if (IPV4_PRIVATE_PATTERN.test(hostname)) {
      return "URL host is not allowed in production (private IP range)";
    }
  }

  return null;
}

/**
 * Validate that a provider string is one of the supported LLM providers.
 */
export function isValidProvider(provider: string): boolean {
  return VALID_PROVIDERS.has(provider);
}

/**
 * Validate that a chat message role is valid.
 */
export function isValidChatRole(role: string): boolean {
  return VALID_CHAT_ROLES.has(role);
}

/** Maximum base64-encoded audio payload size (~10 MiB). */
export const MAX_AUDIO_BASE64_LENGTH = 10 * 1024 * 1024;

/** Maximum text length for TTS speak requests. */
export const MAX_TTS_TEXT_LENGTH = 10_000;
