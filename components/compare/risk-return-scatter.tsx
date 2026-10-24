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
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";

interface RiskReturnScatterProps {
  instruments: InstrumentMetrics[];
}

export function RiskReturnScatter({ instruments }: RiskReturnScatterProps) {
  const data = instruments.map((inst, index) => ({
    name: inst.name,
    shortName: getShortInstrumentName(inst.name, inst.type),
    volatility: inst.volatilityPct,
    realReturn: inst.realReturnPct,
    postTaxReturn: inst.postTaxReturnPct,
    nominalReturn: inst.nominalReturnPct,
    type: inst.type,
    score: inst.compositeScore,
    color: getInstrumentColor(index),
  }));

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm min-h-[340px] flex flex-col justify-between transition-colors">
      <div>
        <h3 className="font-semibold text-base text-text">
          Risk vs return
        </h3>
        <p className="text-xs text-text-muted">
          Annualized volatility (risk) vs post-tax real return (Fisher equation). Upper-left is optimal.
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
            <XAxis
              type="number"
              dataKey="volatility"
              name="Volatility"
              unit="%"
              stroke="currentColor"
              className="text-text-muted"
              fontSize={11}
              tickLine={false}
              label={{
                value: "Annualized Volatility (Risk) →",
                position: "insideBottom",
                offset: -12,
                fontSize: 10,
                fill: "currentColor",
                className: "text-text-muted",
              }}
            />
            <YAxis
              type="number"
              dataKey="realReturn"
              name="Real Return"
              unit="%"
              stroke="currentColor"
              className="text-text-muted"
              fontSize={11}
              tickLine={false}
              label={{
                value: "↑ Real Return (Fisher)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fontSize: 10,
                fill: "currentColor",
                className: "text-text-muted",
              }}
            />
            <ZAxis type="number" dataKey="score" range={[120, 240]} name="Score" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-surface text-text p-3 rounded-lg border border-border text-xs space-y-1.5 shadow-md">
                    <div className="font-semibold text-primary">{d.shortName}</div>
                    <div className="text-[11px] text-text-muted">{d.name}</div>
                    <div className="pt-1 space-y-0.5 border-t border-border">
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Real return:</span>
                        <span className={`font-semibold ${d.realReturn < 0 ? "text-danger" : "text-primary"}`}>
                          {formatPercent(d.realReturn, 2, true)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Post-tax return:</span>
                        <span className="font-medium text-text">{formatPercent(d.postTaxReturn)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Volatility:</span>
                        <span className="font-medium text-text">{formatPercent(d.volatility)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Score:</span>
                        <span className="font-medium text-text">{d.score} / 100</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter name="Instruments" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Single-row legend under chart */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-text-muted font-medium">{item.shortName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
