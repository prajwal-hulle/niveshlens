import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  let updatedCount = 0;

  for (const s of memoryStore.smallSavings) {
    s.lastVerified = today;
    updatedCount++;
  }

  memoryStore.lastRefreshedAt.smallSavings = new Date().toISOString();

  return NextResponse.json({
    success: true,
    job: "small-savings-verify",
    updatedCount,
    timestamp: new Date().toISOString(),
  });
}
