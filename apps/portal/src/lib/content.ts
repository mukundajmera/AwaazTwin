import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import rehypeSanitize from "rehype-sanitize";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { Topic, ContentSection } from "./types";

const defaultContentDir = path.join(process.cwd(), "content");

/**
 * Validate a slug to prevent path traversal attacks.
 * Rejects slugs containing "..", leading "/", backslashes, or null bytes.
 */
function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.includes("..")) return false;
  if (slug.startsWith("/")) return false;
  if (slug.includes("\\")) return false;
  if (slug.includes("\0")) return false;
  return true;
}

export function getAllTopics(contentDir: string = defaultContentDir): Topic[] {
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
  slug: string,
  contentDir: string = defaultContentDir
): Promise<{ topic: Topic; content: string } | null> {
  if (!isValidSlug(slug)) return null;

  const filePath = path.join(contentDir, `${slug}.mdx`);
  const altFilePath = path.join(contentDir, `${slug}.md`);

  // Ensure resolved paths stay within contentDir
  const resolvedPath = path.resolve(filePath);
  const resolvedAltPath = path.resolve(altFilePath);
  const resolvedContentDir = path.resolve(contentDir);
  if (
    !resolvedPath.startsWith(resolvedContentDir + path.sep) ||
    !resolvedAltPath.startsWith(resolvedContentDir + path.sep)
  ) {
    return null;
  }

  const actualPath = fs.existsSync(filePath)
    ? filePath
    : fs.existsSync(altFilePath)
      ? altFilePath
      : null;
  if (!actualPath) return null;

  const fileContent = fs.readFileSync(actualPath, "utf-8");
  const { data, content: rawContent } = matter(fileContent);

  // Render markdown to sanitized HTML to prevent XSS
  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(rawContent);
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
