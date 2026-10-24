export interface NavRecord {
  date: string; // DD-MM-YYYY or YYYY-MM-DD
  nav: number;
}

/**
 * Calculates CAGR between startNav and endNav over years
 * CAGR = (endNav / startNav)^(1 / years) - 1
 */
export function calculateCAGR(startNav: number, endNav: number, years: number): number {
  if (startNav <= 0 || endNav <= 0 || years <= 0) return 0;
  const cagr = Math.pow(endNav / startNav, 1 / years) - 1;
  return Number((cagr * 100).toFixed(2));
}

/**
 * Parses date string in DD-MM-YYYY or YYYY-MM-DD format to Date object
 */
export function parseNavDate(dateStr: string): Date {
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      // DD-MM-YYYY
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
  }
  return new Date(dateStr);
}

/**
 * Calculates Annualized Volatility (Standard Deviation of daily logarithmic or percentage returns * sqrt(250))
 */
export function calculateAnnualizedVolatility(navHistory: NavRecord[]): number {
  if (navHistory.length < 2) return 0;

  // Ensure chronological order (oldest to newest)
  const sorted = [...navHistory].sort(
    (a, b) => parseNavDate(a.date).getTime() - parseNavDate(b.date).getTime()
  );

  const dailyReturns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].nav;
    const curr = sorted[i].nav;
    if (prev > 0) {
      dailyReturns.push((curr - prev) / prev);
    }
  }

  if (dailyReturns.length < 2) return 0;

  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    (dailyReturns.length - 1);
  const dailyStdDev = Math.sqrt(variance);

  // 250 trading days per year in Indian markets
  const annualizedVol = dailyStdDev * Math.sqrt(250) * 100;
  return Number(annualizedVol.toFixed(2));
}

/**
 * Calculates Maximum Drawdown from NAV series
 * Peak to trough decline percentage
 */
export function calculateMaxDrawdown(navHistory: NavRecord[]): {
  maxDrawdownPct: number;
  peakDate: string;
  troughDate: string;
} {
  if (navHistory.length < 2) {
    return { maxDrawdownPct: 0, peakDate: "", troughDate: "" };
  }

  const sorted = [...navHistory].sort(
    (a, b) => parseNavDate(a.date).getTime() - parseNavDate(b.date).getTime()
  );

  let peak = -Infinity;
  let maxDd = 0;
  let peakDate = "";
  let troughDate = "";
  let tempPeakDate = "";

  for (const record of sorted) {
    if (record.nav > peak) {
      peak = record.nav;
      tempPeakDate = record.date;
    }

    if (peak > 0) {
      const dd = (peak - record.nav) / peak;
      if (dd > maxDd) {
        maxDd = dd;
        peakDate = tempPeakDate;
        troughDate = record.date;
      }
    }
  }

  return {
    maxDrawdownPct: Number((maxDd * 100).toFixed(2)),
    peakDate,
    troughDate,
  };
}

export interface RollingReturnsResult {
  hasInsufficientHistory: boolean;
  totalRollingWindows: number;
  pessimistic10th: number | null;
  base50th: number | null;
  optimistic90th: number | null;
  minReturn: number | null;
  maxReturn: number | null;
  averageReturn: number | null;
  probabilityOfLossPct: number | null;
  insufficientReason?: string;
}

/**
 * Computes Rolling Returns over horizonYears window across the entire historical NAV series.
 * If total history in years < horizonYears, returns hasInsufficientHistory: true and disables scenarios.
 */
