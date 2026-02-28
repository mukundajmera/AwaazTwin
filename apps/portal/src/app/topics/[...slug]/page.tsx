import Link from "next/link";
import { getTopicBySlug } from "@/lib/content";
import { notFound } from "next/navigation";

export default async function TopicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const result = await getTopicBySlug(slugStr);

  if (!result) {
    notFound();
  }

  const { topic, content } = result;

  return (
    <div data-testid="topic-page" className="max-w-4xl">
      <nav className="text-sm text-gray-500 mb-4" data-testid="breadcrumb">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href={`/topics/${topic.section}`} className="hover:text-blue-600 capitalize">
          {topic.section.replace("-", " ")}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{topic.title}</span>
      </nav>

      <div className="flex gap-8">
        <article className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h1>
            <div className="flex items-center gap-3">
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
              {topic.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className="prose prose-gray max-w-none"
            data-testid="topic-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        {/* Side panel */}
        <aside className="w-64 hidden lg:block flex-shrink-0" data-testid="topic-side-panel">
          <div className="sticky top-6 space-y-6">
            {topic.summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-600">{topic.summary}</p>
              </div>
            )}

            {topic.relatedTopics && topic.relatedTopics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Related Topics</h3>
                <ul className="space-y-1">
                  {topic.relatedTopics.map((relatedTopicSlug) => (
                    <li key={relatedTopicSlug}>
                      <Link href={`/topics/${relatedTopicSlug}`} className="text-sm text-blue-600 hover:underline">
                        {relatedTopicSlug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
