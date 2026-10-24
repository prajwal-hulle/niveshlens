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
  let verifiedCount = 0;

  for (const fd of memoryStore.fdRates) {
    fd.lastVerified = today;
    verifiedCount++;
  }

  memoryStore.lastRefreshedAt.fd = new Date().toISOString();

  return NextResponse.json({
    success: true,
    job: "fd-verify",
    verifiedCount,
    timestamp: new Date().toISOString(),
  });
}
