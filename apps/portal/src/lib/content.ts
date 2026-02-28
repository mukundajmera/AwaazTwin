import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { Topic, ContentSection } from "./types";

const contentDir = path.join(process.cwd(), "content");

export function getAllTopics(): Topic[] {
  if (!fs.existsSync(contentDir)) return [];

  const topics: Topic[] = [];
  const sections = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const section of sections) {
    const sectionPath = path.join(contentDir, section.name);
    const files = fs
      .readdirSync(sectionPath)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(sectionPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);
      const slug = `${section.name}/${file.replace(/\.(mdx|md)$/, "")}`;

      topics.push({
        slug,
        title: data.title || slug,
        section: section.name as ContentSection,
        summary: data.summary || "",
        difficulty: data.difficulty,
        relatedTopics: data.relatedTopics,
        tags: data.tags,
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    }
  }
  return topics;
}

export async function getTopicBySlug(
  slug: string
): Promise<{ topic: Topic; content: string } | null> {
  const filePath = path.join(contentDir, `${slug}.mdx`);
  const altFilePath = path.join(contentDir, `${slug}.md`);

  const actualPath = fs.existsSync(filePath)
    ? filePath
    : fs.existsSync(altFilePath)
      ? altFilePath
      : null;
  if (!actualPath) return null;

  const fileContent = fs.readFileSync(actualPath, "utf-8");
  const { data, content: rawContent } = matter(fileContent);

  const processed = await remark().use(html).process(rawContent);
  const contentHtml = processed.toString();

  const section = slug.split("/")[0] as ContentSection;
  const topic: Topic = {
    slug,
    title: data.title || slug,
    section,
    summary: data.summary || "",
    difficulty: data.difficulty,
    relatedTopics: data.relatedTopics,
    tags: data.tags,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };

  return { topic, content: contentHtml };
}
