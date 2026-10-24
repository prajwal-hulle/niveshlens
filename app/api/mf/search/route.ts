import { NextResponse } from "next/server";
import { searchMutualFunds } from "@/lib/data-sources/mfapi";
import { checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchMutualFunds(q, 15);
  return NextResponse.json({ results });
}
