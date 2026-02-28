"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PracticeTemplate, PracticeSession } from "@/lib/types";

interface PracticeSessionViewProps {
  template: PracticeTemplate;
}

export default function PracticeSessionView({
  template,
}: PracticeSessionViewProps) {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize scores with 0 for each rubric item
  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const item of template.rubric) {
      initial[item.id] = 0;
    }
    setScores(initial);
  }, [template.rubric]);

  async function startSession() {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start session");
      }
      const data: PracticeSession = await res.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setIsStarting(false);
    }
  }

  function nextPhase() {
    if (currentPhase < template.phases.length - 1) {
      setCurrentPhase((p) => p + 1);
    }
  }

  function prevPhase() {
    if (currentPhase > 0) {
      setCurrentPhase((p) => p - 1);
    }
  }

  async function finishSession() {
    if (!session) return;
    setIsFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, scores, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to finish session");
      }
      const data: PracticeSession = await res.json();
      setSession(data);
      setIsCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to finish session"
      );
    } finally {
      setIsFinishing(false);
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = template.rubric.reduce((a, r) => a + r.maxScore, 0);
  const totalDuration = template.phases.reduce(
    (sum, p) => sum + p.durationMinutes,
    0
  );

  // Not started yet
  if (!session) {
    return (
      <div data-testid="practice-session-view">
        <nav className="text-sm text-gray-500 mb-4" data-testid="breadcrumb">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link href="/practice" className="hover:text-blue-600">
            Practice
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{template.title}</span>
        </nav>

        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {template.title}
          </h1>
          <p className="text-gray-600 mb-2">{template.summary}</p>
          <p className="text-sm text-gray-400 mb-8">
            {template.phases.length} phases • {totalDuration} min •{" "}
            {template.rubric.length} rubric items
          </p>

          {error && (
            <p className="text-red-600 text-sm mb-4" data-testid="error-message">
              {error}
            </p>
          )}

          <button
            type="button"
            data-testid="start-session-button"
            onClick={startSession}
            disabled={isStarting}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isStarting ? "Starting…" : "Start Practice Session"}
          </button>
        </div>
      </div>
    );
  }

  // Completed
  if (isCompleted) {
    return (
      <div data-testid="practice-session-view">
        <nav className="text-sm text-gray-500 mb-4" data-testid="breadcrumb">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link href="/practice" className="hover:text-blue-600">
            Practice
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{template.title}</span>
        </nav>

        <div
          className="max-w-2xl mx-auto text-center py-12"
          data-testid="session-completed"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Session Complete! 🎉
          </h1>
          <p className="text-gray-600 mb-4">
            You scored{" "}
            <span className="font-bold text-blue-600">
              {totalScore}/{maxScore}
            </span>{" "}
            on {template.title}
          </p>

          <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Score Breakdown</h3>
            {template.rubric.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-1 text-sm"
              >
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium">
                  {scores[item.id] ?? 0}/{item.maxScore}
                </span>
              </div>
            ))}
          </div>

          {notes && (
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link
              href="/practice"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Practice
            </Link>
            <button
              type="button"
              onClick={() => {
                setSession(null);
                setIsCompleted(false);
                setCurrentPhase(0);
                const initial: Record<string, number> = {};
                for (const item of template.rubric) {
                  initial[item.id] = 0;
                }
                setScores(initial);
                setNotes("");
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active session
  const phase = template.phases[currentPhase];
  const isLastPhase = currentPhase === template.phases.length - 1;

  return (
    <div data-testid="practice-session-view">
      <nav className="text-sm text-gray-500 mb-4" data-testid="breadcrumb">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">›</span>
        <Link href="/practice" className="hover:text-blue-600">
          Practice
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{template.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {template.title}
      </h1>

      {/* Phase stepper */}
      <div className="flex items-center gap-2 mb-8" data-testid="phase-stepper">
        {template.phases.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPhase(i)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === currentPhase
                  ? "bg-blue-600 text-white"
                  : i < currentPhase
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline">{p.name}</span>
            </button>
            {i < template.phases.length - 1 && (
              <div className="w-4 h-px bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Current phase */}
      <div
        className="border border-gray-200 rounded-lg p-6 mb-6"
        data-testid="current-phase"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">{phase.name}</h2>
          <span className="text-sm text-gray-400">
            {phase.durationMinutes} min suggested
          </span>
        </div>
        <p className="text-gray-600 mb-4">{phase.description}</p>

        <div className="flex gap-3">
          <button
            type="button"
            data-testid="prev-phase-button"
            onClick={prevPhase}
            disabled={currentPhase === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            ← Previous
          </button>
          {!isLastPhase ? (
            <button
              type="button"
              data-testid="next-phase-button"
              onClick={nextPhase}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Next Phase →
            </button>
          ) : (
            <span className="text-sm text-gray-400 py-2">
              Last phase — score yourself below
            </span>
          )}
        </div>
      </div>

      {/* Self-scoring rubric */}
      <div
        className="border border-gray-200 rounded-lg p-6 mb-6"
        data-testid="rubric-section"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Self-Assessment Rubric
        </h2>
        <div className="space-y-4">
          {template.rubric.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor={`rubric-${item.id}`}
                  className="text-sm font-medium text-gray-700"
                >
                  {item.label}
                </label>
                <span className="text-sm text-gray-500">
                  {scores[item.id] ?? 0} / {item.maxScore}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{item.description}</p>
              <input
                id={`rubric-${item.id}`}
                data-testid={`rubric-slider-${item.id}`}
                type="range"
                min={0}
                max={item.maxScore}
                value={scores[item.id] ?? 0}
                onChange={(e) =>
                  setScores((prev) => ({
                    ...prev,
                    [item.id]: Number(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Score</span>
          <span className="text-lg font-bold text-blue-600">
            {totalScore} / {maxScore}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Notes</h2>
        <textarea
          data-testid="session-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down key points, areas for improvement, or things to review later…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px]"
        />
      </div>

      {/* Finish button */}
      {error && (
        <p className="text-red-600 text-sm mb-4" data-testid="error-message">
          {error}
        </p>
      )}
      <button
        type="button"
        data-testid="finish-session-button"
        onClick={finishSession}
        disabled={isFinishing}
        className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {isFinishing ? "Saving…" : "Finish & Save Session"}
      </button>
    </div>
  );
}
