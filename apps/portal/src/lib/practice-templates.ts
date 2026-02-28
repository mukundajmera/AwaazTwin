import { PracticeTemplate } from "./types";

export const practiceTemplates: PracticeTemplate[] = [
  {
    id: "basic-voice-clone",
    title: "Basic Voice Clone Pipeline",
    category: "voice-cloning",
    difficulty: "beginner",
    summary:
      "Design a voice cloning pipeline from audio input to generated speech output. Cover recording, preprocessing, model selection, and synthesis.",
    phases: [
      {
        id: "clarify",
        name: "Clarify Requirements",
        description:
          "Identify the use case, target quality, latency expectations, and hardware constraints.",
        durationMinutes: 3,
      },
      {
        id: "high-level",
        name: "High-Level Design",
        description:
          "Outline the end-to-end pipeline: audio capture → preprocessing → model inference → output playback.",
        durationMinutes: 5,
      },
      {
        id: "deep-dive",
        name: "Deep Dive",
        description:
          "Discuss model choice (XTTS v2 vs Bark), preprocessing (noise reduction, normalization), and CPU vs GPU trade-offs.",
        durationMinutes: 7,
      },
      {
        id: "trade-offs",
        name: "Trade-offs & Pitfalls",
        description:
          "Address quality vs latency, short vs long reference clips, and handling noisy input audio.",
        durationMinutes: 3,
      },
      {
        id: "wrap-up",
        name: "Wrap Up",
        description:
          "Summarize the design, note areas for improvement, and identify follow-up topics.",
        durationMinutes: 2,
      },
    ],
    rubric: [
      {
        id: "requirements",
        label: "Requirements Gathering",
        description: "Identified key constraints and use case clearly",
        maxScore: 5,
      },
      {
        id: "pipeline-design",
        label: "Pipeline Design",
        description: "End-to-end flow is logical and complete",
        maxScore: 5,
      },
      {
        id: "model-knowledge",
        label: "Model Knowledge",
        description: "Demonstrated understanding of voice cloning models",
        maxScore: 5,
      },
      {
        id: "trade-offs",
        label: "Trade-off Analysis",
        description: "Discussed realistic trade-offs and mitigations",
        maxScore: 5,
      },
    ],
  },
  {
    id: "tts-pipeline-design",
    title: "TTS Service Architecture",
    category: "tts-pipeline",
    difficulty: "intermediate",
    summary:
      "Design a scalable text-to-speech service that handles multiple voices, supports streaming output, and runs on CPU hardware.",
    phases: [
      {
        id: "clarify",
        name: "Clarify Requirements",
        description:
          "Define throughput targets, voice count, latency SLAs, and deployment constraints (CPU-only, Docker).",
        durationMinutes: 3,
      },
      {
        id: "high-level",
        name: "High-Level Architecture",
        description:
          "Design the API layer, model serving, voice registry, and audio output pipeline.",
        durationMinutes: 7,
      },
      {
        id: "deep-dive",
        name: "Deep Dive: Streaming & Queuing",
        description:
          "Detail how streaming synthesis works, job queuing for CPU-bound workloads, and progress reporting.",
        durationMinutes: 7,
      },
      {
        id: "trade-offs",
        name: "Trade-offs & Edge Cases",
        description:
          "Discuss model loading time, concurrent request handling, and graceful degradation when TTS is slow.",
        durationMinutes: 5,
      },
      {
        id: "wrap-up",
        name: "Wrap Up",
        description:
          "Summarize architecture decisions and identify future improvements.",
        durationMinutes: 3,
      },
    ],
    rubric: [
      {
        id: "requirements",
        label: "Requirements Clarity",
        description: "Defined clear SLAs and constraints",
        maxScore: 5,
      },
      {
        id: "architecture",
        label: "Architecture Design",
        description: "Service components are well-defined and connected",
        maxScore: 5,
      },
      {
        id: "streaming",
        label: "Streaming & Queuing",
        description: "Addressed real-time output and job management",
        maxScore: 5,
      },
      {
        id: "scalability",
        label: "Scalability Awareness",
        description: "Considered CPU constraints and growth path",
        maxScore: 5,
      },
    ],
  },
  {
    id: "multi-model-architecture",
    title: "Multi-Model Voice AI Platform",
    category: "architecture",
    difficulty: "advanced",
    summary:
      "Design an AI platform that orchestrates multiple models (LLM + TTS + voice cloning) behind a unified API, supporting pluggable backends.",
    phases: [
      {
        id: "clarify",
        name: "Clarify Scope",
        description:
          "Define which AI capabilities to expose, plugin boundaries, and cross-cutting concerns (auth, config, monitoring).",
        durationMinutes: 5,
      },
      {
        id: "high-level",
        name: "Platform Architecture",
        description:
          "Design the gateway, model registry, pluggable backend abstraction, and configuration management.",
        durationMinutes: 8,
      },
      {
        id: "deep-dive-llm",
        name: "Deep Dive: LLM Integration",
        description:
          "Detail the LLM client abstraction supporting local (Ollama, llama.cpp) and cloud (OpenAI, Azure) providers.",
        durationMinutes: 7,
      },
      {
        id: "deep-dive-tts",
        name: "Deep Dive: TTS & Cloning",
        description:
          "Detail the TTS proxy, voice registry, and cloning pipeline integration with the platform.",
        durationMinutes: 7,
      },
      {
        id: "trade-offs",
        name: "Trade-offs & Evolution",
        description:
          "Discuss CPU vs cloud trade-offs, model versioning, A/B testing of models, and future extensibility.",
        durationMinutes: 5,
      },
      {
        id: "wrap-up",
        name: "Wrap Up",
        description:
          "Summarize key architecture decisions and present a phased rollout plan.",
        durationMinutes: 3,
      },
    ],
    rubric: [
      {
        id: "scope",
        label: "Scope Definition",
        description: "Clearly bounded the platform capabilities",
        maxScore: 5,
      },
      {
        id: "abstraction",
        label: "Abstraction Design",
        description: "Pluggable backend pattern is clean and extensible",
        maxScore: 5,
      },
      {
        id: "llm-integration",
        label: "LLM Integration Depth",
        description: "Local and cloud LLM support is well-designed",
        maxScore: 5,
      },
      {
        id: "tts-integration",
        label: "TTS & Cloning Integration",
        description: "Voice pipeline is complete and coherent",
        maxScore: 5,
      },
      {
        id: "evolution",
        label: "Evolution & Extensibility",
        description: "Clear path for future models and features",
        maxScore: 5,
      },
    ],
  },
];

export function getPracticeTemplateById(
  id: string
): PracticeTemplate | undefined {
  return practiceTemplates.find((t) => t.id === id);
}
