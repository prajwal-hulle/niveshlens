import { InstrumentMetrics, UserProfile } from "./finance/types";

export interface ScoringWeights {
  returns: number; // e.g. 30
  safety: number; // e.g. 25
  liquidity: number; // e.g. 15
  taxEfficiency: number; // e.g. 15
  flexibility: number; // e.g. 10
  transparency: number; // e.g. 5
}

export const DEFAULT_WEIGHTS: Record<string, ScoringWeights> = {
  BALANCED: {
    returns: 30,
    safety: 25,
    liquidity: 15,
    taxEfficiency: 15,
    flexibility: 10,
    transparency: 5,
  },
  CONSERVATIVE: {
    returns: 15,
    safety: 45,
    liquidity: 15,
    taxEfficiency: 15,
    flexibility: 5,
    transparency: 5,
  },
  AGGRESSIVE: {
    returns: 50,
    safety: 10,
    liquidity: 15,
    taxEfficiency: 15,
    flexibility: 5,
    transparency: 5,
  },
};

/**
 * Computes individual dimension radar scores (0 to 100) for an instrument based on its metrics
 */
export function computeRadarScores(inst: Partial<InstrumentMetrics>, profile: UserProfile): {
  returns: number;
  safety: number;
  liquidity: number;
  taxEfficiency: number;
  flexibility: number;
  transparency: number;
} {
  const type = inst.type ?? "FD";

  // 1. Returns Score (based on real return)
  // 0% real return = 40 pts, 6% real return = 90 pts, negative real return = 10-30 pts
  const real = inst.realReturnPct ?? 2.0;
  const returnsScore = Math.min(100, Math.max(10, Math.round(40 + real * 8.5)));

  // 2. Safety Score
  let safetyScore = 50;
  if (type === "PPF") safetyScore = 100; // Sovereign guarantee, no drawdown
  else if (type === "FD") {
    // Bank FD: Sovereign/DICGC backed
    safetyScore = inst.category === "POST_OFFICE" ? 100 : 88;
  } else if (type === "LIC") {
    // Sovereign guarantee under Section 37 of LIC Act
    safetyScore = 95;
  } else if (type === "MF") {
    // Market linked; safety depends inversely on maxDrawdown and volatility
    const dd = inst.maxDrawdownPct ?? 25;
    safetyScore = Math.min(80, Math.max(20, Math.round(85 - dd * 1.3)));
  }

  // 3. Liquidity Score
  let liquidityScore = 50;
  if (type === "MF") {
    // T+2 redemption, exit load only in year 1
    liquidityScore = 92;
  } else if (type === "FD") {
    // Premature withdrawal allowed with 0.5-1% penalty
    liquidityScore = 80;
  } else if (type === "PPF") {
    // 15-year lock-in, partial withdrawal only from year 7
    liquidityScore = profile.horizonYears >= 15 ? 45 : 25;
  } else if (type === "LIC") {
    // 100% loss year 1, heavy surrender loss years 2-5
    liquidityScore = 15;
  }

  // 4. Tax Efficiency Score
  let taxEfficiency = 50;
  if (type === "PPF") taxEfficiency = 100; // EEE
  else if (type === "LIC") taxEfficiency = 85; // Sec 10(10D) tax free
  else if (type === "MF") {
    // Equity MF: 12.5% LTCG with ₹1.25L exemption
    taxEfficiency = 80;
  } else if (type === "FD") {
    // Taxed at marginal slab
    const postTaxRatio = inst.postTaxReturnPct && inst.nominalReturnPct ? inst.postTaxReturnPct / inst.nominalReturnPct : 0.7;
    taxEfficiency = Math.round(postTaxRatio * 75);
  }

  // 5. Flexibility Score
  let flexibility = 50;
  if (type === "MF") flexibility = 95; // Pause SIP, change amount, SWP, STP
  else if (type === "FD") flexibility = 65; // Fixed tenure, auto-renew
  else if (type === "PPF") flexibility = 75; // ₹500 to ₹1.5L anytime
  else if (type === "LIC") flexibility = 30; // Rigid premium dates, lapse risk

  // 6. Transparency Score
  let transparency = 50;
  if (type === "MF") transparency = 98; // Daily NAV, monthly portfolio, AMFI TER
  else if (type === "FD") transparency = 90; // Fixed contracted interest
  else if (type === "PPF") transparency = 85; // Gazette notification
  else if (type === "LIC") transparency = 40; // Actuarial black box, bonus declaration

  return {
    returns: returnsScore,
    safety: safetyScore,
    liquidity: liquidityScore,
    taxEfficiency,
    flexibility,
    transparency,
  };
}

/**
 * Calculates weighted composite score (0 to 100) based on user-configurable weights
 */
export function calculateCompositeScore(
  radar: {
    returns: number;
    safety: number;
    liquidity: number;
    taxEfficiency: number;
    flexibility: number;
    transparency: number;
  },
  weights: ScoringWeights
): number {
  const totalWeight =
    weights.returns +
    weights.safety +
    weights.liquidity +
    weights.taxEfficiency +
    weights.flexibility +
    weights.transparency;

  if (totalWeight <= 0) return 0;

  const weightedSum =
    radar.returns * weights.returns +
    radar.safety * weights.safety +
    radar.liquidity * weights.liquidity +
    radar.taxEfficiency * weights.taxEfficiency +
    radar.flexibility * weights.flexibility +
    radar.transparency * weights.transparency;

  return Number((weightedSum / totalWeight).toFixed(1));
}
