"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { calculateLicCashFlowsAndIRR } from "@/lib/finance/insurance";
import { FreshnessBadge } from "@/components/freshness-badge";
import { formatPercent } from "@/lib/utils";
import { Shield, ExternalLink, AlertTriangle, ArrowRight, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { stageInstrumentForCompare } from "@/components/compare/floating-compare-pill";

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
              {plan?.planType} Plan
            </span>
            <span className="text-xs text-text-muted">Plan No: {plan?.planNo}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            {plan?.planName}
          </h1>
          <p className="text-xs text-text-muted">{plan?.description}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              stageInstrumentForCompare({
                id: `lic-${plan.planId}-${Date.now()}`,
                type: "LIC",
                planId: plan.planId,
                annualPremium,
                sumAssured,
                policyTerm,
                premiumPayingTerm: ppt,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to compare</span>
          </button>

          {plan && (
            <FreshnessBadge
              sourceName={plan.sourceName}
              sourceUrl={plan.sourceUrl}
              lastUpdated={plan.lastVerified}
            />
          )}
        </div>
      </div>

      {/* User Policy Input & Live IRR Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-text border-b border-border pb-2">
            Enter quote details
          </h3>

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
              Basic Sum Assured (₹)
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
                max={30}
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

          <div className="p-3 rounded-lg bg-surface-muted border border-border text-[11px] text-text-muted space-y-1">
            <div>Brochure Reversionary Bonus: ₹{plan?.reversionaryBonusPerThousandSA}/1,000 SA</div>
            <div>Final Additional Bonus: ₹{plan?.finalAdditionalBonusPerThousandSA}/1,000 SA</div>
            <div>GST on Premium: 0% (Exempt since 22 Sep 2025)</div>
          </div>
        </div>

        {/* Live Mathematical Returns Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">Total premiums paid:</span>
              <div className="text-lg font-semibold text-text tabular-nums">
                {format(licResult.totalPremiumsPaid)}
              </div>
              <span className="text-[10px] text-text-muted">Over {ppt} years</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">Projected maturity corpus:</span>
              <div className="text-lg font-semibold text-primary tabular-nums">
                {format(licResult.maturityCorpus)}
              </div>
              <span className="text-[10px] text-text-muted">SA + Accumulated bonuses</span>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1 transition-colors">
              <span className="text-xs text-primary font-medium">
                Calculated IRR:
              </span>
              <div className="text-xl font-semibold text-primary tabular-nums">
                {formatPercent(licResult.effectiveIrrPct)}
              </div>
              <span className="text-[10px] text-primary/80">
                Pure cash-flow IRR (Newton-Raphson)
              </span>
            </div>
          </div>

          {/* Surrender Value Warning */}
          <div className="p-4 rounded-xl bg-danger/5 border border-danger/20 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-danger text-sm">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span>Surrender penalty caveat</span>
            </div>
            <p className="text-text-muted leading-relaxed">
              If you discontinue this policy early: Year 1 gives ₹0 refund. Surrendering in Year 2–3 causes a <strong>50%–70% capital loss</strong> of all premiums paid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
