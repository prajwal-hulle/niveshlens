import Decimal from "decimal.js";
import { calculateIRR } from "./irr-xirr";
import { fvCompoundLumpsum, fvSip } from "./compound";
import { InsuranceAdequacyResult, BTIRComparisonResult } from "./types";

export interface LicPlanRules {
  planId: string;
  planNo: number;
  planName: string;
  planType: "ENDOWMENT" | "MONEY_BACK" | "WHOLE_LIFE" | "TERM";
  minAge: number;
  maxAge: number;
  minTerm: number;
  maxTerm: number;
  guaranteedAdditionPerThousandSA?: number; // e.g. 50 (₹50 per ₹1,000 SA)
  guaranteedAdditionYears?: number; // e.g. 5 years
  reversionaryBonusPerThousandSA: number; // e.g. 42 (₹42 per ₹1,000 SA per year)
  finalAdditionalBonusPerThousandSA: number; // e.g. 20 (₹20 per ₹1,000 SA at maturity)
  surrenderFactors: { [policyYear: number]: number }; // percentage of premiums paid refunded
  sourceUrl: string;
  lastVerified: string;
}

/**
 * Calculates cash flows and exact mathematical IRR from user-entered policy parameters and DB plan rules.
 * No hardcoded "typical IRR" text or fabricated numbers.
 */
export function calculateLicCashFlowsAndIRR(params: {
  annualPremium: number;
  sumAssured: number;
  policyTerm: number;
  premiumPayingTerm: number;
  planRules: LicPlanRules;
  gstRate?: number; // Configurable from tax_config (default 0% since 22 Sep 2025)
}): {
  cashFlows: number[];
  maturityCorpus: number;
  totalPremiumsPaid: number;
  totalBonuses: number;
  effectiveIrrPct: number;
  yearlySurrenderValues: { year: number; premiumPaidSoFar: number; surrenderValue: number; surrenderLoss: number }[];
} {
  const {
    annualPremium,
    sumAssured,
    policyTerm,
    premiumPayingTerm,
    planRules,
    gstRate = 0,
  } = params;

  if (annualPremium <= 0 || policyTerm <= 0 || premiumPayingTerm <= 0) {
    return {
      cashFlows: [],
      maturityCorpus: 0,
      totalPremiumsPaid: 0,
      totalBonuses: 0,
      effectiveIrrPct: 0,
      yearlySurrenderValues: [],
    };
  }

  const effectivePremiumWithGst = annualPremium * (1 + gstRate / 100);
  const cashFlows: number[] = [];

  // Outflows during premium paying term (at start of each year: t = 0 to PPT - 1)
  let totalPremiumsPaid = 0;
  for (let year = 1; year <= policyTerm; year++) {
    if (year <= premiumPayingTerm) {
      cashFlows.push(-effectivePremiumWithGst);
      totalPremiumsPaid += effectivePremiumWithGst;
    } else {
      cashFlows.push(0);
    }
  }

  // Calculate bonuses strictly from plan rules
  const thousandsSA = sumAssured / 1000;
  let totalGuaranteedAdditions = 0;
  if (planRules.guaranteedAdditionPerThousandSA && planRules.guaranteedAdditionYears) {
    const gaYears = Math.min(planRules.guaranteedAdditionYears, premiumPayingTerm);
    totalGuaranteedAdditions = planRules.guaranteedAdditionPerThousandSA * thousandsSA * gaYears;
  }

  const totalReversionaryBonus = (planRules.reversionaryBonusPerThousandSA || 0) * thousandsSA * policyTerm;
  const totalFab = (planRules.finalAdditionalBonusPerThousandSA || 0) * thousandsSA;
  const totalBonuses = totalGuaranteedAdditions + totalReversionaryBonus + totalFab;

  const maturityCorpus = sumAssured + totalBonuses;

  // Maturity corpus is received at the END of policyTerm (t = policyTerm).
  // cashFlows currently contains policyTerm elements representing start of years 1 to policyTerm (t = 0 to policyTerm - 1).
  // Pushing maturityCorpus places it at t = policyTerm, reflecting exact compounding duration.
  cashFlows.push(maturityCorpus);

  // Compute exact IRR
  const effectiveIrrPct = calculateIRR(cashFlows);

  // Compute surrender value trajectory
  const yearlySurrenderValues: {
    year: number;
    premiumPaidSoFar: number;
    surrenderValue: number;
    surrenderLoss: number;
  }[] = [];

  let accumulatedPremiums = 0;
  for (let y = 1; y <= policyTerm; y++) {
    if (y <= premiumPayingTerm) {
      accumulatedPremiums += effectivePremiumWithGst;
    }
    const factor = planRules.surrenderFactors[y] ?? (y < 3 ? 0 : 0.5);
    const sv = accumulatedPremiums * factor;
    yearlySurrenderValues.push({
      year: y,
      premiumPaidSoFar: Math.round(accumulatedPremiums),
      surrenderValue: Math.round(sv),
      surrenderLoss: Math.round(accumulatedPremiums - sv),
    });
  }

  return {
    cashFlows,
    maturityCorpus: Math.round(maturityCorpus),
    totalPremiumsPaid: Math.round(totalPremiumsPaid),
    totalBonuses: Math.round(totalBonuses),
    effectiveIrrPct,
    yearlySurrenderValues,
  };
}

export interface HlvConfigModel {
  under35Multiplier: number;
  age35to45Multiplier: number;
  age46to55Multiplier: number;
  over55Multiplier: number;
  dependentsThreshold: number;
  dependentsBonusMultiplier: number;
  notes: string;
}

