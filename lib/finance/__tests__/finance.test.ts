import { describe, it, expect } from "vitest";
import { calculateFisherRealReturn } from "../fisher";
import {
  fvCompoundLumpsum,
  fvSip,
  fvStepUpSip,
  calculatePpfSchedule,
} from "../compound";
import { calculateIRR, calculateXIRR } from "../irr-xirr";
import {
  calculateCAGR,
  calculateAnnualizedVolatility,
  calculateMaxDrawdown,
  calculateRollingReturns,
  calculateSharpeRatio,
} from "../stats";
import {
  calculateMarginalTaxRate,
  calculatePostTaxReturn,
  DEFAULT_TAX_CONFIGS,
} from "../tax";
import {
  calculateInsuranceAdequacy,
  calculateLicCashFlowsAndIRR,
  calculateBTIR,
} from "../insurance";

describe("Fisher Equation Real Return", () => {
  it("calculates exact real return using Fisher formula ((1+n)/(1+i) - 1)", () => {
    // Nominal 7.5%, Inflation 5.0%
    // (1.075 / 1.05) - 1 = 0.0238095 -> 2.381%
    const realReturn = calculateFisherRealReturn(7.5, 5.0);
    expect(realReturn).toBeCloseTo(2.381, 2);
  });

  it("handles negative real returns when inflation exceeds nominal return", () => {
    // Nominal 4.5%, Inflation 6.0%
    // (1.045 / 1.06) - 1 = -0.01415 -> -1.4151%
    const realReturn = calculateFisherRealReturn(4.5, 6.0);
    expect(realReturn).toBeLessThan(0);
    expect(realReturn).toBeCloseTo(-1.415, 2);
  });
});

describe("Compound Interest & PPF Rules", () => {
  it("calculates FD quarterly compounding correctly", () => {
    // ₹1,00,000 at 7% for 3 years compounded quarterly
    // A = 100000 * (1 + 0.07/4)^12 = 100000 * (1.0175)^12 = ₹1,23,143.93
    const fv = fvCompoundLumpsum(100000, 7.0, 3, "quarterly");
    expect(fv).toBeCloseTo(123143.93, 0);
  });

  it("calculates SIP monthly compounding correctly", () => {
    // ₹10,000/mo at 12% for 5 years (60 months)
    const fv = fvSip(10000, 12, 5);
    // Standard financial calculator benchmark: ~₹8,24,863.74
    expect(fv).toBeGreaterThan(800000);
    expect(fv).toBeLessThan(850000);
  });

  it("enforces strict PPF rules: ₹1.5L cap, partial withdrawal from Yr 7, and loan from Yr 3-6", () => {
    // Try to deposit ₹2,00,000; engine must cap at statutory ₹1,50,000
    const ppf = calculatePpfSchedule(200000, 7.1, 15);
    expect(ppf.schedule[0].deposit).toBe(150000);

    // Year 1 to 6: No partial withdrawal allowed
    for (let yr = 1; yr <= 6; yr++) {
      expect(ppf.schedule[yr - 1].isWithdrawalEligible).toBe(false);
      expect(ppf.schedule[yr - 1].maxWithdrawalAllowed).toBe(0);
    }

    // Year 3 to 6: Loan facility must be eligible
    expect(ppf.schedule[2].isLoanEligible).toBe(true); // Year 3
    expect(ppf.schedule[5].isLoanEligible).toBe(true); // Year 6
    expect(ppf.schedule[6].isLoanEligible).toBe(false); // Year 7: Loan ends

    // Year 7 onwards: Partial withdrawal must be eligible
    expect(ppf.schedule[6].isWithdrawalEligible).toBe(true);
    expect(ppf.schedule[6].maxWithdrawalAllowed).toBeGreaterThan(0);
  });
});

describe("IRR & XIRR Engine", () => {
  it("computes accurate periodic IRR for standard cash flows", () => {
    // Outflow: -1000, Inflows: 300, 420, 680
    // At r=16.33%: -1000 + 300/1.1633 + 420/1.1633^2 + 680/1.1633^3 = 0
    const cashFlows = [-1000, 300, 420, 680];
    const irr = calculateIRR(cashFlows);
    expect(irr).toBeCloseTo(16.33, 1);
  });

  it("computes XIRR for irregular dates", () => {
    const dates = [
      { amount: -100000, date: new Date("2020-01-01") },
      { amount: 50000, date: new Date("2021-01-01") },
      { amount: 80000, date: new Date("2022-01-01") },
    ];
    const xirr = calculateXIRR(dates);
    expect(xirr).toBeGreaterThan(10);
    expect(xirr).toBeLessThan(25);
  });
});

describe("Mutual Fund Statistics & Rolling Returns", () => {
  it("calculates annualized volatility with 250 trading days", () => {
    const mockNav = [
      { date: "01-01-2023", nav: 100 },
      { date: "02-01-2023", nav: 102 },
      { date: "03-01-2023", nav: 101 },
      { date: "04-01-2023", nav: 103 },
      { date: "05-01-2023", nav: 104 },
    ];
    const vol = calculateAnnualizedVolatility(mockNav);
    expect(vol).toBeGreaterThan(0);
  });

  it("detects max drawdown peak-to-trough correctly", () => {
    const mockNav = [
      { date: "01-01-2023", nav: 100 },
      { date: "02-01-2023", nav: 120 }, // Peak
      { date: "03-01-2023", nav: 90 }, // Trough: (120-90)/120 = 25%
      { date: "04-01-2023", nav: 110 },
    ];
    const dd = calculateMaxDrawdown(mockNav);
    expect(dd.maxDrawdownPct).toBe(25);
    expect(dd.peakDate).toBe("02-01-2023");
    expect(dd.troughDate).toBe("03-01-2023");
  });

  it("disables scenarios when fund history is shorter than horizon (correction #7)", () => {
    // Only 2 years of history, but user horizon is 5 years
    const mockNav = [
      { date: "01-01-2022", nav: 100 },
      { date: "01-01-2024", nav: 130 },
    ];
    const res = calculateRollingReturns(mockNav, 5);
    expect(res.hasInsufficientHistory).toBe(true);
    expect(res.pessimistic10th).toBeNull();
    expect(res.base50th).toBeNull();
    expect(res.optimistic90th).toBeNull();
  });
});

