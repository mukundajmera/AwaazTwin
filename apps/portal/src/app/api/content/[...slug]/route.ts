import { NextRequest, NextResponse } from "next/server";
import { getTopicBySlug } from "@/lib/content";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const result = await getTopicBySlug(slug);

  if (!result) {
    return NextResponse.json({ error: "Topic not found", slug }, { status: 404 });
  }

  return NextResponse.json(result);
}
