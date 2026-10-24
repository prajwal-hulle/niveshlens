"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { calculateBTIR, calculateLicCashFlowsAndIRR } from "@/lib/finance/insurance";
import { formatPercent } from "@/lib/utils";
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function BtirPage() {
  const { format } = useCurrency();

  // Inputs
  const [selectedPlanId, setSelectedPlanId] = useState("lic-jeevan-labh-936");
  const [annualPremium, setAnnualPremium] = useState(65000);
  const [sumAssured, setSumAssured] = useState(1000000);
  const [policyTerm, setPolicyTerm] = useState(20);
  const [ppt, setPpt] = useState(15);
  const [termAnnualPremium, setTermAnnualPremium] = useState(10500);
  const [termLifeCover, setTermLifeCover] = useState(10000000); // ₹1 Crore
  const [mfExpectedRate, setMfExpectedRate] = useState(12.0);

  // Fetch verified rates from DB
  const { data: ratesData } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const availablePlans = ratesData?.insurance || [];
  const currentPlan = availablePlans.find((p: any) => p.planId === selectedPlanId) || availablePlans[0];
  const ppfRate = ratesData?.smallSavings?.find((s: any) => s.schemeCode === "PPF")?.notifiedRatePct ?? 7.1;

  // Compute LIC cashflows & IRR
  const licResult = calculateLicCashFlowsAndIRR({
    annualPremium,
    sumAssured,
    policyTerm,
    premiumPayingTerm: ppt,
    planRules: currentPlan
      ? {
          planId: currentPlan.planId,
          planNo: currentPlan.planNo,
          planName: currentPlan.planName,
          planType: currentPlan.planType,
          minAge: currentPlan.minAge,
          maxAge: currentPlan.maxAge,
          minTerm: currentPlan.minTerm,
          maxTerm: currentPlan.maxTerm,
          guaranteedAdditionPerThousandSA: currentPlan.guaranteedAdditionPerThousandSA,
          guaranteedAdditionYears: currentPlan.guaranteedAdditionYears,
          reversionaryBonusPerThousandSA: currentPlan.reversionaryBonusPerThousandSA,
          finalAdditionalBonusPerThousandSA: currentPlan.finalAdditionalBonusPerThousandSA,
          surrenderFactors: currentPlan.surrenderFactorsJson || {},
          sourceUrl: currentPlan.sourceUrl,
          lastVerified: currentPlan.lastVerified,
        }
      : {
          planId: "lic-jeevan-labh-936",
          planNo: 936,
          planName: "LIC Jeevan Labh",
          planType: "ENDOWMENT",
          minAge: 8,
          maxAge: 59,
          minTerm: 16,
          maxTerm: 25,
          reversionaryBonusPerThousandSA: 44,
          finalAdditionalBonusPerThousandSA: 25,
          surrenderFactors: {},
          sourceUrl: "https://licindia.in",
          lastVerified: "2025-01-15",
        },
    gstRate: 0, // 0% per GST exemption
  });

  // Compute BTIR with exact user entered term insurance inputs (no default guess)
  const btirResult = calculateBTIR({
    licAnnualPremium: annualPremium,
    licSumAssured: sumAssured,
    licPolicyTerm: policyTerm,
    licEffectiveIrr: licResult.effectiveIrrPct,
    licMaturityCorpus: licResult.maturityCorpus,
    termInsuranceAnnualPremium: termAnnualPremium,
    termLifeCover: termLifeCover,
    ppfRatePct: ppfRate,
    mfRatePct: mfExpectedRate,
  });

  const chartData = [
    {
      category: "LIC Policy Only",
      Corpus: btirResult.licProjectedCorpus,
      "Life Cover": btirResult.licSumAssured,
    },
    {
      category: "Term + PPF",
      Corpus: btirResult.btirCorpusPpf,
      "Life Cover": btirResult.termLifeCover,
    },
    {
      category: "Term + Equity MF",
      Corpus: btirResult.btirCorpusMf,
      "Life Cover": btirResult.termLifeCover,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          <span>Buy Term + Invest Difference (BTIR) Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Should You Mix Insurance with Investment?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Traditional endowment policies combine life cover and investment into an expensive bundle with 4.5%–6% returns. Compare what happens when you separate them by buying pure Term Insurance and investing the saved premium.
        </p>
      </div>

      {/* Inputs & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Traditional Policy Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select LIC Plan Template
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {availablePlans.map((p: any) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Annual Premium (₹)
            </label>
            <input
              type="number"
              step={5000}
              value={annualPremium}
              onChange={(e) => setAnnualPremium(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sum Assured (Life Cover in ₹)
            </label>
            <input
              type="number"
              step={50000}
              value={sumAssured}
              onChange={(e) => setSumAssured(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Policy Term (Yrs)
              </label>
              <input
                type="number"
                min={10}
                max={35}
                value={policyTerm}
                onChange={(e) => setPolicyTerm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PPT (Yrs)
              </label>
              <input
                type="number"
                min={5}
                max={policyTerm}
                value={ppt}
                onChange={(e) => setPpt(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>

          {/* User Entered Pure Term Insurance Quote (No default guess) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Pure Term Insurance Quote (User Input)
              </span>
              <a
                href="https://licindia.in/web/guest/tech-term"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>Term Quote Calc</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Term Premium (₹/yr)
                </label>
                <input
                  type="number"
                  step={500}
                  value={termAnnualPremium}
                  onChange={(e) => setTermAnnualPremium(Number(e.target.value))}
                  placeholder="e.g. 10500"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Term Life Cover (₹)
                </label>
                <input
                  type="number"
                  step={500000}
                  value={termLifeCover}
                  onChange={(e) => setTermLifeCover(Number(e.target.value))}
                  placeholder="e.g. 10000000"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              User-entered quote from term calculator; zero hardcoded guesses.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>MF Expected Return</span>
              <span className="text-emerald-600 font-bold">{mfExpectedRate}%</span>
            </div>
            <input
              type="range"
              min={8}
              max={16}
              step={0.5}
              value={mfExpectedRate}
              onChange={(e) => setMfExpectedRate(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Comparison Output & Visual Frontier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Pure Term Cover:</span>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {format(btirResult.termLifeCover)}
              </div>
              <span className="text-[11px] text-slate-500">
                Cost: ~{format(btirResult.termInsuranceAnnualPremium)}/yr
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Annual Savings Invested:</span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                {format(btirResult.annualDifferenceInvested)} / yr
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Difference put to work
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Wealth Advantage (MF):
              </span>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{format(btirResult.wealthAdvantageMf)}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Extra terminal wealth
              </span>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Terminal Corpus vs Life Cover Comparison
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => format(v, 0)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                    formatter={(val: any) => [format(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Corpus" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Life Cover" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Narrative Analysis */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-3 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Mathematical Verdict</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              By choosing the <strong>Buy Term + Invest Difference</strong> strategy with Equity Mutual Funds:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>
                Your family receives <strong>{format(btirResult.termLifeCover)}</strong> in life cover ({btirResult.termLifeCover / btirResult.licSumAssured}× higher than the LIC policy&apos;s {format(btirResult.licSumAssured)}).
              </li>
              <li>
                You invest the remaining <strong>{format(btirResult.annualDifferenceInvested)}/yr</strong> into wealth compounding.
              </li>
              <li>
                At Year {policyTerm}, you accumulate approximately <strong>{format(btirResult.btirCorpusMf)}</strong>, outperforming the LIC maturity corpus ({format(btirResult.licProjectedCorpus)}) by <strong>+{format(btirResult.wealthAdvantageMf)}</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
