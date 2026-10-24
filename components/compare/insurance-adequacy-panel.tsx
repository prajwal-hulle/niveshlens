"use client";

import React from "react";
import Link from "next/link";
import { InsuranceAdequacyResult } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";
import { Shield, ArrowRight } from "lucide-react";
import { FormulaTooltip } from "../formula-tooltip";

interface InsuranceAdequacyPanelProps {
  adequacy: InsuranceAdequacyResult;
}

export function InsuranceAdequacyPanel({ adequacy }: InsuranceAdequacyPanelProps) {
  const { format } = useCurrency();

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-text">
                Insurance adequacy audit
              </h3>
              <FormulaTooltip
                label="HLV Formula & Rules"
                formula="Recommended Cover = (Annual Income × Age Multiplier) + Liabilities; Gap = Recommended Cover - Active Cover"
                explanation={adequacy.formulaExplanation || "Calculates ideal term life insurance protection based on dynamic age brackets and dependent adjustments."}
                source="HLV Multiplier Config Table"
              />
            </div>
            <p className="text-xs text-text-muted">
              Evaluates life cover sufficiency against premature loss of breadwinner income.
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
            adequacy.hasGap
              ? "bg-danger/10 text-danger border border-danger/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          {adequacy.coverageStatus === "DEFICIT"
            ? "Protection deficit"
            : adequacy.coverageStatus === "UNINSURED"
            ? "Uninsured"
            : "Adequately covered"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
          <span className="text-text-muted">Target cover ({adequacy.incomeMultiple}x income):</span>
          <div className="text-base font-semibold text-text tabular-nums">
            {format(adequacy.recommendedLifeCover)}
          </div>
          <span className="text-[11px] text-text-muted">Income replacement + liabilities</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
          <span className="text-text-muted">Current protection active:</span>
          <div className="text-base font-semibold text-text tabular-nums">
            {format(adequacy.existingCover + adequacy.selectedPlanCover)}
          </div>
          <span className="text-[11px] text-text-muted">
            {adequacy.selectedPlanCover > 0 ? `Includes +${format(adequacy.selectedPlanCover)} from chosen plan` : "From your profile"}
          </span>
        </div>

        <div
          className={`p-4 rounded-xl border space-y-1 ${
            adequacy.hasGap
              ? "bg-danger/5 border-danger/20"
              : "bg-primary/5 border-primary/20"
          }`}
        >
          <span className={adequacy.hasGap ? "text-danger font-medium" : "text-primary font-medium"}>
            {adequacy.hasGap ? "Protection gap:" : "Protection status:"}
          </span>
          <div className="text-base font-semibold tabular-nums">
            {adequacy.hasGap ? (
              <span className="text-danger">
                {format(adequacy.humanLifeValueGap)}
              </span>
            ) : (
              <span className="text-primary">
                100% Protected
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-muted">
            {adequacy.hasGap ? "Family exposed if unaddressed" : "Meets thumb-rule coverage"}
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p className="text-text-muted leading-relaxed max-w-2xl">
          {adequacy.explanation}
        </p>

        {adequacy.hasGap && (
          <Link
            href="/btir"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors shrink-0"
          >
            <span>Fix gap with term + invest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
