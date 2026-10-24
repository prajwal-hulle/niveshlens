"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { calculatePpfSchedule } from "@/lib/finance/compound";
import { FreshnessBadge } from "@/components/freshness-badge";
import { Shield, CheckCircle2, AlertCircle, Info, Landmark, Plus } from "lucide-react";
import { stageInstrumentForCompare } from "@/components/compare/floating-compare-pill";

export default function PpfPage() {
  const { format } = useCurrency();
  const [annualDeposit, setAnnualDeposit] = useState(150000);

  const { data: ratesData } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const ppfRecord = ratesData?.smallSavings?.find((s: any) => s.schemeCode === "PPF");
  const notifiedRate = ppfRecord?.notifiedRatePct ?? 7.1;

  // Strict PPF schedule conforming to Indian rules (correction #8)
  const ppfData = calculatePpfSchedule(annualDeposit, notifiedRate, 15);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Public Provident Fund (PPF)
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-2xl">
            15-year statutory lock-in, quarterly notified interest, EEE tax exemption, and partial withdrawal guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              stageInstrumentForCompare({
                id: `ppf-${Date.now()}`,
                type: "PPF",
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to compare</span>
          </button>

          {ppfRecord && (
            <FreshnessBadge
              sourceName={ppfRecord.sourceName}
              sourceUrl={ppfRecord.sourceUrl}
              lastUpdated={ppfRecord.lastVerified}
            />
          )}
        </div>
      </div>

      {/* Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5 transition-colors">
          <div className="flex items-center gap-1.5 font-medium text-text">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>₹1.5L Annual deposit cap</span>
          </div>
          <p className="text-text-muted leading-relaxed">
            Minimum deposit is ₹500/year; maximum is ₹1,50,000 across all accounts held by an individual. Any excess deposit earns 0% interest.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5 transition-colors">
          <div className="flex items-center gap-1.5 font-medium text-text">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Loan allowed: Years 3 to 6</span>
          </div>
          <p className="text-text-muted leading-relaxed">
            Borrow up to 25% of the balance at the end of the second preceding financial year. Interest charged is 1% above notified PPF rate.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5 transition-colors">
          <div className="flex items-center gap-1.5 font-medium text-text">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Partial withdrawal: Year 7+</span>
          </div>
          <p className="text-text-muted leading-relaxed">
            Capped at 50% of the balance at the end of the 4th preceding year or preceding year, whichever is lower.
          </p>
        </div>
      </div>

      {/* Interactive 15-Year Schedule */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base text-text">
              15-Year trajectory schedule
            </h3>
            <p className="text-xs text-text-muted">
              Compounded annually on March 31st at the notified rate of {notifiedRate}%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">
              Annual deposit:
            </span>
            <input
              type="number"
              min={500}
              max={150000}
              step={5000}
              value={annualDeposit}
              onChange={(e) => setAnnualDeposit(Math.min(150000, Number(e.target.value)))}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text w-32 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-[11px] font-medium text-text-muted">
                <th className="p-3">Year</th>
                <th className="p-3">Opening (₹)</th>
                <th className="p-3">Deposit (₹)</th>
                <th className="p-3">Interest (₹)</th>
                <th className="p-3 font-semibold text-text">Closing (₹)</th>
                <th className="p-3">Max withdrawal</th>
                <th className="p-3">Loan allowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ppfData.schedule.map((row) => (
                <tr
                  key={row.year}
                  className={row.year === 15 ? "bg-primary/5 font-semibold text-text" : "hover:bg-surface-muted/50"}
                >
                  <td className="p-3 font-medium text-text">Year {row.year}</td>
                  <td className="p-3 tabular-nums text-text-muted">{format(row.openingBalance)}</td>
                  <td className="p-3 tabular-nums text-text-muted">{format(row.deposit)}</td>
                  <td className="p-3 tabular-nums text-primary font-medium">
                    +{format(row.interestEarned)}
                  </td>
                  <td className="p-3 tabular-nums font-semibold text-text">
                    {format(row.closingBalance)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.isWithdrawalEligible ? (
                      <span className="font-medium text-primary">
                        {format(row.maxWithdrawalAllowed)}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[10px]">Locked</span>
                    )}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.isLoanEligible ? (
                      <span className="font-medium text-warning">
                        {format(row.loanAllowed)}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-text-muted">
          <div>
            Total invested: <strong className="text-text font-semibold">{format(ppfData.totalInvested)}</strong>
          </div>
          <div>
            Total interest earned: <strong className="text-primary font-semibold">+{format(ppfData.totalInterest)}</strong>
          </div>
          <div>
            Maturity corpus (15 Yrs): <strong className="text-sm text-primary font-semibold">{format(ppfData.maturityCorpus)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
