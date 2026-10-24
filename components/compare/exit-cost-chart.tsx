"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";

interface ExitCostChartProps {
  instruments: InstrumentMetrics[];
  profile: UserProfile;
}

export function ExitCostChart({ instruments, profile }: ExitCostChartProps) {
  const { format } = useCurrency();

  const years = [1, 2, 3, 5, 10];
  const annualInvestment =
    profile.investmentMode === "SIP" ? profile.investmentAmount * 12 : profile.investmentAmount;

  const data = years.map((yr) => {
    const row: any = { year: `Yr ${yr}` };
    const cumulativeInvested = yr * annualInvestment;

    instruments.forEach((inst) => {
      let costIncurred = 0;

      if (inst.type === "MF") {
        // Exit load typically applies only in Year 1 (1%)
        costIncurred = yr === 1 ? Math.round(cumulativeInvested * 0.01) : 0;
      } else if (inst.type === "FD") {
        // Premature penalty ~ 1% of interest earned
        costIncurred = Math.round(cumulativeInvested * (inst.prematurePenaltyPct / 100));
      } else if (inst.type === "PPF") {
        // Year 1-6: No exit allowed (capital locked). Year 7+: partial withdrawal allowed with zero penalty
        costIncurred = yr < 7 ? Math.round(cumulativeInvested * 0.1) : 0;
      } else if (inst.type === "LIC") {
        // Exact surrender loss according to regulatory / brochure factors
        if (yr === 1) costIncurred = cumulativeInvested; // 100% loss
        else if (yr === 2) costIncurred = Math.round(cumulativeInvested * 0.7); // 70% loss
        else if (yr === 3) costIncurred = Math.round(cumulativeInvested * 0.65); // 65% loss
        else if (yr === 5) costIncurred = Math.round(cumulativeInvested * 0.5); // 50% loss
        else costIncurred = Math.round(cumulativeInvested * 0.35); // 35% loss
      }

      const shortName = getShortInstrumentName(inst.name, inst.type);
      row[shortName] = costIncurred;
    });

    return row;
  });

  const formatCompactRupee = (val: number) => {
    if (val === 0) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm min-h-[340px] flex flex-col justify-between transition-colors">
      <div>
        <h3 className="font-semibold text-base text-text">
          Cost of early exit
        </h3>
        <p className="text-xs text-text-muted">
          Estimated financial loss in ₹ if liquidating at Year 1, 2, 3, 5, or 10.
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, bottom: 15, left: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
            <XAxis dataKey="year" stroke="currentColor" className="text-text-muted" fontSize={11} tickLine={false} />
            <YAxis
              stroke="currentColor"
              className="text-text-muted"
              fontSize={11}
              tickLine={false}
              tickFormatter={formatCompactRupee}
              width={55}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                return (
                  <div className="bg-surface text-text p-3 rounded-lg border border-border text-xs space-y-1.5 shadow-md">
                    <div className="font-semibold text-text">{label} Exit Penalty</div>
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
            {instruments.map((inst, idx) => {
              const shortName = getShortInstrumentName(inst.name, inst.type);
              const color = getInstrumentColor(idx);
              return (
                <Bar
                  key={inst.id}
                  dataKey={shortName}
                  name={shortName}
                  fill={color}
                  radius={[3, 3, 0, 0]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Single-row legend */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
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
