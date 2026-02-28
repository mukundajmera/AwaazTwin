import Link from "next/link";

const sections = [
  {
    title: "Voice Cloning",
    description: "Learn voice cloning from recording to generation",
    href: "/topics/voice-cloning",
    icon: "📘",
  },
  {
    title: "TTS",
    description: "Text-to-speech setup and configuration",
    href: "/topics/tts",
    icon: "🔊",
  },
  {
    title: "Models",
    description: "AI model architecture and selection",
    href: "/topics/models",
    icon: "🤖",
  },
  {
    title: "Guides",
    description: "Step-by-step tutorials and walkthroughs",
    href: "/topics/guides",
    icon: "📖",
  },
  {
    title: "Reference",
    description: "API docs and technical reference",
    href: "/topics/reference",
    icon: "📋",
  },
];

export default function HomePage() {
  return (
    <div data-testid="home-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome to AwaazTwin
      </h1>
      <p className="text-gray-600 mb-8">
        AI-powered voice cloning and text-to-speech portal. Configure, test, and
        manage your voice AI setup from the browser.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-2">{section.icon}</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {section.title}
            </h2>
            <p className="text-sm text-gray-500">{section.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/practice"
          className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🎯</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Practice
          </h2>
          <p className="text-sm text-gray-500">
            Guided practice sessions with self-scoring rubrics
          </p>
        </Link>
        <Link
          href="/settings"
          className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Settings
          </h2>
          <p className="text-sm text-gray-500">
            Configure LLM and TTS backends
          </p>
        </Link>
        <Link
          href="/tests"
          className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🧪</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Test Console
          </h2>
          <p className="text-sm text-gray-500">
            Run diagnostics and verify your setup
          </p>
        </Link>
        <Link
          href="/uat"
          className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">📋</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            UAT Checklist
          </h2>
          <p className="text-sm text-gray-500">
            User acceptance testing scenarios and verification
          </p>
        </Link>
      </div>
    </div>
  );
}