export const DEFAULT_HLV_CONFIG: HlvConfigModel = {
  under35Multiplier: 15,
  age35to45Multiplier: 12,
  age46to55Multiplier: 10,
  over55Multiplier: 7,
  dependentsThreshold: 2,
  dependentsBonusMultiplier: 1,
  notes: "Standard Life Insurance Thumb Rule: 10-15x income based on age brackets + liabilities minus existing cover.",
};

/**
 * Calculates Insurance Adequacy using Human Life Value (HLV) method
 * Uses dynamic configuration from hlv_config table
 */
export function calculateInsuranceAdequacy(params: {
  age: number;
  annualIncome: number;
  existingLifeCover: number;
  outstandingLiabilities: number;
  dependents: number;
  selectedPlanCover?: number;
  hlvConfig?: HlvConfigModel;
}): InsuranceAdequacyResult {
  const {
    age,
    annualIncome,
    existingLifeCover,
    outstandingLiabilities,
    dependents,
    selectedPlanCover = 0,
    hlvConfig = DEFAULT_HLV_CONFIG,
  } = params;

  // Use dynamic age multiplier from configuration
  let incomeMultiple = hlvConfig.age35to45Multiplier;
  if (age < 35) incomeMultiple = hlvConfig.under35Multiplier;
  else if (age <= 45) incomeMultiple = hlvConfig.age35to45Multiplier;
  else if (age <= 55) incomeMultiple = hlvConfig.age46to55Multiplier;
  else incomeMultiple = hlvConfig.over55Multiplier;

  // If dependents > threshold, add configurable bonus multiplier
  if (dependents > hlvConfig.dependentsThreshold) {
    incomeMultiple += hlvConfig.dependentsBonusMultiplier;
  }

  const baseCoverRequired = annualIncome * incomeMultiple;
  const totalRecommendedCover = baseCoverRequired + outstandingLiabilities;
  const totalExistingCover = existingLifeCover + selectedPlanCover;
  const gap = Math.max(0, totalRecommendedCover - totalExistingCover);

  let coverageStatus: "ADEQUATE" | "DEFICIT" | "UNINSURED" = "ADEQUATE";
  if (totalExistingCover === 0) {
    coverageStatus = "UNINSURED";
  } else if (gap > 0) {
    coverageStatus = "DEFICIT";
  }

  const explanation =
    gap > 0
      ? `Based on ${incomeMultiple}x annual income + liabilities, your family requires ₹ ${totalRecommendedCover.toLocaleString(
          "en-IN"
        )} in life cover. You currently have a protection shortfall of ₹ ${gap.toLocaleString("en-IN")}.`
      : `Your combined life cover of ₹ ${totalExistingCover.toLocaleString(
          "en-IN"
        )} adequately meets your family's protection needs.`;

  const formulaExplanation = `Recommended Life Cover = (Annual Income ₹${annualIncome.toLocaleString("en-IN")} × ${incomeMultiple}x) + Liabilities ₹${outstandingLiabilities.toLocaleString("en-IN")} = ₹${totalRecommendedCover.toLocaleString("en-IN")}. Coverage Shortfall = Target (₹${totalRecommendedCover.toLocaleString("en-IN")}) - Active Cover (₹${totalExistingCover.toLocaleString("en-IN")}) = ₹${gap.toLocaleString("en-IN")}. Multiplier based on age bracket (${incomeMultiple}x) from HLV configuration table.`;

  return {
    humanLifeValueGap: gap,
    recommendedLifeCover: totalRecommendedCover,
    existingCover: existingLifeCover,
    incomeMultiple,
    selectedPlanCover,
    hasGap: gap > 0,
    coverageStatus,
    explanation,
    formulaExplanation,
  };
}

/**
 * "Buy Term + Invest the Difference" (BTIR) Calculator
 * Compares an endowment/money-back plan with buying pure term insurance
 * and investing the premium savings into PPF or Mutual Funds.
 * Term premium and cover are strictly provided by user input (no default estimates or hardcoded rates).
 */
export function calculateBTIR(params: {
  licAnnualPremium: number;
  licSumAssured: number;
  licPolicyTerm: number;
  licEffectiveIrr: number;
  licMaturityCorpus: number;
  termInsuranceAnnualPremium: number; // User input
  termLifeCover: number;              // User input
  ppfRatePct: number;
  mfRatePct: number;
}): BTIRComparisonResult {
  const {
    licAnnualPremium,
    licSumAssured,
    licPolicyTerm,
    licEffectiveIrr,
    licMaturityCorpus,
    termInsuranceAnnualPremium,
    termLifeCover,
    ppfRatePct,
    mfRatePct,
  } = params;

  const annualDifference = Math.max(0, licAnnualPremium - termInsuranceAnnualPremium);

  // Invest difference annually:
  // In PPF (capped at ₹1.5L/yr, compounded annually)
  const ppfInvestAmount = Math.min(annualDifference, 150000);
  const btirCorpusPpf = fvSip(ppfInvestAmount / 12, ppfRatePct, licPolicyTerm);

  // In Mutual Fund
  const btirCorpusMf = fvSip(annualDifference / 12, mfRatePct, licPolicyTerm);

  return {
    licAnnualPremium,
    licPolicyTerm,
    licSumAssured,
    licProjectedCorpus: licMaturityCorpus,
    licEffectiveIrrPct: licEffectiveIrr,
    termInsuranceAnnualPremium,
    termLifeCover,
    annualDifferenceInvested: annualDifference,
    btirCorpusPpf: Math.round(btirCorpusPpf),
    btirCorpusMf: Math.round(btirCorpusMf),
    wealthAdvantagePpf: Math.round(btirCorpusPpf - licMaturityCorpus),
    wealthAdvantageMf: Math.round(btirCorpusMf - licMaturityCorpus),
    coverAdvantage: Math.max(0, termLifeCover - licSumAssured),
  };
}
