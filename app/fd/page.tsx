"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { useCompareSelection } from "@/components/compare/selection-context";
import { fvCompoundLumpsum } from "@/lib/finance/compound";
import { Building, ShieldCheck, ArrowRight, Check, ArrowUpDown, Info } from "lucide-react";

export default function FdExplorerPage() {
  const { format } = useCurrency();
  const { addInstrument, isSelected } = useCompareSelection();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTenure, setSelectedTenure] = useState("ALL");
  const [sortBy, setSortBy] = useState<"rate" | "penalty">("rate");
  const [isSenior, setIsSenior] = useState(false);

  const { data: ratesData, isLoading } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const fdList = ratesData?.fd || [];

  // Find oldest verification date across all FDs
  const oldestVerificationDate = useMemo(() => {
    if (fdList.length === 0) return "Jan 2025";
    return fdList.reduce(
      (oldest: string, f: any) => (!oldest || f.lastVerified < oldest ? f.lastVerified : oldest),
      ""
    );
  }, [fdList]);

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let list = fdList.filter((f: any) => {
      if (selectedCategory !== "ALL" && f.category !== selectedCategory) return false;

      if (selectedTenure === "1Y") {
        if (!f.tenureBucket.includes("1") || f.tenureBucket.includes("2") || f.tenureBucket.includes("5")) {
          return false;
        }
      } else if (selectedTenure === "2-3Y") {
        if (!f.tenureBucket.includes("2") && !f.tenureBucket.includes("3")) return false;
      } else if (selectedTenure === "5Y") {
        if (!f.tenureBucket.includes("5") && !f.tenureBucket.toLowerCase().includes("tax")) return false;
      }

      return true;
    });

    list.sort((a: any, b: any) => {
      const rateA = isSenior ? a.seniorRatePct : a.generalRatePct;
      const rateB = isSenior ? b.seniorRatePct : b.generalRatePct;
      if (sortBy === "rate") {
        return rateB - rateA;
      } else {
        return a.prematurePenaltyPct - b.prematurePenaltyPct;
      }
    });

    return list;
  }, [fdList, selectedCategory, selectedTenure, sortBy, isSenior]);

  const getCategoryLabel = (cat: string) => {
    if (cat === "SMALL_FINANCE") return "Small finance bank";
    if (cat === "PUBLIC") return "Public sector bank";
    if (cat === "PRIVATE") return "Private sector bank";
    if (cat === "POST_OFFICE") return "Post Office deposit";
    return cat.replace("_", " ");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
          Fixed deposit rates
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
          Compare contracted interest rates across Public, Private, Small Finance Banks, and Post Office Time Deposits with quarterly compounding.
        </p>
      </div>

      {/* Page Note on Verification */}
      <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs text-text-muted shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            Rates last checked on <strong>{oldestVerificationDate}</strong>. Verify with the bank before opening.
          </span>
        </div>
      </div>

      {/* DICGC Notice */}
      <div className="p-3.5 rounded-xl bg-surface border border-border border-l-4 border-l-amber-500 flex items-start gap-3 text-xs text-text-muted shadow-sm">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-text">DICGC deposit insurance:</span>
          <p className="leading-relaxed">
            Bank deposits are insured by DICGC up to <strong>₹5,00,000 per depositor per bank</strong>. Post Office Time Deposits carry sovereign Central Government backing without ceiling.
          </p>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-3 text-xs">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-text-muted mr-1 font-medium">Bank type:</span>
            {[
              { label: "All banks", val: "ALL" },
              { label: "Public sector", val: "PUBLIC" },
              { label: "Private", val: "PRIVATE" },
              { label: "Small finance bank", val: "SMALL_FINANCE" },
              { label: "Post Office", val: "POST_OFFICE" },
            ].map((cat) => (
              <button
                key={cat.val}
                type="button"
                onClick={() => setSelectedCategory(cat.val)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.val
                    ? "bg-primary text-white"
                    : "bg-surface-muted text-text-muted hover:text-text"
                }`}
              >
                {cat.label}
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
            <span>Senior citizen (+0.50%)</span>
          </label>
        </div>

        {/* Tenure & Sort Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-text-muted mr-1 font-medium">Tenure:</span>
            {[
              { label: "All tenures", val: "ALL" },
              { label: "1 Year", val: "1Y" },
              { label: "2–3 Years", val: "2-3Y" },
              { label: "5 Years (Tax Saver)", val: "5Y" },
            ].map((tenure) => (
              <button
                key={tenure.val}
                type="button"
                onClick={() => setSelectedTenure(tenure.val)}
                className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                  selectedTenure === tenure.val
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-border text-text-muted hover:text-text"
                }`}
              >
                {tenure.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rate" | "penalty")}
              className="px-2 py-1 rounded border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="rate">Highest rate</option>
              <option value="penalty">Lowest penalty</option>
            </select>
          </div>
        </div>
      </div>

      {/* FD Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSorted.map((fd: any) => {
          const effectiveRate = isSenior ? fd.seniorRatePct : fd.generalRatePct;
          const maturity3Yr = fvCompoundLumpsum(500000, effectiveRate, 3, "quarterly");
          const added = isSelected("FD", fd.id);

          return (
            <div
              key={fd.id}
              className={`p-5 rounded-xl bg-surface border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                added ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-muted text-text-muted">
                    {getCategoryLabel(fd.category)}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    Early exit penalty: {fd.prematurePenaltyPct}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-text">{fd.bankName}</h3>
                    <div className="text-xs text-text-muted">{fd.tenureBucket}</div>
                  </div>
                  {added && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-baseline justify-between border-t border-border">
                  <span className="text-xs text-text-muted">Interest rate:</span>
                  <span className="text-xl font-semibold text-primary tabular-nums">
                    {effectiveRate}% p.a.
                  </span>
                </div>

                <div className="text-[11px] text-text-muted space-y-0.5 pt-1">
                  <div>Compounding: Quarterly</div>
                  <div className="text-text font-medium">
                    ₹5L grows to {format(maturity3Yr)} in 3 years (before tax)
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs gap-2">
                <span className="text-[10px] text-text-muted">
                  Source: {fd.sourceName}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    addInstrument(
                      {
                        id: `fd-${fd.id}`,
                        type: "FD",
                        bankId: fd.id,
                      },
                      true
                    )
                  }
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    added
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-primary text-white hover:bg-primary-hover shadow-sm"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ Added</span>
                    </>
                  ) : (
                    <>
                      <span>Compare</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
