import { NextResponse } from "next/server";
import { getMutualFundDetails } from "@/lib/data-sources/mfapi";
import { memoryStore } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  // Pre-warm and refresh top benchmark scheme NAV caches in chunks (≤ 60s)
  const prioritySchemes = [122639, 120503, 120716, 120828, 120152];
  const refreshed: number[] = [];

  for (const code of prioritySchemes) {
    try {
      const res = await getMutualFundDetails(code, 5);
      if (res) refreshed.push(code);
    } catch (err) {
      console.warn(`Cron refresh failed for scheme ${code}:`, err);
    }
  }

  memoryStore.lastRefreshedAt.mfTer = new Date().toISOString();

  return NextResponse.json({
    success: true,
    job: "mf-refresh",
    refreshedCount: refreshed.length,
    schemes: refreshed,
    timestamp: new Date().toISOString(),
  });
}
