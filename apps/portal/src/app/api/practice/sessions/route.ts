import { NextResponse } from "next/server";
import { getAllSessions } from "@/lib/practice-store";

export async function GET() {
  const sessions = getAllSessions();
  return NextResponse.json({ sessions });
}
