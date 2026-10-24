"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ShieldCheck, Percent, Flame } from "lucide-react";

export function LiveTicker() {
  const { data } = useQuery({
    queryKey: ["live-rates"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to fetch rates");
      return res.json();
    },
  });

  const repoRate = data?.macro?.find((m: any) => m.indicator === "repo_rate")?.value ?? 6.5;
  const cpi = data?.macro?.find((m: any) => m.indicator === "cpi_inflation")?.value ?? 5.22;
  const ppf = data?.smallSavings?.find((s: any) => s.schemeCode === "PPF")?.notifiedRatePct ?? 7.1;
  const topFd = data?.fd?.reduce((max: number, f: any) => Math.max(max, f.generalRatePct), 7.85) ?? 8.0;

  const items = [
    { label: "RBI Repo Rate", value: `${repoRate}%`, icon: Percent, desc: "Monetary Benchmark" },
    { label: "CPI Inflation", value: `${cpi}%`, icon: Flame, desc: "Cost of Living Drag" },
    { label: "PPF Rate (Q4)", value: `${ppf}%`, icon: ShieldCheck, desc: "Sovereign EEE Tax-Free" },
    { label: "Top Bank FD Rate", value: `${topFd}%`, icon: TrendingUp, desc: "Compounded Quarterly" },
  ];

  return (
    <div className="w-full bg-slate-900 text-slate-200 border-b border-slate-800 text-xs overflow-hidden py-2.5 px-4 shadow-inner relative group">
      <style>{`
        @keyframes ticker-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-marquee 28s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
            flex-wrap: wrap;
            width: 100%;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto flex items-center gap-4 relative">
        {/* Fixed LIVE RATES tag on the left */}
        <div className="flex items-center gap-2 font-semibold text-emerald-400 whitespace-nowrap shrink-0 z-10 bg-slate-900 pr-3 border-r border-slate-800 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] uppercase tracking-wider font-bold">Live Rates</span>
        </div>

        {/* Seamless infinite marquee */}
        <div className="overflow-hidden flex-1 relative">
          <div className="ticker-track flex items-center gap-8">
            {[...items, ...items].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-medium">{item.label}:</span>
                  <span className="font-bold text-white tabular-nums">{item.value}</span>
                  <span className="text-[10px] text-slate-400">({item.desc})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
