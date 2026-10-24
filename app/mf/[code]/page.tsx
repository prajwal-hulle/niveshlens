"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCurrency } from "@/components/currency-context";
import { useCompareSelection } from "@/components/compare/selection-context";
import { formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  Percent,
  AlertCircle,
  Loader2,
  Check,
  ArrowRight,
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
  const { addInstrument, isSelected } = useCompareSelection();
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
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-sm font-medium text-text">
          Loading mutual fund historical data...
        </p>
      </div>
    );
  }

  if (isError || !fund) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-danger mx-auto" />
        <h2 className="text-xl font-semibold text-text">Scheme not found</h2>
        <p className="text-xs text-text-muted">
          The mutual fund code {schemeCode} could not be retrieved from the records.
        </p>
      </div>
    );
  }

  const added = isSelected("MF", fund.schemeCode);

  // Filter sample data based on selected timeline
  const rawHistory = fund.navHistorySample || [];
  let displayHistory = rawHistory;
  if (timeline === "1M") displayHistory = rawHistory.slice(-22);
  else if (timeline === "6M") displayHistory = rawHistory.slice(-130);
  else if (timeline === "1Y") displayHistory = rawHistory.slice(-250);

  const isValidNavDate = fund.navDate && fund.navDate !== "Invalid Date" && !fund.navDate.includes("NaN");

  return (
    <div className="w-full space-y-6">
      {/* Scheme Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
              {fund.schemeCategory}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-muted text-text-muted border border-border">
              {fund.planType} Plan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            {fund.schemeName}
          </h1>
          <p className="text-xs text-text-muted">{fund.fundHouse}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              addInstrument(
                {
                  id: `mf-${fund.schemeCode}`,
                  type: "MF",
                  schemeCode: fund.schemeCode,
                  schemeName: fund.schemeName,
                },
                true
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors ${
              added
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-primary text-white hover:bg-primary-hover"
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

          {isValidNavDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>NAV as of {fund.navDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2x3 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">Current NAV</span>
          <div className="text-lg font-semibold text-text tabular-nums">
            ₹{fund.currentNav}
          </div>
          <span className="text-[11px] text-text-muted">{isValidNavDate ? fund.navDate : "Latest available"}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">3-Yr trailing CAGR</span>
          <div className="text-lg font-semibold text-primary tabular-nums">
            {formatPercent(fund.cagr3Yr)}
          </div>
          <span className="text-[11px] text-text-muted">Annualized return</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">Annualized volatility</span>
          <div className="text-lg font-semibold text-warning tabular-nums">
            {formatPercent(fund.volatility)}
          </div>
          <span className="text-[11px] text-text-muted">250 trading days</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">Peak drawdown</span>
          <div className="text-lg font-semibold text-danger tabular-nums">
            -{fund.maxDrawdownPct}%
          </div>
          <span className="text-[11px] text-text-muted">Historical maximum drop</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">Sharpe ratio</span>
          <div className="text-lg font-semibold text-text tabular-nums">
            {fund.sharpeRatio}
          </div>
          <span className="text-[11px] text-text-muted">Risk-free repo rate = {fund.repoRateUsed}%</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
          <span className="text-xs text-text-muted">Expense ratio (TER)</span>
          <div className="text-lg font-semibold tabular-nums">
            {fund.expenseRatio !== null && fund.expenseRatio !== undefined ? (
              <span className="text-text">{fund.expenseRatio}%</span>
            ) : (
              <span className="text-xs text-text-muted italic">TER unavailable</span>
            )}
          </div>
          <span className="text-[11px] text-text-muted">
            {fund.terSource || "AMFI Monthly Disclosure"}
          </span>
        </div>
      </div>

      {/* NAV Historical Timeline Chart (300px) */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-base text-text">
            NAV historical performance
          </h3>

          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border text-xs font-medium self-end sm:self-auto">
            {(["1M", "6M", "1Y", "3Y", "5Y", "Max"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeline(t)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeline === t
                    ? "bg-surface text-primary shadow-sm font-semibold"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayHistory} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
              <XAxis dataKey="date" stroke="currentColor" className="text-text-muted" fontSize={10} tickLine={false} />
              <YAxis stroke="currentColor" className="text-text-muted" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <div className="bg-surface text-text p-2.5 rounded-lg border border-border text-xs space-y-1 shadow-md">
                      <div className="text-text-muted">{label}</div>
                      <div className="font-semibold text-primary">₹{payload[0].value}</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rolling Returns Percentile Audit */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
        <div>
          <h3 className="font-semibold text-base text-text">
            Historical rolling returns distribution
          </h3>
          <p className="text-xs text-text-muted">
            Computed across 5-year rolling windows from daily NAVs.
          </p>
        </div>

        {fund.rollingReturns.hasInsufficientHistory ? (
          <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
            {fund.rollingReturns.insufficientReason || "Insufficient historical NAV data for rolling return scenarios."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
              <span className="text-text-muted">Pessimistic (10th):</span>
              <div className="text-base font-semibold text-danger tabular-nums">
                {formatPercent(fund.rollingReturns.pessimistic10th)}
              </div>
              <span className="text-[10px] text-text-muted">90% of times returns were higher</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
              <span className="text-text-muted">Median (50th):</span>
              <div className="text-base font-semibold text-primary tabular-nums">
                {formatPercent(fund.rollingReturns.base50th)}
              </div>
              <span className="text-[10px] text-text-muted">Central typical outcome</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
              <span className="text-text-muted">Optimistic (90th):</span>
              <div className="text-base font-semibold text-primary tabular-nums">
                {formatPercent(fund.rollingReturns.optimistic90th)}
              </div>
              <span className="text-[10px] text-text-muted">Top 10% best historical runs</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-1">
              <span className="text-text-muted">Probability of loss:</span>
              <div className="text-base font-semibold text-text tabular-nums">
                {fund.rollingReturns.probabilityOfLossPct ?? 0}%
              </div>
              <span className="text-[10px] text-text-muted">Across 5-year periods</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
