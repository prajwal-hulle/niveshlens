"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FreshnessBadge } from "@/components/freshness-badge";
import { useCurrency } from "@/components/currency-context";
import { fvCompoundLumpsum } from "@/lib/finance/compound";
import { Building, ShieldCheck, ExternalLink, AlertTriangle, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { stageInstrumentForCompare } from "@/components/compare/floating-compare-pill";

export default function FdExplorerPage() {
  const { format } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isSenior, setIsSenior] = useState(false);
  const [calculatorPrincipal, setCalculatorPrincipal] = useState(500000);
  const [calculatorTenureYears, setCalculatorTenureYears] = useState(3);

  const { data: ratesData, isLoading } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const fdList = ratesData?.fd || [];

  const filtered = fdList.filter((f: any) => {
    if (selectedCategory === "ALL") return true;
    return f.category === selectedCategory;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
          Fixed deposit rates
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
          Contracted interest rates across Public, Private, Small Finance Banks, and Post Office Time Deposits with quarterly compounding.
        </p>
      </div>

      {/* DICGC ₹5 Lakh Limit Notice */}
      <div className="p-3.5 rounded-xl bg-surface border border-border border-l-4 border-l-amber-500 flex items-start gap-3 text-xs text-text-muted shadow-sm">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text">DICGC deposit insurance:</span>
          <p className="leading-relaxed">
            Bank deposits are insured by DICGC up to <strong>₹5,00,000 per depositor per bank</strong>. Post Office Time Deposits carry sovereign Central Government backing without ceiling.
          </p>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-surface border border-border shadow-sm text-xs transition-colors">
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "PUBLIC", "PRIVATE", "SMALL_FINANCE", "POST_OFFICE"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface-muted text-text-muted hover:text-text"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-medium text-text">
          <input
            type="checkbox"
            checked={isSenior}
            onChange={(e) => setIsSenior(e.target.checked)}
            className="w-4 h-4 accent-primary rounded"
          />
          <span>Senior Citizen Rates (+0.50%)</span>
        </label>
      </div>

      {/* FD Rate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fd: any) => {
          const effectiveRate = isSenior ? fd.seniorRatePct : fd.generalRatePct;
          const maturityVal = fvCompoundLumpsum(
            calculatorPrincipal,
            effectiveRate,
            calculatorTenureYears,
            "quarterly"
          );

          return (
            <div
              key={fd.id}
              className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4 hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-muted text-text-muted">
                    {fd.category}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    Penalty: {fd.prematurePenaltyPct}%
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-text">{fd.bankName}</h3>
                <div className="text-xs text-text-muted">{fd.tenureBucket}</div>

                <div className="pt-2 flex items-baseline justify-between border-t border-border">
                  <span className="text-xs text-text-muted">Contracted rate:</span>
                  <span className="text-xl font-semibold text-primary tabular-nums">
                    {effectiveRate}%
                  </span>
                </div>

                <div className="text-[11px] text-text-muted space-y-0.5 pt-1">
                  <div>Compounding: Quarterly</div>
                  <div className="text-text font-medium">
                    {format(calculatorPrincipal)} in {calculatorTenureYears} yrs → {format(maturityVal)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs gap-2">
                <FreshnessBadge
                  sourceName={fd.sourceName}
                  sourceUrl={fd.sourceUrl}
                  lastUpdated={fd.lastVerified}
                  compact
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      stageInstrumentForCompare({
                        id: `fd-${fd.id}-${Date.now()}`,
                        type: "FD",
                        bankId: fd.id,
                      })
                    }
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium text-xs px-2 py-1 rounded bg-primary/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to compare</span>
                  </button>
                  <Link
                    href={`/compare?fd=${fd.id}`}
                    className="inline-flex items-center gap-1 text-text-muted hover:text-text font-medium"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
