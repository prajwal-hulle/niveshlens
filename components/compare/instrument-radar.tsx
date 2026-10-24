"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { InstrumentMetrics } from "@/lib/finance/types";

interface InstrumentRadarProps {
  instruments: InstrumentMetrics[];
}

export function InstrumentRadar({ instruments }: InstrumentRadarProps) {
  const dimensions = [
    { key: "returns", label: "Returns" },
    { key: "safety", label: "Capital Safety" },
    { key: "liquidity", label: "Liquidity" },
    { key: "taxEfficiency", label: "Tax Efficiency" },
    { key: "flexibility", label: "Flexibility" },
    { key: "transparency", label: "Transparency" },
  ];

  const radarData = dimensions.map((dim) => {
    const row: any = { dimension: dim.label };
    instruments.forEach((inst) => {
      row[inst.name] = (inst.radarScores as any)[dim.key] ?? 50;
    });
    return row;
  });

  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899"];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Multi-Dimensional Radar Profile
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          6-Axis Trade-off Balance (0 to 100). Highlights compromises in safety, liquidity, and transparency.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#334155" opacity={0.25} />
            <PolarAngleAxis dataKey="dimension" stroke="#94a3b8" fontSize={10} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
            {instruments.map((inst, idx) => (
              <Radar
                key={inst.id}
                name={inst.name}
                dataKey={inst.name}
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.25}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "11px",
                color: "#f8fafc",
              }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
