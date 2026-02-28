import { notFound } from "next/navigation";
import { getPracticeTemplateById, practiceTemplates } from "@/lib/practice-templates";
import PracticeSessionView from "@/components/practice-session-view";

export default async function PracticeTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = getPracticeTemplateById(templateId);

  if (!template) {
    notFound();
  }

  return <PracticeSessionView template={template} />;
}

export async function generateStaticParams() {
  return practiceTemplates.map((t) => ({ templateId: t.id }));
}
