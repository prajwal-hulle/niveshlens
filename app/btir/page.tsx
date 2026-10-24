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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
          Term insurance + invest difference
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
          Compare combining life cover and investment in an endowment policy versus separating them with pure term insurance and investing the rest.
        </p>
      </div>

      {/* Inputs & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-text border-b border-border pb-2">
            Traditional Policy Parameters
          </h3>

          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Select LIC plan template
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {availablePlans.map((p: any) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Annual Premium (₹)
            </label>
            <input
              type="number"
              step={5000}
              value={annualPremium}
              onChange={(e) => setAnnualPremium(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Sum Assured (Life Cover in ₹)
            </label>
            <input
              type="number"
              step={50000}
              value={sumAssured}
              onChange={(e) => setSumAssured(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Policy Term (Yrs)
              </label>
              <input
                type="number"
                min={10}
                max={35}
                value={policyTerm}
                onChange={(e) => setPolicyTerm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text mb-1">
                PPT (Yrs)
              </label>
              <input
                type="number"
                min={5}
                max={policyTerm}
                value={ppt}
                onChange={(e) => setPpt(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs"
              />
            </div>
          </div>

          {/* User Entered Pure Term Insurance Quote */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-text">
                Pure term quote (user input)
              </span>
              <a
                href="https://licindia.in/web/guest/tech-term"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Term Quote Calc</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Term Premium (₹/yr)
                </label>
                <input
                  type="number"
                  step={500}
                  value={termAnnualPremium}
                  onChange={(e) => setTermAnnualPremium(Number(e.target.value))}
                  placeholder="e.g. 10500"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Term Life Cover (₹)
                </label>
                <input
                  type="number"
                  step={500000}
                  value={termLifeCover}
                  onChange={(e) => setTermLifeCover(Number(e.target.value))}
                  placeholder="e.g. 10000000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-text-muted italic">
              User-entered quote from term calculator; zero hardcoded guesses.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-text-muted">MF Expected Return</span>
              <span className="text-primary font-semibold">{mfExpectedRate}%</span>
            </div>
            <input
              type="range"
              min={8}
              max={16}
              step={0.5}
              value={mfExpectedRate}
              onChange={(e) => setMfExpectedRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Comparison Output & Visual Frontier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">Pure Term Cover:</span>
              <div className="text-lg font-semibold text-primary tabular-nums">
                {format(btirResult.termLifeCover)}
              </div>
              <span className="text-[11px] text-text-muted">
                Cost: ~{format(btirResult.termInsuranceAnnualPremium)}/yr
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">Annual Savings Invested:</span>
              <div className="text-lg font-semibold text-text tabular-nums">
                {format(btirResult.annualDifferenceInvested)} / yr
              </div>
              <span className="text-[11px] text-primary font-medium">
                Difference put to work
              </span>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1 transition-colors">
              <span className="text-xs text-primary font-medium">
                Wealth Advantage (MF):
              </span>
              <div className="text-lg font-semibold text-primary tabular-nums">
                +{format(btirResult.wealthAdvantageMf)}
              </div>
              <span className="text-[11px] text-primary/80">
                Extra terminal wealth
              </span>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4 transition-colors">
            <h3 className="font-semibold text-sm text-text">
              Terminal Corpus vs Life Cover Comparison
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 15, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="category" stroke="currentColor" className="text-text-muted" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="currentColor"
                    className="text-text-muted"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => format(v, 0)}
                  />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || payload.length === 0) return null;
                      return (
                        <div className="bg-surface text-text p-2.5 rounded-lg border border-border text-xs space-y-1 shadow-md">
                          <div className="font-medium text-text">{label}</div>
                          {payload.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="text-text-muted">{p.name}:</span>
                              <span className="font-semibold tabular-nums text-text">{format(p.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="Corpus" fill="#059669" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Life Cover" fill="#2563EB" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Narrative Analysis */}
          <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs space-y-2.5 leading-relaxed">
            <div className="flex items-center gap-2 font-medium text-sm text-text">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Mathematical Verdict</span>
            </div>
            <p className="text-text-muted">
              By choosing the <strong>Buy Term + Invest Difference</strong> strategy with Equity Mutual Funds:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-text-muted">
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
