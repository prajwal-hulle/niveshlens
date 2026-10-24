import Decimal from "decimal.js";

/**
 * Lumpsum compound interest with discrete compounding frequency
 * @param principal Initial investment in INR
 * @param annualRatePct Annual rate in % (e.g. 7.1 for 7.1%)
 * @param years Tenure in years
 * @param frequency 'quarterly' (4), 'annual' (1), 'monthly' (12), 'half-yearly' (2)
 */
export function fvCompoundLumpsum(
  principal: number,
  annualRatePct: number,
  years: number,
  frequency: "annual" | "half-yearly" | "quarterly" | "monthly" = "quarterly"
): number {
  if (principal <= 0 || years <= 0) return principal;
  if (annualRatePct === 0) return principal;

  const freqMap = {
    annual: 1,
    "half-yearly": 2,
    quarterly: 4,
    monthly: 12,
  };
  const n = freqMap[frequency];
  const P = new Decimal(principal);
  const r = new Decimal(annualRatePct).dividedBy(100).dividedBy(n);
  const totalPeriods = new Decimal(n).times(years);

  // A = P * (1 + r/n)^(n*t)
  const factor = new Decimal(1).plus(r).pow(totalPeriods.toNumber());
  const amount = P.times(factor);

  return amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Future value of Systematic Investment Plan (SIP)
 * Assuming monthly contributions at beginning of each month
 * FV = P * [((1 + r)^n - 1) / r] * (1 + r)
 */
export function fvSip(
  monthlyAmount: number,
  annualRatePct: number,
  years: number
): number {
  if (monthlyAmount <= 0 || years <= 0) return 0;
  if (annualRatePct === 0) return monthlyAmount * years * 12;

  const P = new Decimal(monthlyAmount);
  const totalMonths = years * 12;
  const monthlyRate = new Decimal(annualRatePct).dividedBy(100).dividedBy(12);

  const onePlusR = new Decimal(1).plus(monthlyRate);
  const factor = onePlusR.pow(totalMonths).minus(1).dividedBy(monthlyRate).times(onePlusR);
  const futureValue = P.times(factor);

  return futureValue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Step-up SIP Future Value
 * Monthly SIP amount increases by stepUpPct annually
 */
export function fvStepUpSip(
  initialMonthlyAmount: number,
  annualRatePct: number,
  years: number,
  stepUpPct: number
): number {
  if (initialMonthlyAmount <= 0 || years <= 0) return 0;

  const monthlyRate = new Decimal(annualRatePct).dividedBy(100).dividedBy(12);
  let totalCorpus = new Decimal(0);
  let currentMonthlyAmount = new Decimal(initialMonthlyAmount);

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      // Remaining months until horizon
      const remainingMonths = (years - y) * 12 + (12 - m) + 1;
      const compoundFactor = new Decimal(1).plus(monthlyRate).pow(remainingMonths);
      totalCorpus = totalCorpus.plus(currentMonthlyAmount.times(compoundFactor));
    }
    // Step up annual increase
    currentMonthlyAmount = currentMonthlyAmount.times(new Decimal(1).plus(new Decimal(stepUpPct).dividedBy(100)));
  }

  return totalCorpus.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export interface PpfYearRow {
  year: number;
  openingBalance: number;
  deposit: number; // Max ₹1,50,000 / year
  interestEarned: number;
  closingBalance: number;
  maxWithdrawalAllowed: number;
  loanAllowed: number;
  isWithdrawalEligible: boolean;
  isLoanEligible: boolean;
}

/**
 * Detailed PPF trajectory adhering strictly to official Indian PPF Scheme Rules:
 * 1. Annual deposit capped at ₹1,50,000 (min ₹500).
 * 2. Interest compounded annually, credited on March 31st.
 * 3. 15-year statutory lock-in (extendable in blocks of 5 years).
 * 4. Partial withdrawal allowed from Year 7 onwards:
 *    Up to 50% of the balance at the end of the 4th preceding year OR
 *    preceding year, whichever is lower.
 * 5. Loan facility available between Year 3 and Year 6:
 *    Up to 25% of the balance at the end of the 2nd preceding year.
 */
export function calculatePpfSchedule(
  annualContribution: number,
  annualRatePct: number,
  years: number = 15
): {
  schedule: PpfYearRow[];
  totalInvested: number;
  totalInterest: number;
  maturityCorpus: number;
} {
  // Cap contribution at statutory ₹1,50,000
  const cappedContribution = Math.min(Math.max(annualContribution, 500), 150000);
  const r = new Decimal(annualRatePct).dividedBy(100);

  const schedule: PpfYearRow[] = [];
  let currentBalance = new Decimal(0);
  let totalInvested = new Decimal(0);
  let totalInterest = new Decimal(0);

  for (let year = 1; year <= years; year++) {
    const openingBalance = currentBalance;
    const deposit = new Decimal(cappedContribution);
    totalInvested = totalInvested.plus(deposit);

    // Interest calculated assuming deposit made by the 5th of April (or monthly average)
    // For standard calculation, (openingBalance + deposit) * r
    const interest = openingBalance.plus(deposit).times(r);
    totalInterest = totalInterest.plus(interest);
    currentBalance = openingBalance.plus(deposit).plus(interest);

    // Partial withdrawal rules:
    // Eligible starting from 7th financial year
    let maxWithdrawal = 0;
    const isWithdrawalEligible = year >= 7;
    if (isWithdrawalEligible) {
      // 4th preceding year index = (year - 4) - 1 in 0-indexed array
      const fourthPrecedingYearIdx = year - 5;
      const precedingYearIdx = year - 2;

      const fourthPrecedingBalance = fourthPrecedingYearIdx >= 0 ? schedule[fourthPrecedingYearIdx].closingBalance : 0;
      const precedingBalance = precedingYearIdx >= 0 ? schedule[precedingYearIdx].closingBalance : 0;

      const lowerBalance = Math.min(fourthPrecedingBalance, precedingBalance);
      maxWithdrawal = Math.floor(lowerBalance * 0.5);
    }

    // Loan eligibility:
    // Available from 3rd to 6th financial year
    // Max 25% of balance at end of 2nd preceding financial year
    let maxLoan = 0;
    const isLoanEligible = year >= 3 && year <= 6;
    if (isLoanEligible) {
      const secondPrecedingYearIdx = year - 3;
      const secondPrecedingBalance = secondPrecedingYearIdx >= 0 ? schedule[secondPrecedingYearIdx].closingBalance : 0;
      maxLoan = Math.floor(secondPrecedingBalance * 0.25);
    }

    schedule.push({
      year,
      openingBalance: openingBalance.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      deposit: deposit.toNumber(),
      interestEarned: interest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      closingBalance: currentBalance.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      maxWithdrawalAllowed: maxWithdrawal,
      loanAllowed: maxLoan,
      isWithdrawalEligible,
      isLoanEligible,
    });
  }

  return {
    schedule,
    totalInvested: totalInvested.toNumber(),
    totalInterest: totalInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    maturityCorpus: currentBalance.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}
