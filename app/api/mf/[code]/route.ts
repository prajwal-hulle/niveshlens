import { NextResponse } from "next/server";
import { getMutualFundDetails } from "@/lib/data-sources/mfapi";
import { checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const schemeCode = parseInt(params.code, 10);
  if (isNaN(schemeCode)) {
    return NextResponse.json({ error: "Invalid scheme code" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const horizon = parseInt(searchParams.get("horizon") || "5", 10);

  const details = await getMutualFundDetails(schemeCode, horizon);
  if (!details) {
    return NextResponse.json(
      { error: "Scheme details unavailable or invalid from source" },
      { status: 404 }
    );
  }

  return NextResponse.json(details, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
