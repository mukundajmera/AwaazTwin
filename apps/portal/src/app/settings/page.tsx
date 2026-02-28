"use client";

import { useState } from "react";
import {
  type Provider,
  isBaseUrlValid,
  isModelValid,
  requiresApiKey,
} from "@/lib/validation";

type ConnectionStatus =
  | { state: "idle" }
  | { state: "testing" }
  | { state: "success"; latencyMs: number }
  | { state: "error"; message: string };

export default function SettingsPage() {
  // LLM state
  const [provider, setProvider] = useState<Provider>("ollama");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [llmStatus, setLlmStatus] = useState<ConnectionStatus>({ state: "idle" });

  // TTS state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [ttsStatus, setTtsStatus] = useState<ConnectionStatus>({ state: "idle" });

  const showApiKey = requiresApiKey(provider);

  async function testLlmConnection() {
    if (!isBaseUrlValid(baseUrl)) {
      setLlmStatus({ state: "error", message: "Base URL is required" });
      return;
    }
    if (!isModelValid(model)) {
      setLlmStatus({ state: "error", message: "Model name is required" });
      return;
    }

    setLlmStatus({ state: "testing" });
    try {
      const res = await fetch("/api/llm/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, baseUrl, model, apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setLlmStatus({ state: "success", latencyMs: data.latencyMs ?? 0 });
      } else {
        setLlmStatus({ state: "error", message: data.error ?? "Connection failed" });
      }
    } catch (err) {
      setLlmStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  async function testTtsConnection() {
    if (!serverUrl.trim()) {
      setTtsStatus({ state: "error", message: "Server URL is required" });
      return;
    }

    setTtsStatus({ state: "testing" });
    try {
      const res = await fetch("/api/tts/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTtsStatus({ state: "success", latencyMs: data.latencyMs ?? 0 });
      } else {
        setTtsStatus({ state: "error", message: data.error ?? "Connection failed" });
      }
    } catch (err) {
      setTtsStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <div data-testid="settings-page" className="max-w-3xl mx-auto py-8 px-4 space-y-10">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* LLM Configuration */}
      <section data-testid="llm-settings" className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">LLM Configuration</h2>

        <div>
          <label htmlFor="llm-provider" className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            id="llm-provider"
            data-testid="llm-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="ollama">Ollama</option>
            <option value="llama-cpp">llama.cpp</option>
            <option value="openai">OpenAI</option>
            <option value="azure">Azure</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label htmlFor="llm-base-url" className="block text-sm font-medium text-gray-700 mb-1">
            Base URL
          </label>
          <input
            id="llm-base-url"
            data-testid="llm-base-url"
            type="text"
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="llm-model" className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            id="llm-model"
            data-testid="llm-model"
            type="text"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama3.2"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {showApiKey && (
          <div>
            <label htmlFor="llm-api-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="llm-api-key"
              data-testid="llm-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Advanced Options */}
        <div className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {advancedOpen ? "▾ Advanced Options" : "▸ Advanced Options"}
          </button>

          {advancedOpen && (
            <div className="mt-3 space-y-3 pl-2">
              <div>
                <label htmlFor="llm-max-tokens" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  id="llm-max-tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min={1}
                  max={32768}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="llm-temperature" className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  id="llm-temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-testid="llm-test-connection"
            onClick={testLlmConnection}
            disabled={llmStatus.state === "testing"}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {llmStatus.state === "testing" ? "Testing…" : "Test Connection"}
          </button>
          <ConnectionStatusDisplay status={llmStatus} testId="llm-connection-status" />
        </div>
      </section>

      {/* TTS Configuration */}
      <section data-testid="tts-settings" className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">TTS Configuration</h2>

        <div className="flex items-center gap-2">
          <input
            id="tts-enabled"
            data-testid="tts-enabled"
            type="checkbox"
            checked={ttsEnabled}
            onChange={(e) => setTtsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="tts-enabled" className="text-sm font-medium text-gray-700">
            Enable TTS
          </label>
        </div>

        <div>
          <label htmlFor="tts-server-url" className="block text-sm font-medium text-gray-700 mb-1">
            Server URL
          </label>
          <input
            id="tts-server-url"
            data-testid="tts-server-url"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:5002"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* TODO: Wire up voice sample upload to backend */}
        <div>
          <label htmlFor="tts-voice-sample" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Voice Sample
          </label>
          <input
            id="tts-voice-sample"
            type="file"
            accept="audio/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-testid="tts-test-connection"
            onClick={testTtsConnection}
            disabled={ttsStatus.state === "testing"}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {ttsStatus.state === "testing" ? "Testing…" : "Test Connection"}
          </button>
          <ConnectionStatusDisplay status={ttsStatus} testId="tts-connection-status" />
        </div>
      </section>
    </div>
  );
}

function ConnectionStatusDisplay({
  status,
  testId,
}: {
  status: ConnectionStatus;
  testId: string;
}) {
  if (status.state === "idle") {
    return <span data-testid={testId} className="text-sm text-gray-400" />;
  }
  if (status.state === "testing") {
    return (
      <span data-testid={testId} className="text-sm text-blue-600 animate-pulse">
        ⏳ Testing…
      </span>
    );
  }
  if (status.state === "success") {
    return (
      <span data-testid={testId} className="text-sm text-green-600">
        ✅ Connected ({status.latencyMs}ms)
      </span>
    );
  }
  return (
    <span data-testid={testId} className="text-sm text-red-600">
      ❌ {status.message}
    </span>
  );
}
