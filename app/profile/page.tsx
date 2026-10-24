"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiskQuestionnaire } from "@/components/profile/risk-questionnaire";
import { formatINR } from "@/lib/utils";
import { calculateInsuranceAdequacy } from "@/lib/finance/insurance";
import { RiskAppetite, TaxRegime, UserProfile } from "@/lib/finance/types";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Coins,
  Calendar,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard step (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State initialized from URL query params if present, else defaults
  const [age, setAge] = useState(Number(searchParams.get("age")) || 32);
  const [annualIncome, setAnnualIncome] = useState(Number(searchParams.get("income")) || 1200000);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>((searchParams.get("regime") as TaxRegime) || "NEW");
  const [financialYear, setFinancialYear] = useState<"2024-25" | "2025-26" | "2026-27">("2024-25");
  const [investmentMode, setInvestmentMode] = useState<"LUMPSUM" | "SIP">(
    (searchParams.get("mode") as any) || "SIP"
  );
  const [investmentAmount, setInvestmentAmount] = useState(Number(searchParams.get("amount")) || 15000);
  const [horizonYears, setHorizonYears] = useState(Number(searchParams.get("horizon")) || 10);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(
    (searchParams.get("risk") as RiskAppetite) || "MODERATE"
  );
  const [riskScore, setRiskScore] = useState(Number(searchParams.get("riskScore")) || 52);
  const [liquidityNeedMonths, setLiquidityNeedMonths] = useState(
    Number(searchParams.get("liquidity")) || 36
  );
  const [dependents, setDependents] = useState(Number(searchParams.get("dependents")) || 2);
  const [existingLifeCover, setExistingLifeCover] = useState(
    Number(searchParams.get("existingCover")) || 2500000
  );
  const [outstandingLiabilities, setOutstandingLiabilities] = useState(
    Number(searchParams.get("liabilities")) || 1000000
  );
  const [goalType, setGoalType] = useState<"RETIREMENT" | "CHILD_EDUCATION" | "WEALTH" | "TAX_SAVING">(
    (searchParams.get("goal") as any) || "WEALTH"
  );

  // Computed insurance adequacy on live profile
  const adequacy = calculateInsuranceAdequacy({
    age,
    annualIncome,
    existingLifeCover,
    outstandingLiabilities,
    dependents,
  });

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleCompleteAndCompare = () => {
    const params = new URLSearchParams({
      age: age.toString(),
      income: annualIncome.toString(),
      regime: taxRegime,
      fy: financialYear,
      mode: investmentMode,
      amount: investmentAmount.toString(),
      horizon: horizonYears.toString(),
      risk: riskAppetite,
      riskScore: riskScore.toString(),
      liquidity: liquidityNeedMonths.toString(),
      dependents: dependents.toString(),
      existingCover: existingLifeCover.toString(),
      liabilities: outstandingLiabilities.toString(),
      goal: goalType,
    });
    router.push(`/compare?${params.toString()}`);
  };

  const stepTitles = [
    "Demographics & Income",
    "Investment Plan & Horizon",
    "Risk Tolerance Scoring",
    "Protection & Liabilities",
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="mb-6 text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
          Investor risk profile
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto">
          Calibrate your tax slab, risk capacity, and liquidity needs.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3, 4].map((step) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isCompleted
                        ? "bg-primary text-white"
                        : isCurrent
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-surface-muted border border-border text-text-muted"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
                  </div>
                  <span className="text-[11px] font-medium text-text-muted mt-1.5 hidden sm:block text-center">
                    {stepTitles[step - 1]}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-0.5 flex-1 rounded transition-colors ${
                      currentStep > step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Step Form Card */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6 shadow-sm space-y-6 transition-colors">
          {/* STEP 1: Demographics & Income */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Demographics &amp; taxation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Your age (years)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[11px] text-text-muted">
                    {age >= 60 ? "Eligible for Senior Citizen FD rates (+0.50%)" : "General tax & deposit slab"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Annual taxable income (₹)
                  </label>
                  <input
                    type="number"
                    step={50000}
                    min={100000}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[11px] text-primary font-medium">
                    {formatINR(annualIncome)} / year
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Tax regime
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxRegime("NEW")}
                      className={`p-2.5 rounded-lg text-xs font-medium border transition-colors ${
                        taxRegime === "NEW"
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      New Regime
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxRegime("OLD")}
                      className={`p-2.5 rounded-lg text-xs font-medium border transition-colors ${
                        taxRegime === "OLD"
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      Old Regime (with 80C)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Financial year
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="2024-25">FY 2024-25</option>
                    <option value="2025-26">FY 2025-26</option>
                    <option value="2026-27">FY 2026-27 (Forward projection)</option>
                  </select>
                  {financialYear === "2026-27" && (
                    <a
                      href="https://www.incometax.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-warning mt-1 hover:underline"
                    >
                      ⚠️ FY 2026-27 unverified
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Investment Plan & Horizon */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Investment horizon &amp; mode
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Investment mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInvestmentMode("SIP")}
                      className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                        investmentMode === "SIP"
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Monthly SIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestmentMode("LUMPSUM")}
                      className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                        investmentMode === "LUMPSUM"
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      Lump sum
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-text">
                      {investmentMode === "SIP" ? "Monthly contribution" : "Initial lump sum capital"}
                    </label>
                    <span className="text-xs font-semibold text-primary">
                      {formatINR(investmentAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={investmentMode === "SIP" ? 500 : 10000}
                    max={investmentMode === "SIP" ? 200000 : 5000000}
                    step={investmentMode === "SIP" ? 500 : 10000}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>{investmentMode === "SIP" ? "₹500/mo" : "₹10,000"}</span>
                    <span>{investmentMode === "SIP" ? "₹2,00,000/mo" : "₹50 Lakhs"}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-text">
                      Investment horizon (years)
                    </label>
                    <span className="text-xs font-semibold text-primary">
                      {horizonYears} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={horizonYears}
                    onChange={(e) => setHorizonYears(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>1 yr</span>
                    <span>15 yrs (PPF)</span>
                    <span>30 yrs</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Emergency liquidity window
                  </label>
                  <select
                    value={liquidityNeedMonths}
                    onChange={(e) => setLiquidityNeedMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value={6}>6 Months (High emergency liquidity need)</option>
                    <option value={12}>12 Months (Medium liquidity access)</option>
                    <option value={36}>36 Months (Comfortable emergency reserves)</option>
                    <option value={84}>7+ Years (Zero emergency withdrawal needed)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Risk Tolerance Scoring */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Risk appetite assessment
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    riskAppetite === "AGGRESSIVE"
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : riskAppetite === "MODERATE"
                      ? "bg-warning/10 text-warning border border-warning/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  {riskAppetite} ({riskScore} / 100)
                </span>
              </div>

              <RiskQuestionnaire
                onComplete={(appetite, score) => {
                  setRiskAppetite(appetite);
                  setRiskScore(score);
                }}
              />
            </div>
          )}

          {/* STEP 4: Protection & Liabilities */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-primary" />
                Insurance adequacy &amp; liabilities
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Dependent family members
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={dependents}
                    onChange={(e) => setDependents(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Primary goal
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="WEALTH">Long Term Wealth Creation</option>
                    <option value="RETIREMENT">Retirement Corpus</option>
                    <option value="CHILD_EDUCATION">Child Higher Education</option>
                    <option value="TAX_SAVING">Section 80C Tax Minimization</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Existing life insurance cover (₹)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={existingLifeCover}
                    onChange={(e) => setExistingLifeCover(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[11px] text-text-muted">
                    Total term &amp; traditional cover
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Outstanding loans &amp; liabilities (₹)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={outstandingLiabilities}
                    onChange={(e) => setOutstandingLiabilities(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-[11px] text-text-muted">
                    Home, vehicle, or personal loans
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text hover:bg-surface-muted transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAndCompare}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Compare with this profile
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Summary & Adequacy Preview Panel */}
        <div className="space-y-4">
          <div className="bg-surface rounded-xl p-5 border border-border shadow-sm space-y-4 transition-colors">
            <h3 className="font-semibold text-sm text-text border-b border-border pb-2.5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Profile summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Risk profile:</span>
                <span className="font-semibold text-primary">{riskAppetite}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Horizon:</span>
                <span className="font-medium text-text">{horizonYears} Years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Planned allocation:</span>
                <span className="font-semibold text-primary">
                  {formatINR(investmentAmount)} {investmentMode === "SIP" ? "/ mo" : "lump sum"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Tax regime:</span>
                <span className="font-medium text-text">{taxRegime} Regime ({financialYear})</span>
              </div>
            </div>

            {/* Insurance Gap Panel */}
            <div className="p-3 rounded-lg bg-surface-muted border border-border space-y-1.5">
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Human Life Value (HLV) Check
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-text-muted">Target cover ({adequacy.incomeMultiple}x):</span>
                <span className="text-xs font-semibold text-text">{formatINR(adequacy.recommendedLifeCover)}</span>
              </div>
              {adequacy.hasGap ? (
                <div className="pt-1 text-xs text-danger font-medium flex items-center gap-1.5">
                  <span>Protection gap:</span>
                  <span className="tabular-nums font-semibold">{formatINR(adequacy.humanLifeValueGap)}</span>
                </div>
              ) : (
                <div className="pt-1 text-xs text-primary font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Adequately protected</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCompleteAndCompare}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Compare with profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-slate-500">Loading profile wizard...</div>}>
      <ProfileContent />
    </React.Suspense>
  );
}
