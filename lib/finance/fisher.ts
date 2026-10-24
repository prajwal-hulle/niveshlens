import Decimal from "decimal.js";

/**
 * Calculates Real Return using the exact Fisher Equation:
 * (1 + real_rate) = (1 + nominal_rate) / (1 + inflation_rate)
 * real_rate = ((1 + n) / (1 + i)) - 1
 *
 * @param nominalRatePct Nominal annual return percentage (e.g. 7.5 for 7.5%)
 * @param inflationRatePct Annual CPI inflation rate percentage (e.g. 5.1 for 5.1%)
 * @returns Real return percentage (e.g. 2.28 for 2.28%)
 */
export function calculateFisherRealReturn(
  nominalRatePct: number,
  inflationRatePct: number
): number {
  if (isNaN(nominalRatePct) || isNaN(inflationRatePct)) {
    return 0;
  }

  const n = new Decimal(nominalRatePct).dividedBy(100);
  const i = new Decimal(inflationRatePct).dividedBy(100);

  // If inflation is -100% (impossible in practice), guard against divide by zero
  if (i.equals(-1)) {
    return 0;
  }

  // (1 + n) / (1 + i) - 1
  const realRate = new Decimal(1).plus(n).dividedBy(new Decimal(1).plus(i)).minus(1);

  return realRate.times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
}
