import Link from "next/link";
import { practiceTemplates } from "@/lib/practice-templates";
import type { PracticeCategory } from "@/lib/types";

const categoryLabels: Record<PracticeCategory, string> = {
  "voice-cloning": "Voice Cloning",
  "tts-pipeline": "TTS Pipeline",
  architecture: "Architecture",
};

export default function PracticePage() {
  return (
    <div data-testid="practice-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Mode</h1>
      <p className="text-gray-600 mb-8">
        Choose a practice template to start a guided session with self-scoring
        rubrics. Each session walks you through structured phases with suggested
        durations.
      </p>

      <div className="grid gap-4">
        {practiceTemplates.map((template) => (
          <Link
            key={template.id}
            href={`/practice/${template.id}`}
            data-testid="practice-template-card"
            className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {template.title}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  template.difficulty === "beginner"
                    ? "bg-green-100 text-green-700"
                    : template.difficulty === "intermediate"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {template.difficulty}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                {categoryLabels[template.category] || template.category}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{template.summary}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>
                {template.phases.length} phases •{" "}
                {template.phases.reduce((sum, p) => sum + p.durationMinutes, 0)}{" "}
                min total
              </span>
              <span>{template.rubric.length} rubric items</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