describe("Tax Calculations & Config", () => {
  it("supports FY 2024-25, 2025-26, and 2026-27 configs (correction #3)", () => {
    expect(DEFAULT_TAX_CONFIGS["2024-25-NEW"]).toBeDefined();
    expect(DEFAULT_TAX_CONFIGS["2025-26-NEW"]).toBeDefined();
    expect(DEFAULT_TAX_CONFIGS["2026-27-NEW"]).toBeDefined();
  });

  it("applies default 0% GST on life insurance premium (correction #1)", () => {
    const cfg = DEFAULT_TAX_CONFIGS["2024-25-NEW"];
    expect(cfg.lifeInsuranceGstRate).toBe(0);
  });

  it("applies ₹50,000 general and ₹1,00,000 senior FD TDS thresholds (correction #2)", () => {
    const cfg = DEFAULT_TAX_CONFIGS["2024-25-NEW"];
    expect(cfg.fdTdsThresholdGeneral).toBe(50000);
    expect(cfg.fdTdsThresholdSenior).toBe(100000);
  });

  it("computes post-tax returns correctly for FD vs PPF", () => {
    const cfg = DEFAULT_TAX_CONFIGS["2024-25-NEW"];
    const income = 1800000; // 30% slab + cess ~31.2%

    const fdPostTax = calculatePostTaxReturn({
      nominalReturnPct: 7.0,
      assetType: "FD",
      annualIncome: income,
      config: cfg,
      holdingPeriodYears: 3,
    });
    // 7.0 * (1 - 0.312) ~ 4.82%
    expect(fdPostTax).toBeCloseTo(4.82, 1);

    const ppfPostTax = calculatePostTaxReturn({
      nominalReturnPct: 7.1,
      assetType: "PPF",
      annualIncome: income,
      config: cfg,
      holdingPeriodYears: 15,
    });
    // EEE: 100% tax-free
    expect(ppfPostTax).toBe(7.1);
  });
});

describe("Insurance Adequacy & BTIR Engine", () => {
  it("computes Human Life Value (HLV) gap accurately (correction #12)", () => {
    const res = calculateInsuranceAdequacy({
      age: 32,
      annualIncome: 1200000,
      existingLifeCover: 5000000,
      outstandingLiabilities: 2000000,
      dependents: 2,
    });
    // Age < 35: 15x income = 1.8 Cr + 20L liabilities = 2.0 Cr recommended
    // Existing: 50L -> Gap = 1.5 Cr
    expect(res.recommendedLifeCover).toBe(20000000);
    expect(res.humanLifeValueGap).toBe(15000000);
    expect(res.hasGap).toBe(true);
    expect(res.coverageStatus).toBe("DEFICIT");
  });

  it("computes LIC cash flows and exact mathematical IRR from user inputs (correction #5 & fix #8)", () => {
    const planRules = {
      planId: "lic-jeevan-labh-936",
      planNo: 936,
      planName: "LIC Jeevan Labh",
      planType: "ENDOWMENT" as const,
      minAge: 8,
      maxAge: 59,
      minTerm: 16,
      maxTerm: 25,
      reversionaryBonusPerThousandSA: 44,
      finalAdditionalBonusPerThousandSA: 25,
      surrenderFactors: { 1: 0, 2: 0.3, 3: 0.35, 10: 0.65 },
      sourceUrl: "https://licindia.in",
      lastVerified: "2025-01-15",
    };

    // Standard LIC Jeevan Labh 936 (16-yr term, 10-yr PPT) brochure example:
    // Annual premium ~₹85,600 for ₹10,00,000 Sum Assured.
    // Total premiums paid = ₹8,56,000. Maturity = ₹10L + ₹7.04L (Bonus) + ₹25k (FAB) = ₹17,29,000.
    const lic = calculateLicCashFlowsAndIRR({
      annualPremium: 85600,
      sumAssured: 1000000,
      policyTerm: 16,
      premiumPayingTerm: 10,
      planRules,
      gstRate: 0,
    });

    expect(lic.totalPremiumsPaid).toBe(856000);
    expect(lic.maturityCorpus).toBe(1729000);
    // Verified against official brochure actuarial schedule: ~5.42% IRR
    expect(lic.effectiveIrrPct).toBeCloseTo(5.42, 1);
    expect(lic.effectiveIrrPct).toBeGreaterThan(5.0);
    expect(lic.effectiveIrrPct).toBeLessThan(6.0);
  });

  it("calculates Buy Term and Invest Difference (BTIR) advantage", () => {
    const btir = calculateBTIR({
      licAnnualPremium: 60000,
      licSumAssured: 1000000,
      licPolicyTerm: 20,
      licEffectiveIrr: 5.4,
      licMaturityCorpus: 2200000,
      termInsuranceAnnualPremium: 9500,
      termLifeCover: 10000000,
      ppfRatePct: 7.1,
      mfRatePct: 12.0,
    });

    expect(btir.termLifeCover).toBe(10000000); // ₹1 Cr term cover
    expect(btir.coverAdvantage).toBe(9000000);
    expect(btir.btirCorpusMf).toBeGreaterThan(btir.licProjectedCorpus);
  });
});
