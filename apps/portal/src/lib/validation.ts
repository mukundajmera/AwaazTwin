export type Provider = "ollama" | "llama-cpp" | "openai" | "azure" | "custom";

export function isBaseUrlValid(url: string): boolean {
  return url.trim().length > 0;
}

export function isModelValid(model: string): boolean {
  return model.trim().length > 0;
}

export function isTemperatureValid(t: number): boolean {
  return typeof t === "number" && !isNaN(t) && t >= 0 && t <= 2;
}

export function isMaxTokensValid(t: number): boolean {
  return Number.isInteger(t) && t >= 1 && t <= 32768;
}

export function requiresApiKey(provider: Provider): boolean {
  return provider === "openai" || provider === "azure";
}

export function isTtsConfigValid(enabled: boolean, serverUrl: string): boolean {
  return !enabled || serverUrl.trim().length > 0;
}
