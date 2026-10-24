import { NextResponse } from "next/server";
import { getDatasetHealth, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureDbInitialized().catch(() => {});
  const health = getDatasetHealth();

  return NextResponse.json({
    status: "healthy",
    uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
    ...health,
  });
}
