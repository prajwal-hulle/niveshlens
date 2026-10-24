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
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Compass className="w-3.5 h-3.5" />
          <span>Investor Profile Wizard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Personalize Your Financial Lens
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Accurate comparisons require your tax slab, risk capacity, and liquidity horizon. All calculations adapt dynamically.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((step) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-navy-900 text-white dark:bg-emerald-500 dark:text-slate-950 ring-4 ring-emerald-500/20"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1.5 hidden sm:block text-center">
                    {stepTitles[step - 1]}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 rounded transition-colors ${
                      currentStep > step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Step Form Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Demographics & Income */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                Demographics & Taxation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Age (Years)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    {age >= 60 ? "Eligible for Senior Citizen FD rates (+0.50%)" : "General tax & deposit slab"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Taxable Income (₹)
                  </label>
                  <input
                    type="number"
                    step={50000}
                    min={100000}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {formatINR(annualIncome)} / year
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Regime
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxRegime("NEW")}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        taxRegime === "NEW"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      New Regime (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxRegime("OLD")}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        taxRegime === "OLD"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Old Regime (with 80C)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="2024-25">FY 2024-25 (Current)</option>
                    <option value="2025-26">FY 2025-26 (Revised intervals)</option>
                    <option value="2026-27">FY 2026-27 (Forward projection)</option>
                  </select>
                  {financialYear === "2026-27" && (
                    <a
                      href="https://www.incometax.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 hover:underline"
                    >
                      ⚠️ Unverified projection – verify at incometax.gov.in
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Investment Plan & Horizon */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Investment Horizon & Mode
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Investment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInvestmentMode("SIP")}
                      className={`p-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                        investmentMode === "SIP"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Monthly SIP / Recurring
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestmentMode("LUMPSUM")}
                      className={`p-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                        investmentMode === "LUMPSUM"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      One-time Lump Sum
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {investmentMode === "SIP" ? "Monthly Contribution" : "Initial Lump Sum Capital"}
                    </label>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{investmentMode === "SIP" ? "₹500/mo" : "₹10,000"}</span>
                    <span>{investmentMode === "SIP" ? "₹2,00,000/mo" : "₹50 Lakhs"}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Investment Horizon (Years)
                    </label>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1 Year</span>
                    <span>15 Years (PPF maturity)</span>
                    <span>30 Years</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Liquidity Window
                  </label>
                  <select
                    value={liquidityNeedMonths}
                    onChange={(e) => setLiquidityNeedMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  Objective Risk Appetite Scoring
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    riskAppetite === "AGGRESSIVE"
                      ? "bg-rose-500/10 text-rose-600"
                      : riskAppetite === "MODERATE"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
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
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-500" />
                Insurance Adequacy & Family Liabilities
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Financially Dependent Family Members
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={dependents}
                    onChange={(e) => setDependents(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Goal
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Existing Life Insurance Cover (₹)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={existingLifeCover}
                    onChange={(e) => setExistingLifeCover(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    Sum total of all term & traditional policies
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outstanding Loans & Liabilities (₹)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={outstandingLiabilities}
                    onChange={(e) => setOutstandingLiabilities(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    Home loans, car loans, personal debts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAndCompare}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                Launch Comparator
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Summary & Adequacy Preview Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-5">
            <h3 className="font-heading font-bold text-sm tracking-wide text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Live Profile Synthesis
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Risk Profile:</span>
                <span className="font-bold text-emerald-400 uppercase">{riskAppetite}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Horizon:</span>
                <span className="font-bold">{horizonYears} Years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Planned Allocation:</span>
                <span className="font-bold text-emerald-400">
                  {formatINR(investmentAmount)} {investmentMode === "SIP" ? "/ mo" : "lumpsum"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Tax Regime:</span>
                <span className="font-bold">{taxRegime} Regime ({financialYear})</span>
              </div>
            </div>

            {/* Insurance Gap Panel (correction #12) */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Human Life Value (HLV) Check
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">Target Cover ({adequacy.incomeMultiple}x):</span>
                <span className="text-xs font-bold text-white">{formatINR(adequacy.recommendedLifeCover)}</span>
              </div>
              {adequacy.hasGap ? (
                <div className="pt-1 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                  <span>Protection Gap:</span>
                  <span className="tabular-nums">{formatINR(adequacy.humanLifeValueGap)}</span>
                </div>
              ) : (
                <div className="pt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Adequately Protected</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCompleteAndCompare}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Compare Instruments with this Profile</span>
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
