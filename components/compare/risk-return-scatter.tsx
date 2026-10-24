"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { InstrumentMetrics } from "@/lib/finance/types";
import { formatPercent } from "@/lib/utils";

interface RiskReturnScatterProps {
  instruments: InstrumentMetrics[];
}

export function RiskReturnScatter({ instruments }: RiskReturnScatterProps) {
  const data = instruments.map((inst) => ({
    name: inst.name,
    volatility: inst.volatilityPct,
    realReturn: inst.realReturnPct,
    type: inst.type,
    score: inst.compositeScore,
  }));

  const colors: Record<string, string> = {
    FD: "#3B82F6",
    PPF: "#10B981",
    MF: "#8B5CF6",
    LIC: "#F59E0B",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Risk vs Real Return Frontier
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Scatter analysis: Annualized Volatility (Risk) vs Fisher Post-Tax Real Return. Upper-left quadrant is optimal.
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis
              type="number"
              dataKey="volatility"
              name="Volatility"
              unit="%"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              label={{
                value: "Annualized Volatility (Risk) →",
                position: "insideBottom",
                offset: -12,
                fontSize: 10,
                fill: "#94a3b8",
              }}
            />
            <YAxis
              type="number"
              dataKey="realReturn"
              name="Real Return"
              unit="%"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              label={{
                value: "↑ Real Return (Fisher)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fontSize: 10,
                fill: "#94a3b8",
              }}
            />
            <ZAxis type="number" dataKey="score" range={[100, 300]} name="Score" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-xs space-y-1 shadow-lg">
                    <div className="font-bold text-emerald-400">{d.name}</div>
                    <div className="text-slate-300">
                      Real Return: <span className="font-semibold text-white">{formatPercent(d.realReturn)}</span>
                    </div>
                    <div className="text-slate-300">
                      Volatility: <span className="font-semibold text-white">{formatPercent(d.volatility)}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">Composite Score: {d.score}/100</div>
                  </div>
                );
              }}
            />
            <Scatter name="Instruments" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.type] || "#10B981"} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2">
        {Object.entries(colors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
