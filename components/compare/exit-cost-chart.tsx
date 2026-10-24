"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { useCurrency } from "../currency-context";

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
    const row: any = { year: `Year ${yr}` };
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
        costIncurred = yr < 7 ? Math.round(cumulativeInvested * 0.1) : 0; // illiquidity friction
      } else if (inst.type === "LIC") {
        // Exact surrender loss according to regulatory / brochure factors
        if (yr === 1) costIncurred = cumulativeInvested; // 100% loss
        else if (yr === 2) costIncurred = Math.round(cumulativeInvested * 0.7); // 70% loss
        else if (yr === 3) costIncurred = Math.round(cumulativeInvested * 0.65); // 65% loss
        else if (yr === 5) costIncurred = Math.round(cumulativeInvested * 0.5); // 50% loss
        else costIncurred = Math.round(cumulativeInvested * 0.35); // 35% loss
      }

      row[inst.name] = costIncurred;
    });

    return row;
  });

  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899"];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Cost of Premature Exit (Rupee Penalty)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estimated financial loss in ₹ if forced to liquidate your position at Year 1, 2, 3, 5, or 10
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 25, bottom: 15, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => format(v, 0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#f8fafc",
              }}
              formatter={(val: any) => [format(val), "Exit Penalty / Loss"]}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
            {instruments.map((inst, idx) => (
              <Bar
                key={inst.id}
                dataKey={inst.name}
                fill={colors[idx % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
