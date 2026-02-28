import Link from "next/link";
import { getAllTopics } from "@/lib/content";

const sectionNames: Record<string, string> = {
  "voice-cloning": "Voice Cloning",
  "tts": "Text-to-Speech",
  "models": "Models",
  "guides": "Guides",
  "reference": "Reference",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const allTopics = getAllTopics();
  const topics = allTopics.filter((t) => t.section === section);
  const sectionTitle = sectionNames[section] || section;

  return (
    <div data-testid="section-page">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{sectionTitle}</h1>
      <p className="text-gray-500 mb-6">
        {topics.length} topic{topics.length !== 1 ? "s" : ""} in this section
      </p>

      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400" data-testid="empty-state">
          <p className="text-lg">No topics yet</p>
          <p className="text-sm mt-1">Content for this section is coming soon.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              data-testid="topic-card"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
                {topic.difficulty && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      topic.difficulty === "beginner"
                        ? "bg-green-100 text-green-700"
                        : topic.difficulty === "intermediate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {topic.difficulty}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{topic.summary}</p>
              {topic.tags && topic.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {topic.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
