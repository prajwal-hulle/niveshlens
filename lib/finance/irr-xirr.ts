/**
 * Calculates Internal Rate of Return (IRR) for periodic cash flows
 * (e.g. annual premiums followed by maturity / bonuses).
 * Uses Newton-Raphson method with fallback to bisection.
 *
 * @param cashFlows Array of numbers (negative for outflows, positive for inflows)
 * @param guess Initial discount rate guess (default 0.08 or 8%)
 * @returns Annual IRR in percent (e.g. 5.65 for 5.65%)
 */
export function calculateIRR(cashFlows: number[], guess = 0.08): number {
  if (cashFlows.length < 2) return 0;

  // Check if at least one positive and one negative flow exists
  const hasNegative = cashFlows.some((cf) => cf < 0);
  const hasPositive = cashFlows.some((cf) => cf > 0);
  if (!hasNegative || !hasPositive) return 0;

  const maxIter = 1000;
  const tolerance = 1e-7;
  let rate = guess;

  // Newton-Raphson iteration
  for (let iter = 0; iter < maxIter; iter++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return Number((rate * 100).toFixed(4));
    }

    if (Math.abs(dNpv) < 1e-12) {
      // Derivative too small, switch to bisection search
      break;
    }

    const newRate = rate - npv / dNpv;
    if (newRate <= -0.99) {
      rate = (rate - 0.99) / 2;
    } else {
      rate = newRate;
    }
  }

  // Bisection method fallback
  let low = -0.5;
  let high = 2.0;

  const getNpv = (r: number) => {
    let sum = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      sum += cashFlows[t] / Math.pow(1 + r, t);
    }
    return sum;
  };

  let npvLow = getNpv(low);
  let npvHigh = getNpv(high);

  if (npvLow * npvHigh > 0) {
    // If sign doesn't bracket, widen search range
    low = -0.9;
    high = 10.0;
    npvLow = getNpv(low);
    npvHigh = getNpv(high);
    if (npvLow * npvHigh > 0) return 0;
  }

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const npvMid = getNpv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return Number((mid * 100).toFixed(4));
    }

    if (npvMid * npvLow > 0) {
      low = mid;
      npvLow = npvMid;
    } else {
      high = mid;
    }
  }

  return Number(((low + high) / 2 * 100).toFixed(4));
}

export interface DateCashFlow {
  amount: number;
  date: Date;
}

/**
 * Calculates XIRR for irregular date cash flows
 * Uses Newton-Raphson with bisection fallback.
 *
 * @param cashFlows Array of { amount, date }
 * @param guess Initial guess
 * @returns Annualized return in percent (e.g. 14.2 for 14.2%)
 */
export function calculateXIRR(cashFlows: DateCashFlow[], guess = 0.1): number {
  if (cashFlows.length < 2) return 0;

  const hasNegative = cashFlows.some((cf) => cf.amount < 0);
  const hasPositive = cashFlows.some((cf) => cf.amount > 0);
  if (!hasNegative || !hasPositive) return 0;

  // Sort by date ascending
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sorted[0].date.getTime();

  const getDays = (date: Date) => (date.getTime() - startDate) / (1000 * 60 * 60 * 24);

  const getXnpv = (r: number) => {
    let sum = 0;
    for (const cf of sorted) {
      const years = getDays(cf.date) / 365.0;
      sum += cf.amount / Math.pow(1 + r, years);
    }
    return sum;
  };

  const getDxnpv = (r: number) => {
    let sum = 0;
    for (const cf of sorted) {
      const years = getDays(cf.date) / 365.0;
      if (years > 0) {
        sum -= (years * cf.amount) / Math.pow(1 + r, years + 1);
      }
    }
    return sum;
  };

  let rate = guess;
  const tolerance = 1e-6;

  for (let iter = 0; iter < 100; iter++) {
    const xnpv = getXnpv(rate);
    const dxnpv = getDxnpv(rate);

    if (Math.abs(xnpv) < tolerance) {
      return Number((rate * 100).toFixed(4));
    }

    if (Math.abs(dxnpv) < 1e-12) break;

    const nextRate = rate - xnpv / dxnpv;
    if (nextRate <= -0.99) {
      rate = (rate - 0.99) / 2;
    } else {
      rate = nextRate;
    }
  }

  // Fallback to bisection
  let low = -0.9;
  let high = 5.0;
  let npvLow = getXnpv(low);
  let npvHigh = getXnpv(high);

  if (npvLow * npvHigh > 0) return 0;

  for (let i = 0; i < 150; i++) {
    const mid = (low + high) / 2;
    const npvMid = getXnpv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return Number((mid * 100).toFixed(4));
    }

    if (npvMid * npvLow > 0) {
      low = mid;
      npvLow = npvMid;
    } else {
      high = mid;
    }
  }

  return Number(((low + high) / 2 * 100).toFixed(4));
}
