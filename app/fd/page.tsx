"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FreshnessBadge } from "@/components/freshness-badge";
import { useCurrency } from "@/components/currency-context";
import { fvCompoundLumpsum } from "@/lib/finance/compound";
import { Building, ShieldCheck, ExternalLink, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Building className="w-3.5 h-3.5 text-emerald-500" />
          <span>Fixed Deposit Intelligence Hub</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Bank & Post Office Fixed Deposit Rates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Compare contracted interest rates across Public, Private, Small Finance Banks, and India Post Time Deposits with quarterly compounding.
        </p>
      </div>

      {/* DICGC ₹5 Lakh Limit Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">DICGC Deposit Insurance Notice:</span>
          <p className="leading-relaxed">
            Bank deposits (principal + accrued interest) are insured by DICGC (RBI subsidiary) up to a statutory ceiling of <strong>₹ 5,00,000 per depositor per bank</strong> across all branches. Post Office Time Deposits carry sovereign Central Government backing with no upper limit.
          </p>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PUBLIC", "PRIVATE", "SMALL_FINANCE", "POST_OFFICE"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isSenior}
            onChange={(e) => setIsSenior(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 rounded"
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
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {fd.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Penalty: {fd.prematurePenaltyPct}%
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{fd.bankName}</h3>
                <div className="text-xs text-slate-500">{fd.tenureBucket}</div>

                <div className="pt-2 flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400">Contracted Rate:</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {effectiveRate}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <div>Compounding: Quarterly</div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    {format(calculatorPrincipal)} in {calculatorTenureYears} yrs → {format(maturityVal)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <FreshnessBadge
                  sourceName={fd.sourceName}
                  sourceUrl={fd.sourceUrl}
                  lastUpdated={fd.lastVerified}
                  compact
                />

                <Link
                  href={`/compare?fd=${fd.id}`}
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 font-bold"
                >
                  <span>Compare</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
