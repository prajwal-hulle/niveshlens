"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";
import { fvCompoundLumpsum, fvSip } from "@/lib/finance/compound";
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";

interface ProjectionChartProps {
  instruments: InstrumentMetrics[];
  profile: UserProfile;
}

export function ProjectionChart({ instruments, profile }: ProjectionChartProps) {
  const { format } = useCurrency();
  const [scenarioMode, setScenarioMode] = useState<"base" | "pessimistic" | "optimistic">("base");

  // Generate year-by-year trajectory data up to horizonYears
  const chartData = [];
  for (let yr = 1; yr <= profile.horizonYears; yr++) {
    const row: any = { year: `Yr ${yr}` };

    const invested =
      profile.investmentMode === "SIP" ? profile.investmentAmount * 12 * yr : profile.investmentAmount;
    row["Invested Capital"] = invested;

    instruments.forEach((inst) => {
      let annualRate = inst.postTaxReturnPct;

      if (inst.type === "MF" && !inst.hasInsufficientHistory) {
        if (scenarioMode === "pessimistic" && inst.projectedCorpus.pessimistic !== null) {
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

      const shortName = getShortInstrumentName(inst.name, inst.type);
      row[shortName] = Math.round(val);
    });

    chartData.push(row);
  }

  const anyInsufficient = instruments.some((i) => i.hasInsufficientHistory);

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base text-text">
            Projected corpus growth
          </h3>
          <p className="text-xs text-text-muted">
            Estimated trajectory over {profile.horizonYears} years ({profile.investmentMode === "SIP" ? `${format(profile.investmentAmount)}/mo` : `${format(profile.investmentAmount)} lump sum`})
          </p>
        </div>

        {/* 3 Scenario Mode Switcher */}
        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg self-start sm:self-auto text-xs font-medium border border-border">
          <button
            type="button"
            disabled={anyInsufficient}
            onClick={() => setScenarioMode("pessimistic")}
            className={`px-2.5 py-1 rounded transition-colors ${
              scenarioMode === "pessimistic"
                ? "bg-danger text-white shadow-sm"
                : anyInsufficient
                ? "opacity-40 cursor-not-allowed text-text-muted"
                : "text-text-muted hover:text-text"
            }`}
          >
            Pessimistic (10th)
          </button>
          <button
            type="button"
            onClick={() => setScenarioMode("base")}
            className={`px-2.5 py-1 rounded transition-colors ${
              scenarioMode === "base"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            Base median
          </button>
          <button
            type="button"
            disabled={anyInsufficient}
            onClick={() => setScenarioMode("optimistic")}
            className={`px-2.5 py-1 rounded transition-colors ${
              scenarioMode === "optimistic"
                ? "bg-primary text-white shadow-sm"
                : anyInsufficient
                ? "opacity-40 cursor-not-allowed text-text-muted"
                : "text-text-muted hover:text-text"
            }`}
          >
            Optimistic (90th)
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, bottom: 10, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
            <XAxis dataKey="year" stroke="currentColor" className="text-text-muted" fontSize={11} tickLine={false} />
            <YAxis
              stroke="currentColor"
              className="text-text-muted"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => format(v)}
              width={70}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                return (
                  <div className="bg-surface text-text p-3 rounded-lg border border-border text-xs space-y-1.5 shadow-md">
                    <div className="font-semibold text-text">{label}</div>
                    <div className="space-y-1">
                      {payload.map((p: any, idx: number) => (
                        <div key={idx} className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-text-muted">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span>{p.name}:</span>
                          </span>
                          <span className="font-semibold tabular-nums text-text">
                            {format(p.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            {/* Invested Capital reference line */}
            <Line
              type="monotone"
              dataKey="Invested Capital"
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            {instruments.map((inst, idx) => {
              const shortName = getShortInstrumentName(inst.name, inst.type);
              const color = getInstrumentColor(idx);
              return (
                <Line
                  key={inst.id}
                  type="monotone"
                  dataKey={shortName}
                  name={shortName}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below */}
      <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500 shrink-0" />
          <span className="text-text-muted font-medium">Invested Capital</span>
        </div>
        {instruments.map((inst, idx) => (
          <div key={inst.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getInstrumentColor(idx) }} />
            <span className="text-text-muted font-medium">{getShortInstrumentName(inst.name, inst.type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
