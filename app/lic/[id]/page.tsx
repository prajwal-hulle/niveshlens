"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { calculateLicCashFlowsAndIRR } from "@/lib/finance/insurance";
import { FreshnessBadge } from "@/components/freshness-badge";
import { formatPercent } from "@/lib/utils";
import { Shield, ExternalLink, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LicDetailPage() {
  const params = useParams();
  const planId = (params.id as string) || "lic-jeevan-labh-936";
  const { format } = useCurrency();

  const [annualPremium, setAnnualPremium] = useState(85600);
  const [sumAssured, setSumAssured] = useState(1000000);
  const [policyTerm, setPolicyTerm] = useState(16);
  const [ppt, setPpt] = useState(10);

  const { data: ratesData, isLoading } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const plan = ratesData?.insurance?.find((p: any) => p.planId === planId);

  const licResult = calculateLicCashFlowsAndIRR({
    annualPremium,
    sumAssured,
    policyTerm,
    premiumPayingTerm: ppt,
    planRules: plan
      ? {
          planId: plan.planId,
          planNo: plan.planNo,
          planName: plan.planName,
          planType: plan.planType,
          minAge: plan.minAge,
          maxAge: plan.maxAge,
          minTerm: plan.minTerm,
          maxTerm: plan.maxTerm,
          guaranteedAdditionPerThousandSA: plan.guaranteedAdditionPerThousandSA,
          guaranteedAdditionYears: plan.guaranteedAdditionYears,
          reversionaryBonusPerThousandSA: plan.reversionaryBonusPerThousandSA,
          finalAdditionalBonusPerThousandSA: plan.finalAdditionalBonusPerThousandSA,
          surrenderFactors: plan.surrenderFactorsJson || {},
          sourceUrl: plan.sourceUrl,
          lastVerified: plan.lastVerified,
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
    gstRate: 0,
  });

  if (!plan && !isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Policy Not Found</h2>
        <Link href="/compare" className="text-emerald-600 font-bold hover:underline">
          Return to Comparator
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
              {plan?.planType} Plan
            </span>
            <span className="text-xs text-slate-400">Plan No: {plan?.planNo}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {plan?.planName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{plan?.description}</p>
        </div>

        {plan && (
          <FreshnessBadge
            sourceName={plan.sourceName}
            sourceUrl={plan.sourceUrl}
            lastUpdated={plan.lastVerified}
          />
        )}
      </div>

      {/* User Policy Input & Live IRR Calculator (Correction #5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Enter Quote Details
          </h3>

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
              Basic Sum Assured (₹)
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
                max={30}
                value={policyTerm}
                onChange={(e) => setPolicyTerm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Premium Paying Term
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

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div>Brochure Reversionary Bonus: ₹{plan?.reversionaryBonusPerThousandSA}/1,000 SA</div>
            <div>Final Additional Bonus: ₹{plan?.finalAdditionalBonusPerThousandSA}/1,000 SA</div>
            <div>GST on Premium: 0% (Exempt since 22 Sep 2025)</div>
          </div>
        </div>

        {/* Live Mathematical Returns Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Total Premiums Paid:</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {format(licResult.totalPremiumsPaid)}
              </div>
              <span className="text-[10px] text-slate-500">Over {ppt} years</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Projected Maturity Corpus:</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {format(licResult.maturityCorpus)}
              </div>
              <span className="text-[10px] text-slate-500">SA + Accumulated Bonuses</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Actual Mathematical IRR:
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatPercent(licResult.effectiveIrrPct)}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                Pure cash-flow IRR (Newton-Raphson)
              </span>
            </div>
          </div>

          {/* Surrender Value Trap Warning */}
          <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Surrender Penalty Warning</span>
            </div>
            <p className="text-rose-900/80 dark:text-rose-200 leading-relaxed">
              If you discontinue this policy early: Year 1 gives ₹0 refund. Surrendering in Year 2–3 causes a <strong>50%–70% capital loss</strong> of all premiums paid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
