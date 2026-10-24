"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { FreshnessBadge } from "@/components/freshness-badge";
import { useCurrency } from "@/components/currency-context";
import { formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  ShieldAlert,
  Calendar,
  Percent,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function MfDetailPage() {
  const params = useParams();
  const schemeCode = Number(params.code) || 122639;
  const { format } = useCurrency();
  const [timeline, setTimeline] = useState<"1M" | "6M" | "1Y" | "3Y" | "5Y" | "Max">("1Y");

  const { data: fund, isLoading, isError } = useQuery({
    queryKey: ["mf-detail", schemeCode],
    queryFn: async () => {
      const res = await fetch(`/api/mf/${schemeCode}`);
      if (!res.ok) throw new Error("Failed to load scheme details");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Fetching complete historical NAV series from api.mfapi.in...
        </p>
      </div>
    );
  }

  if (isError || !fund) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scheme Not Found</h2>
        <p className="text-xs text-slate-500">
          The mutual fund code {schemeCode} could not be retrieved from the AMFI database.
        </p>
      </div>
    );
  }

  // Filter sample data based on selected timeline
  const rawHistory = fund.navHistorySample || [];
  let displayHistory = rawHistory;
  if (timeline === "1M") displayHistory = rawHistory.slice(-22);
  else if (timeline === "6M") displayHistory = rawHistory.slice(-130);
  else if (timeline === "1Y") displayHistory = rawHistory.slice(-250);

  return (
    <div className="w-full space-y-8">
      {/* Scheme Title & Freshness */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {fund.schemeCategory}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {fund.planType} Plan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {fund.schemeName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{fund.fundHouse}</p>
        </div>

        {fund.navDate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live NAV · {fund.navDate}</span>
          </span>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">Current NAV:</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            ₹{fund.currentNav}
          </div>
          <span className="text-[10px] text-slate-500">As of {fund.navDate}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">3-Yr Trailing CAGR:</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatPercent(fund.cagr3Yr)}
          </div>
          <span className="text-[10px] text-slate-500">Annualized</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">Annualized Volatility:</span>
          <div className="text-lg font-bold text-amber-600 tabular-nums">
            {formatPercent(fund.volatility)}
          </div>
          <span className="text-[10px] text-slate-500">250 Trading Days</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">Peak Drawdown:</span>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            -{fund.maxDrawdownPct}%
          </div>
          <span className="text-[10px] text-slate-500">Historical Maximum Drop</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">Sharpe Ratio:</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {fund.sharpeRatio}
          </div>
          <span className="text-[10px] text-slate-500">Risk-free = {fund.repoRateUsed}%</span>
        </div>

        {/* AMFI Total Expense Ratio (Correction #4) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400">Expense Ratio (TER):</span>
          <div className="text-lg font-bold tabular-nums">
            {fund.expenseRatio !== null && fund.expenseRatio !== undefined ? (
              <span className="text-slate-900 dark:text-white">{fund.expenseRatio}%</span>
            ) : (
              <span className="text-xs text-slate-400 italic">TER unavailable</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            {fund.terSource || "AMFI Monthly Disclosure"}
          </span>
        </div>
      </div>

      {/* NAV Historical Timeline Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Net Asset Value (NAV) Performance Timeline
          </h3>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(["1M", "6M", "1Y", "3Y", "5Y", "Max"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeline(t)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeline === t
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
                formatter={(val: any) => [`₹${val}`, "NAV"]}
              />
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rolling Returns Percentile Audit */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Historical Rolling Returns Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Computed across all historical 5-year rolling windows from daily NAVs
          </p>
        </div>

        {fund.rollingReturns.hasInsufficientHistory ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            {fund.rollingReturns.insufficientReason || "Insufficient historical NAV data for rolling return scenarios."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400">Pessimistic (10th %ile):</span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatPercent(fund.rollingReturns.pessimistic10th)}
              </div>
              <span className="text-[10px] text-slate-500">90% of times returns were higher</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400">Median Base (50th %ile):</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatPercent(fund.rollingReturns.base50th)}
              </div>
              <span className="text-[10px] text-slate-500">Typical central outcome</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400">Optimistic (90th %ile):</span>
              <div className="text-base font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                {formatPercent(fund.rollingReturns.optimistic90th)}
              </div>
              <span className="text-[10px] text-slate-500">Top 10% best historical runs</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400">Probability of Loss:</span>
              <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                {fund.rollingReturns.probabilityOfLossPct ?? 0}%
              </div>
              <span className="text-[10px] text-slate-500">Across rolling windows</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
