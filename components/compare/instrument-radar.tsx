"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { InstrumentMetrics } from "@/lib/finance/types";
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";

interface InstrumentRadarProps {
  instruments: InstrumentMetrics[];
}

export function InstrumentRadar({ instruments }: InstrumentRadarProps) {
  const dimensions = [
    { key: "returns", label: "Returns" },
    { key: "safety", label: "Safety" },
    { key: "liquidity", label: "Liquidity" },
    { key: "taxEfficiency", label: "Tax efficiency" },
    { key: "flexibility", label: "Flexibility" },
    { key: "transparency", label: "Transparency" },
  ];

  const radarData = dimensions.map((dim) => {
    const row: any = { dimension: dim.label };
    instruments.forEach((inst) => {
      const shortName = getShortInstrumentName(inst.name, inst.type);
      row[shortName] = (inst.radarScores as any)[dim.key] ?? 50;
    });
    return row;
  });

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-sm min-h-[340px] flex flex-col justify-between transition-colors">
      <div>
        <h3 className="font-semibold text-base text-text">
          6-Axis balance
        </h3>
        <p className="text-xs text-text-muted">
          Multi-dimensional trade-off profile (0 to 100) across safety, returns, and liquidity.
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
            <PolarGrid stroke="currentColor" className="text-border" opacity={0.6} />
            <PolarAngleAxis dataKey="dimension" stroke="currentColor" className="text-text-muted" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="currentColor" className="text-text-muted/60" fontSize={9} />
            {instruments.map((inst, idx) => {
              const shortName = getShortInstrumentName(inst.name, inst.type);
              const color = getInstrumentColor(idx);
              return (
                <Radar
                  key={inst.id}
                  name={shortName}
                  dataKey={shortName}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                />
              );
            })}
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                return (
                  <div className="bg-surface text-text p-2.5 rounded-lg border border-border text-xs space-y-1 shadow-md">
                    <div className="font-semibold text-text">{label}</div>
                    {payload.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-text-muted">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.name}:</span>
                        </span>
                        <span className="font-semibold tabular-nums text-text">{p.value}/100</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Single-row legend */}
      <div className="pt-1 flex flex-wrap items-center justify-center gap-4 text-xs">
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
