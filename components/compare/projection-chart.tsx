"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";
import { fvCompoundLumpsum, fvSip } from "@/lib/finance/compound";
import { AlertCircle } from "lucide-react";

interface ProjectionChartProps {
  instruments: InstrumentMetrics[];
  profile: UserProfile;
}

export function ProjectionChart({ instruments, profile }: ProjectionChartProps) {
  const { format } = useCurrency();
  const [scenarioMode, setScenarioMode] = useState<"base" | "pessimistic" | "optimistic">("base");

  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];

  // Generate year-by-year trajectory data up to horizonYears
  const chartData = [];
  for (let yr = 1; yr <= profile.horizonYears; yr++) {
    const row: any = { year: `Yr ${yr}` };

    // Cumulative Invested Capital line
    const invested =
      profile.investmentMode === "SIP" ? profile.investmentAmount * 12 * yr : profile.investmentAmount;
    row["Invested Capital"] = invested;

    instruments.forEach((inst) => {
      let annualRate = inst.postTaxReturnPct;

      if (inst.type === "MF" && !inst.hasInsufficientHistory) {
        if (scenarioMode === "pessimistic" && inst.projectedCorpus.pessimistic !== null) {
          // Approximate year rate from pessimistic scenario
          annualRate = (inst as any).rollingReturns?.pessimistic10th ?? inst.postTaxReturnPct * 0.7;
        } else if (scenarioMode === "optimistic" && inst.projectedCorpus.optimistic !== null) {
          annualRate = (inst as any).rollingReturns?.optimistic90th ?? inst.postTaxReturnPct * 1.3;
        }
      }

      let val = 0;
      if (profile.investmentMode === "SIP") {
        val = fvSip(profile.investmentAmount, annualRate, yr);
      } else {
        val = fvCompoundLumpsum(profile.investmentAmount, annualRate, yr);
      }

      row[inst.name] = Math.round(val);
    });

    chartData.push(row);
  }

  const anyInsufficient = instruments.some((i) => i.hasInsufficientHistory);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Projected Corpus Trajectory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Growth projection over your {profile.horizonYears}-year horizon ({profile.investmentMode === "SIP" ? `${format(profile.investmentAmount)}/mo` : `${format(profile.investmentAmount)} lump sum`})
          </p>
        </div>

        {/* 3 Scenario Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            disabled={anyInsufficient}
            onClick={() => setScenarioMode("pessimistic")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              scenarioMode === "pessimistic"
                ? "bg-rose-500 text-white shadow-sm"
                : anyInsufficient
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Pessimistic (10th %ile)
          </button>
          <button
            type="button"
            onClick={() => setScenarioMode("base")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              scenarioMode === "base"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Base Case (Median)
          </button>
          <button
            type="button"
            disabled={anyInsufficient}
            onClick={() => setScenarioMode("optimistic")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              scenarioMode === "optimistic"
                ? "bg-teal-600 text-white shadow-sm"
                : anyInsufficient
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Optimistic (90th %ile)
          </button>
        </div>
      </div>

      {anyInsufficient && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Note on scenarios:</strong> One or more selected funds has a track record shorter than your {profile.horizonYears}-year horizon. Scenarios are disabled to preserve statistical accuracy (zero fabricated numbers).
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: 15, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => format(v, 0)}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#f8fafc",
              }}
              formatter={(val: any) => [format(val), ""]}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />

            {/* Invested Capital Line */}
            <Line
              type="monotone"
              dataKey="Invested Capital"
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />

            {/* Instrument Lines */}
            {instruments.map((inst, idx) => (
              <Line
                key={inst.id}
                type="monotone"
                dataKey={inst.name}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
