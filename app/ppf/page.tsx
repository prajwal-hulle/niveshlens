"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { calculatePpfSchedule } from "@/lib/finance/compound";
import { FreshnessBadge } from "@/components/freshness-badge";
import { Shield, CheckCircle2, AlertCircle, Info, Landmark } from "lucide-react";

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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sovereign Small Savings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Public Provident Fund (PPF) Architecture
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            15-year statutory lock-in, quarterly notified interest, EEE tax exemption, and partial withdrawal regulations.
          </p>
        </div>

        {ppfRecord && (
          <FreshnessBadge
            sourceName={ppfRecord.sourceName}
            sourceUrl={ppfRecord.sourceUrl}
            lastUpdated={ppfRecord.lastVerified}
          />
        )}
      </div>

      {/* Rules Banner (Correction #8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Statutory ₹1.5L Annual Cap</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Minimum deposit is ₹500/year; maximum is ₹1,50,000 across all accounts held by an individual. Any excess deposit earns 0% interest.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Loan Allowed: Years 3 to 6</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Borrow up to 25% of the balance at the end of the second preceding financial year. Interest charged is 1% above PPF rate.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Partial Withdrawal: Year 7 Onwards</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Capped at 50% of the balance at the end of the 4th preceding year or preceding year, whichever is lower.
          </p>
        </div>
      </div>

      {/* Interactive 15-Year Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Official 15-Year Trajectory Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Compounded annually on March 31st at the notified rate of {notifiedRate}%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Annual Deposit:
            </span>
            <input
              type="number"
              min={500}
              max={150000}
              step={5000}
              value={annualDeposit}
              onChange={(e) => setAnnualDeposit(Math.min(150000, Number(e.target.value)))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold w-32 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="p-3">Year</th>
                <th className="p-3">Opening (₹)</th>
                <th className="p-3">Deposit (₹)</th>
                <th className="p-3">Interest Earned (₹)</th>
                <th className="p-3 font-bold text-slate-900 dark:text-white">Closing Balance (₹)</th>
                <th className="p-3">Max Withdrawal Allowed</th>
                <th className="p-3">Loan Allowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ppfData.schedule.map((row) => (
                <tr
                  key={row.year}
                  className={row.year === 15 ? "bg-emerald-500/10 font-bold" : "hover:bg-slate-50/50 dark:hover:bg-slate-950/20"}
                >
                  <td className="p-3 font-medium">Year {row.year}</td>
                  <td className="p-3 tabular-nums">{format(row.openingBalance)}</td>
                  <td className="p-3 tabular-nums">{format(row.deposit)}</td>
                  <td className="p-3 tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{format(row.interestEarned)}
                  </td>
                  <td className="p-3 tabular-nums font-bold text-slate-900 dark:text-white">
                    {format(row.closingBalance)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.isWithdrawalEligible ? (
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {format(row.maxWithdrawalAllowed)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Locked</span>
                    )}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.isLoanEligible ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {format(row.loanAllowed)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            Total Invested: <strong>{format(ppfData.totalInvested)}</strong>
          </div>
          <div>
            Total Interest Earned: <strong className="text-emerald-600 dark:text-emerald-400">+{format(ppfData.totalInterest)}</strong>
          </div>
          <div>
            Maturity Corpus (15 Yrs): <strong className="text-base text-emerald-600 dark:text-emerald-400 font-extrabold">{format(ppfData.maturityCorpus)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
