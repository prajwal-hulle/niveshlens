import { z } from "zod";
import {
  calculateAnnualizedVolatility,
  calculateCAGR,
  calculateMaxDrawdown,
  calculateRollingReturns,
  calculateSharpeRatio,
  NavRecord,
  parseNavDate,
} from "../finance/stats";
import { getMacroRate, getMfTerBySchemeCode } from "../db";

const MfSearchItemSchema = z.object({
  schemeCode: z.union([z.number(), z.string().transform((v) => Number(v))]),
  schemeName: z.string(),
});

const MfDetailResponseSchema = z.object({
  meta: z.object({
    fund_house: z.string().optional(),
    scheme_type: z.string().optional(),
    scheme_category: z.string().optional(),
    scheme_code: z.union([z.number(), z.string()]).optional(),
    scheme_name: z.string(),
  }),
  data: z.array(
    z.object({
      date: z.string(),
      nav: z.string(),
    })
  ),
  status: z.string().optional(),
});

// Cache for recent scheme data to avoid hammering mfapi and respect limits
const memoryNavCache = new Map<number, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Searches schemes via api.mfapi.in with timeout and retry
 */
export async function searchMutualFunds(query: string, limit = 20) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = encodeURIComponent(query.trim());
  const url = `https://api.mfapi.in/mf/search?q=${cleanQuery}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`mfapi search returned status ${res.status}`);
      return [];
    }

    const raw = await res.json();
    const parsed = z.array(MfSearchItemSchema).safeParse(raw);
    if (!parsed.success) {
      console.warn("Invalid search response schema from mfapi", parsed.error);
      return [];
    }

    return parsed.data.slice(0, limit).map((item) => {
      const isDirect = item.schemeName.toUpperCase().includes("DIRECT");
      return {
        schemeCode: item.schemeCode,
        schemeName: item.schemeName,
        planType: isDirect ? "DIRECT" : "REGULAR",
      };
    });
  } catch (err) {
    console.warn(`Error querying mfapi search for "${query}":`, err);
    return [];
  }
}

/**
 * Fetches full NAV history and computes complete risk & return statistics
 */
export async function getMutualFundDetails(schemeCode: number, horizonYears = 5) {
  const cached = memoryNavCache.get(schemeCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  let rawJson: any = null;

  // Retry up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        rawJson = await res.json();
        break;
      }
    } catch (err) {
      if (attempt === 2) {
        console.warn(`Failed to fetch scheme ${schemeCode} after 2 attempts:`, err);
      }
    }
  }

  if (!rawJson) {
    return null;
  }

  const parsed = MfDetailResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    console.warn(`Schema validation failed for scheme ${schemeCode}`, parsed.error);
    return null;
  }

  const { meta, data } = parsed.data;

  // Convert to numeric NavRecords
  const navRecords: NavRecord[] = data
    .map((d) => ({
      date: d.date,
      nav: parseFloat(d.nav),
    }))
    .filter((d) => !isNaN(d.nav) && d.nav > 0);

  if (navRecords.length === 0) return null;

  // Sort chronological ascending (oldest to newest)
  const sortedAsc = [...navRecords].sort(
    (a, b) => parseNavDate(a.date).getTime() - parseNavDate(b.date).getTime()
  );

  const latestRecord = sortedAsc[sortedAsc.length - 1];
  const oldestRecord = sortedAsc[0];
  const currentNav = latestRecord.nav;

  // Helper to compute trailing CAGR for standard periods
  const computeTrailingCagr = (years: number): number | null => {
    const targetTime = parseNavDate(latestRecord.date).getTime() - years * 365.25 * 24 * 60 * 60 * 1000;
    // Find closest record
    let closestRecord = sortedAsc[0];
    let minDiff = Infinity;
    for (const rec of sortedAsc) {
      const diff = Math.abs(parseNavDate(rec.date).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestRecord = rec;
      }
    }

    const actualYears =
      (parseNavDate(latestRecord.date).getTime() - parseNavDate(closestRecord.date).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);

    if (actualYears < years * 0.85) {
      return null; // Insufficient history
    }

    return calculateCAGR(closestRecord.nav, currentNav, actualYears);
  };

  const cagr1Yr = computeTrailingCagr(1);
  const cagr3Yr = computeTrailingCagr(3);
  const cagr5Yr = computeTrailingCagr(5);

  const totalHistoryYears =
    (parseNavDate(latestRecord.date).getTime() - parseNavDate(oldestRecord.date).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  const cagrSinceInception = calculateCAGR(oldestRecord.nav, currentNav, totalHistoryYears);

  // Compute Risk Statistics
  const volatility = calculateAnnualizedVolatility(sortedAsc);
  const { maxDrawdownPct, peakDate, troughDate } = calculateMaxDrawdown(sortedAsc);

  // DB Risk-free rate (Repo rate)
  const repoRate = await getMacroRate("repo_rate");
  const sharpe = calculateSharpeRatio(cagr3Yr ?? cagrSinceInception, repoRate, volatility);

  // Rolling Returns Scenarios (correction #7: disable if history < horizon)
  const rollingReturns = calculateRollingReturns(sortedAsc, horizonYears);

  // Total Expense Ratio from AMFI (correction #4: never estimate)
  const terInfo = await getMfTerBySchemeCode(schemeCode);

  const isDirect = meta.scheme_name.toUpperCase().includes("DIRECT");

  const result = {
    schemeCode,
    schemeName: meta.scheme_name,
    fundHouse: meta.fund_house || "Mutual Fund",
    schemeCategory: meta.scheme_category || "Equity",
    schemeType: meta.scheme_type || "Open Ended",
    planType: isDirect ? "DIRECT" : "REGULAR",
    currentNav,
    navDate: latestRecord.date,
    cagr1Yr,
    cagr3Yr,
    cagr5Yr,
    cagrSinceInception,
    volatility,
    maxDrawdownPct,
    maxDrawdownPeakDate: peakDate,
    maxDrawdownTroughDate: troughDate,
    sharpeRatio: sharpe,
    repoRateUsed: repoRate,
    rollingReturns,
    expenseRatio: terInfo.terPct, // null if unavailable
    terSource: terInfo.sourceName,
    terSourceUrl: terInfo.sourceUrl,
    dataSource: {
      name: "AMFI / Association of Mutual Funds in India",
      url: `https://api.mfapi.in/mf/${schemeCode}`,
      lastUpdated: latestRecord.date,
    },
    navHistorySample: sortedAsc.slice(-365), // Last 1 year for quick chart display
  };

  memoryNavCache.set(schemeCode, { timestamp: Date.now(), data: result });
  return result;
}
