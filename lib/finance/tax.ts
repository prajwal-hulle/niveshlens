import Decimal from "decimal.js";
import { TaxRegime } from "./types";

export interface TaxSlab {
  min: number;
  max: number | null; // null for above
  rate: number; // percentage, e.g. 5 for 5%
}

export interface TaxConfigModel {
  financialYear: "2024-25" | "2025-26" | "2026-27";
  regime: TaxRegime;
  slabs: TaxSlab[];
  standardDeduction: number;
  rebate87ALimit: number;
  deduction80CLimit: number;
  equityLtcgRate: number; // 12.5%
  equityLtcgExemption: number; // ₹1,25,000
  equityStcgRate: number; // 20%
  fdTdsThresholdGeneral: number; // ₹50,000
  fdTdsThresholdSenior: number; // ₹1,00,000
  lifeInsuranceGstRate: number; // 0% (exempt since 22 Sep 2025)
  notes: string;
}

/**
 * Standard Indian Tax Configurations for FY 2024-25, 2025-26, and 2026-27
 */
export const DEFAULT_TAX_CONFIGS: Record<string, TaxConfigModel> = {
  "2024-25-NEW": {
    financialYear: "2024-25",
    regime: "NEW",
    slabs: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 700000, rate: 5 },
      { min: 700000, max: 1000000, rate: 10 },
      { min: 1000000, max: 1200000, rate: 15 },
      { min: 1200000, max: 1500000, rate: 20 },
      { min: 1500000, max: null, rate: 30 },
    ],
    standardDeduction: 75000,
    rebate87ALimit: 700000,
    deduction80CLimit: 0, // No 80C under New Regime
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "Post-Budget 2024: Std deduction ₹75k, slab revision, LTCG 12.5% with ₹1.25L exemption.",
  },
  "2024-25-OLD": {
    financialYear: "2024-25",
    regime: "OLD",
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: null, rate: 30 },
    ],
    standardDeduction: 50000,
    rebate87ALimit: 500000,
    deduction80CLimit: 150000,
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "Old tax regime with 80C deductions up to ₹1.5L and standard deduction ₹50k.",
  },
  "2025-26-NEW": {
    financialYear: "2025-26",
    regime: "NEW",
    slabs: [
      { min: 0, max: 400000, rate: 0 },
      { min: 400000, max: 800000, rate: 5 },
      { min: 800000, max: 1200000, rate: 10 },
      { min: 1200000, max: 1600000, rate: 15 },
      { min: 1600000, max: 2000000, rate: 20 },
      { min: 2000000, max: 2400000, rate: 25 },
      { min: 2400000, max: null, rate: 30 },
    ],
    standardDeduction: 75000,
    rebate87ALimit: 1200000,
    deduction80CLimit: 0,
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "FY 2025-26 New Regime with revised ₹4L slab intervals. Verify with official CBDT notification.",
  },
  "2025-26-OLD": {
    financialYear: "2025-26",
    regime: "OLD",
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: null, rate: 30 },
    ],
    standardDeduction: 50000,
    rebate87ALimit: 500000,
    deduction80CLimit: 150000,
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "FY 2025-26 Old Regime. Slabs retained from prior year.",
  },
  "2026-27-NEW": {
    financialYear: "2026-27",
    regime: "NEW",
    slabs: [
      { min: 0, max: 400000, rate: 0 },
      { min: 400000, max: 800000, rate: 5 },
      { min: 800000, max: 1200000, rate: 10 },
      { min: 1200000, max: 1600000, rate: 15 },
      { min: 1600000, max: 2000000, rate: 20 },
      { min: 2000000, max: 2400000, rate: 25 },
      { min: 2400000, max: null, rate: 30 },
    ],
    standardDeduction: 75000,
    rebate87ALimit: 1200000,
    deduction80CLimit: 0,
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "FY 2026-27 New Regime projection. Verify with official Ministry of Finance notifications upon release.",
  },
  "2026-27-OLD": {
    financialYear: "2026-27",
    regime: "OLD",
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: null, rate: 30 },
    ],
    standardDeduction: 50000,
    rebate87ALimit: 500000,
    deduction80CLimit: 150000,
    equityLtcgRate: 12.5,
    equityLtcgExemption: 125000,
    equityStcgRate: 20,
    fdTdsThresholdGeneral: 50000,
    fdTdsThresholdSenior: 100000,
    lifeInsuranceGstRate: 0,
    notes: "FY 2026-27 Old Regime projection. Verify with official source.",
  },
};

/**
 * Calculates marginal tax rate for a given annual income and tax config
 */
export function calculateMarginalTaxRate(
  annualIncome: number,
  config: TaxConfigModel
): number {
  const taxableIncome = Math.max(0, annualIncome - config.standardDeduction);

  // If eligible for 87A rebate, effective marginal tax on baseline is 0
  if (taxableIncome <= config.rebate87ALimit) {
    return 0;
  }

  // Find the highest slab that covers the income
  for (const slab of config.slabs) {
    if (slab.max === null || taxableIncome <= slab.max) {
      // Add 4% Health and Education Cess
      const rateWithCess = slab.rate * 1.04;
      return Number(rateWithCess.toFixed(2));
    }
  }

  return 31.2; // 30% + 4% cess
}

/**
 * Calculates post-tax return percentage for an instrument
 */
export function calculatePostTaxReturn(params: {
  nominalReturnPct: number;
  assetType: "FD" | "PPF" | "MF" | "LIC";
  mfCategory?: "EQUITY" | "DEBT" | "HYBRID";
  annualIncome: number;
  config: TaxConfigModel;
  holdingPeriodYears: number;
}): number {
  const { nominalReturnPct, assetType, mfCategory = "EQUITY", annualIncome, config, holdingPeriodYears } = params;

  if (nominalReturnPct <= 0) return nominalReturnPct;

  const marginalRatePct = calculateMarginalTaxRate(annualIncome, config);

  switch (assetType) {
    case "PPF":
      // EEE - 100% tax free
      return nominalReturnPct;

    case "FD":
      // FD interest is fully taxed as 'Income from Other Sources' at slab rate
      const fdPostTax = nominalReturnPct * (1 - marginalRatePct / 100);
      return Number(fdPostTax.toFixed(2));

    case "MF":
      if (mfCategory === "EQUITY") {
        if (holdingPeriodYears >= 1) {
          // LTCG at 12.5% (with cess ~13%)
          // Approximate effective drag accounting for ₹1.25L annual exemption
          const effectiveLtcgRate = config.equityLtcgRate * 1.04;
          const postTax = nominalReturnPct * (1 - effectiveLtcgRate / 100 * 0.9); // assuming part of gain inside exemption
          return Number(postTax.toFixed(2));
        } else {
          // STCG at 20% + 4% cess = 20.8%
          const effectiveStcgRate = config.equityStcgRate * 1.04;
          const postTax = nominalReturnPct * (1 - effectiveStcgRate / 100);
          return Number(postTax.toFixed(2));
        }
      } else {
        // Debt mutual funds: taxed at slab rate post April 2023
        const debtPostTax = nominalReturnPct * (1 - marginalRatePct / 100);
        return Number(debtPostTax.toFixed(2));
      }

    case "LIC":
      // Traditional life insurance policies: Tax-free under Section 10(10D) if premium <= 10% SA
      // and aggregate annual premium <= ₹5,00,000.
      return nominalReturnPct;

    default:
      return nominalReturnPct;
  }
}