export function calculateRollingReturns(
  navHistory: NavRecord[],
  horizonYears: number
): RollingReturnsResult {
  if (!navHistory || navHistory.length < 2) {
    return {
      hasInsufficientHistory: true,
      totalRollingWindows: 0,
      pessimistic10th: null,
      base50th: null,
      optimistic90th: null,
      minReturn: null,
      maxReturn: null,
      averageReturn: null,
      probabilityOfLossPct: null,
      insufficientReason: "No NAV history available",
    };
  }

  const sorted = [...navHistory].sort(
    (a, b) => parseNavDate(a.date).getTime() - parseNavDate(b.date).getTime()
  );

  const startDate = parseNavDate(sorted[0].date);
  const endDate = parseNavDate(sorted[sorted.length - 1].date);
  const historyYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (historyYears < horizonYears) {
    return {
      hasInsufficientHistory: true,
      totalRollingWindows: 0,
      pessimistic10th: null,
      base50th: null,
      optimistic90th: null,
      minReturn: null,
      maxReturn: null,
      averageReturn: null,
      probabilityOfLossPct: null,
      insufficientReason: `Fund history (${historyYears.toFixed(1)} yrs) is shorter than investment horizon (${horizonYears} yrs). Scenarios disabled per data accuracy rules.`,
    };
  }

  // Find pairs with date difference roughly equal to horizonYears
  // Approximate window in trading days ~ horizonYears * 250
  const windowDays = horizonYears * 365.25;
  const rollingCAGRs: number[] = [];

  let rightIdx = 0;
  for (let leftIdx = 0; leftIdx < sorted.length; leftIdx++) {
    const leftDate = parseNavDate(sorted[leftIdx].date).getTime();
    const targetRightDate = leftDate + windowDays * 24 * 60 * 60 * 1000;

    // Advance rightIdx until date >= targetRightDate
    while (rightIdx < sorted.length && parseNavDate(sorted[rightIdx].date).getTime() < targetRightDate) {
      rightIdx++;
    }

    if (rightIdx >= sorted.length) break;

    const actualDiffYears =
      (parseNavDate(sorted[rightIdx].date).getTime() - leftDate) / (1000 * 60 * 60 * 24 * 365.25);

    // Accept window if within ±15 days of target horizon
    if (Math.abs(actualDiffYears - horizonYears) <= 0.05) {
      const startNav = sorted[leftIdx].nav;
      const endNav = sorted[rightIdx].nav;
      if (startNav > 0 && endNav > 0) {
        const cagr = Math.pow(endNav / startNav, 1 / actualDiffYears) - 1;
        rollingCAGRs.push(cagr * 100);
      }
    }
  }

  if (rollingCAGRs.length < 5) {
    return {
      hasInsufficientHistory: true,
      totalRollingWindows: rollingCAGRs.length,
      pessimistic10th: null,
      base50th: null,
      optimistic90th: null,
      minReturn: null,
      maxReturn: null,
      averageReturn: null,
      probabilityOfLossPct: null,
      insufficientReason: `Insufficient matching rolling windows (${rollingCAGRs.length} found) for ${horizonYears}-year horizon.`,
    };
  }

  // Sort rolling returns ascending to compute percentiles
  rollingCAGRs.sort((a, b) => a - b);

  const getPercentile = (pct: number) => {
    const index = (pct / 100) * (rollingCAGRs.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return rollingCAGRs[lower];
    return rollingCAGRs[lower] * (1 - weight) + rollingCAGRs[upper] * weight;
  };

  const lossCount = rollingCAGRs.filter((r) => r < 0).length;
  const probLoss = (lossCount / rollingCAGRs.length) * 100;

  const sum = rollingCAGRs.reduce((acc, v) => acc + v, 0);

  return {
    hasInsufficientHistory: false,
    totalRollingWindows: rollingCAGRs.length,
    pessimistic10th: Number(getPercentile(10).toFixed(2)),
    base50th: Number(getPercentile(50).toFixed(2)),
    optimistic90th: Number(getPercentile(90).toFixed(2)),
    minReturn: Number(rollingCAGRs[0].toFixed(2)),
    maxReturn: Number(rollingCAGRs[rollingCAGRs.length - 1].toFixed(2)),
    averageReturn: Number((sum / rollingCAGRs.length).toFixed(2)),
    probabilityOfLossPct: Number(probLoss.toFixed(2)),
  };
}

/**
 * Calculates Sharpe Ratio
 * (CAGR - RiskFreeRate) / Volatility
 */
export function calculateSharpeRatio(
  annualizedReturnPct: number,
  riskFreeRatePct: number,
  volatilityPct: number
): number {
  if (volatilityPct <= 0) return 0;
  const sharpe = (annualizedReturnPct - riskFreeRatePct) / volatilityPct;
  return Number(sharpe.toFixed(2));
}
