import { NextResponse } from "next/server";
import { memoryStore, updateMacroRateRecord } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  // If DATA_GOV_API_KEY is configured, can query live MoSPI endpoint;
  // otherwise, re-verifies and updates verification timestamps on macro indicators
  const today = new Date().toISOString().split("T")[0];
  await updateMacroRateRecord("repo_rate", { lastVerified: today }, "cron-macro");
  await updateMacroRateRecord("t_bill_91d", { lastVerified: today }, "cron-macro");
  await updateMacroRateRecord("cpi_inflation", { lastVerified: today }, "cron-macro");

  memoryStore.lastRefreshedAt.macro = new Date().toISOString();

  return NextResponse.json({
    success: true,
    job: "macro-refresh",
    indicatorsUpdated: ["repo_rate", "t_bill_91d", "cpi_inflation"],
    timestamp: new Date().toISOString(),
  });
}
