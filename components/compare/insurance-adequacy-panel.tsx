"use client";

import React from "react";
import Link from "next/link";
import { InsuranceAdequacyResult } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";
import { ShieldCheck, AlertCircle, ArrowRight, Shield } from "lucide-react";
import { FormulaTooltip } from "../formula-tooltip";

interface InsuranceAdequacyPanelProps {
  adequacy: InsuranceAdequacyResult;
}

export function InsuranceAdequacyPanel({ adequacy }: InsuranceAdequacyPanelProps) {
  const { format } = useCurrency();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Insurance Adequacy Audit (Human Life Value)
              </h3>
              <FormulaTooltip
                label="HLV Formula & Rules"
                formula="Recommended Cover = (Annual Income × Age Multiplier) + Liabilities; Gap = Recommended Cover - Active Cover"
                explanation={adequacy.formulaExplanation || "Calculates ideal term life insurance protection based on dynamic age brackets and dependent adjustments."}
                source="HLV Multiplier Config Table"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates whether your family has sufficient life cover to protect against premature loss of breadwinner income
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
            adequacy.hasGap
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {adequacy.coverageStatus === "DEFICIT"
            ? "Protection Deficit"
            : adequacy.coverageStatus === "UNINSURED"
            ? "Uninsured"
            : "Adequately Covered"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400">Target Cover ({adequacy.incomeMultiple}x Income):</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {format(adequacy.recommendedLifeCover)}
          </div>
          <span className="text-[11px] text-slate-400">Income replacement + liabilities</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400">Current Protection Active:</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {format(adequacy.existingCover + adequacy.selectedPlanCover)}
          </div>
          <span className="text-[11px] text-slate-400">
            {adequacy.selectedPlanCover > 0 ? `Includes +${format(adequacy.selectedPlanCover)} from chosen plan` : "From your profile"}
          </span>
        </div>

        <div
          className={`p-4 rounded-xl border space-y-1 ${
            adequacy.hasGap
              ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
              : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
          }`}
        >
          <span className={adequacy.hasGap ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
            {adequacy.hasGap ? "Uninsured Shortfall (Gap):" : "Protection Status:"}
          </span>
          <div className="text-base font-extrabold tabular-nums">
            {adequacy.hasGap ? (
              <span className="text-rose-600 dark:text-rose-400">
                {format(adequacy.humanLifeValueGap)}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">
                100% Protected
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            {adequacy.hasGap ? "Family exposed if unaddressed" : "Meets thumb-rule coverage"}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          {adequacy.explanation}
        </p>

        {adequacy.hasGap && (
          <Link
            href="/btir"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shrink-0"
          >
            <span>Fix Gap with Buy Term + Invest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
