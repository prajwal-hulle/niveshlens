export type AssetType = "FD" | "PPF" | "MF" | "LIC";

export type TaxRegime = "NEW" | "OLD";

export type RiskAppetite = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export interface UserProfile {
  age: number;
  annualIncome: number;
  taxRegime: TaxRegime;
  financialYear: "2024-25" | "2025-26" | "2026-27";
  investmentMode: "LUMPSUM" | "SIP";
  investmentAmount: number; // Principal for lumpsum, or monthly SIP amount
  horizonYears: number;
  riskAppetite: RiskAppetite;
  riskScore: number; // 0 to 100
  liquidityNeedMonths: number;
  dependents: number;
  existingLifeCover: number;
  outstandingLiabilities: number;
  goalType: "RETIREMENT" | "CHILD_EDUCATION" | "WEALTH" | "TAX_SAVING";
}

export interface CashFlow {
  year: number;
  date?: string;
  amount: number; // negative for outflow (investment), positive for inflow (return/maturity)
  description?: string;
}

export interface ProjectionScenario {
  year: number;
  pessimistic: number | null;
  base: number | null;
  optimistic: number | null;
  investedCapital: number;
}

export interface InstrumentMetrics {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  nominalReturnPct: number;
  postTaxReturnPct: number;
  realReturnPct: number; // via Fisher formula: (1+n)/(1+i) - 1
  effectiveIrrPct: number;
  volatilityPct: number; // Annualized standard deviation of daily returns
  maxDrawdownPct: number;
  worst1YrReturnPct?: number;
  probabilityOfLossPct?: number;
  sharpeRatio?: number;
  totalCharges: number; // ₹ expense ratio, exit loads, surrender penalty, GST
  expenseRatioPct?: number | null;
  taxBenefit80C: number; // ₹ 80C deduction claimed in Year 1
  liquidityScore: number; // 0 to 100
  lockInPeriodMonths: number;
  prematurePenaltyPct: number;
  projectedCorpus: {
    pessimistic: number | null;
    base: number;
    optimistic: number | null;
  };
  hasInsufficientHistory?: boolean;
  radarScores: {
    returns: number;
    safety: number;
    liquidity: number;
    taxEfficiency: number;
    flexibility: number;
    transparency: number;
  };
  compositeScore: number;
  dataSource: {
    name: string;
    url: string;
    lastUpdated: string;
    isSeed?: boolean;
  };
}

export interface TradeoffFlag {
  id: string;
  instrumentId: string;
  instrumentName: string;
  severity: "info" | "warn" | "critical";
  title: string;
  evidence: string;
  whyItMatters: string;
  source: string;
}

export interface InsuranceAdequacyResult {
  humanLifeValueGap: number;
  recommendedLifeCover: number;
  existingCover: number;
  incomeMultiple: number;
  selectedPlanCover: number;
  hasGap: boolean;
  coverageStatus: "ADEQUATE" | "DEFICIT" | "UNINSURED";
  explanation: string;
  formulaExplanation?: string;
}

export interface BTIRComparisonResult {
  licAnnualPremium: number;
  licPolicyTerm: number;
  licSumAssured: number;
  licProjectedCorpus: number;
  licEffectiveIrrPct: number;
  termInsuranceAnnualPremium: number;
  termLifeCover: number;
  annualDifferenceInvested: number;
  btirCorpusPpf: number;
  btirCorpusMf: number;
  wealthAdvantagePpf: number;
  wealthAdvantageMf: number;
  coverAdvantage: number;
}
