"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

export function LiveTicker() {
  const { data } = useQuery({
    queryKey: ["live-rates"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to fetch rates");
      return res.json();
    },
    staleTime: 300 * 1000,
    refetchInterval: 300 * 1000,
  });

  const repoRate = data?.macro?.find((m: any) => m.indicator === "repo_rate")?.value ?? 6.5;
  const cpi = data?.macro?.find((m: any) => m.indicator === "cpi_inflation")?.value ?? 5.22;
  const ppf = data?.smallSavings?.find((s: any) => s.schemeCode === "PPF")?.notifiedRatePct ?? 7.1;
  const topFd = data?.fd?.reduce((max: number, f: any) => Math.max(max, f.generalRatePct), 7.85) ?? 8.0;

  const items = [
    { label: "RBI repo rate", value: `${repoRate.toFixed(2)}%` },
    { label: "Inflation (CPI)", value: `${cpi.toFixed(2)}%` },
    { label: "PPF rate", value: `${ppf.toFixed(2)}%` },
    { label: "Top FD rate", value: `${topFd.toFixed(2)}%` },
  ];

  return (
    <div className="w-full h-10 bg-surface-muted border-b border-border text-xs flex items-center overflow-hidden select-none">
      <style>{`
        @keyframes ticker-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-marquee 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
            width: auto;
            flex-wrap: nowrap;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-full">
        {/* Solid Badge on Left */}
        <div className="flex items-center gap-2 font-semibold text-primary whitespace-nowrap shrink-0 z-10 bg-surface-muted pr-3 border-r border-border h-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-text">Live Rates</span>
        </div>

        {/* Marquee with soft edge fade */}
        <div
          className="overflow-hidden flex-1 relative h-full flex items-center"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
          }}
        >
          <div className="ticker-track flex items-center gap-10">
            {[...items, ...items].map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap shrink-0 text-xs">
                <span className="text-text-muted">{item.label}</span>
                <span className="font-semibold text-text tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
