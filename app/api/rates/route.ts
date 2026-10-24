import { NextResponse } from "next/server";
import {
  getMacroRates,
  getFdRates,
  getSmallSavingsRates,
  getInsurancePlans,
  getTaxConfig,
} from "@/lib/db";
import { checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const fy = (searchParams.get("fy") as any) || "2024-25";
  const regime = (searchParams.get("regime") as any) || "NEW";

  const [macro, fd, smallSavings, insurance, tax] = await Promise.all([
    getMacroRates(),
    getFdRates(),
    getSmallSavingsRates(),
    getInsurancePlans(),
    getTaxConfig(fy, regime),
  ]);

  return NextResponse.json(
    {
      macro,
      fd,
      smallSavings,
      insurance,
      tax,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
