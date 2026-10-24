"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/components/currency-context";
import { fvSip, fvStepUpSip } from "@/lib/finance/compound";
import { formatPercent } from "@/lib/utils";
import { Target, TrendingUp, Calendar, Coins, Sparkles, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function GoalPage() {
  const { format } = useCurrency();

  // Inputs
  const [targetCorpus, setTargetCorpus] = useState(5000000); // ₹50 Lakhs
  const [horizonYears, setHorizonYears] = useState(12);
  const [stepUpPct, setStepUpPct] = useState(10); // 10% annual step-up
  const [enableStepUp, setEnableStepUp] = useState(true);
  const [expectedReturnPct, setExpectedReturnPct] = useState(12.0);
  const [instrumentPreset, setInstrumentPreset] = useState("MF");

  // Fetch live rates from DB
  const { data: ratesData } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const ppfRate = ratesData?.smallSavings?.find((s: any) => s.schemeCode === "PPF")?.notifiedRatePct ?? 7.1;
  const topFdRate = ratesData?.fd?.[0]?.generalRatePct ?? 7.0;

  const handlePresetChange = (preset: string) => {
    setInstrumentPreset(preset);
    if (preset === "PPF") setExpectedReturnPct(ppfRate);
    else if (preset === "FD") setExpectedReturnPct(topFdRate);
    else if (preset === "MF") setExpectedReturnPct(12.0);
  };

  // Solve for required monthly SIP using binary search bisection
  const solveRequiredSip = (target: number, rate: number, years: number, stepUp: number) => {
    let low = 100;
    let high = target / (years * 12);
    if (high < low) high = low * 10;
    high = high * 2;

    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      const fv = stepUp > 0 ? fvStepUpSip(mid, rate, years, stepUp) : fvSip(mid, rate, years);

      if (Math.abs(fv - target) < 100) return Math.round(mid);
      if (fv < target) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return Math.round((low + high) / 2);
  };

  const requiredFlatSip = solveRequiredSip(targetCorpus, expectedReturnPct, horizonYears, 0);
  const requiredStepUpSip = solveRequiredSip(
    targetCorpus,
    expectedReturnPct,
    horizonYears,
    enableStepUp ? stepUpPct : 0
  );

  // Generate Year-by-Year Schedule for chart
  const activeStartSip = enableStepUp ? requiredStepUpSip : requiredFlatSip;
  const activeStepUp = enableStepUp ? stepUpPct : 0;

  const chartData = [];
  let currentMonthly = activeStartSip;
  let cumulativeInvested = 0;

  for (let yr = 1; yr <= horizonYears; yr++) {
    cumulativeInvested += currentMonthly * 12;
    const corpus = fvStepUpSip(activeStartSip, expectedReturnPct, yr, activeStepUp);
    chartData.push({
      year: `Yr ${yr}`,
      "Invested Capital": Math.round(cumulativeInvested),
      "Compounded Wealth": Math.round(corpus),
    });
    currentMonthly = Math.round(currentMonthly * (1 + activeStepUp / 100));
  }

  const finalInvested = chartData[chartData.length - 1]?.["Invested Capital"] ?? 0;
  const finalCorpus = chartData[chartData.length - 1]?.["Compounded Wealth"] ?? targetCorpus;
  const totalGains = Math.max(0, finalCorpus - finalInvested);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
          SIP goal corpus planner
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
          Calculate the exact monthly SIP needed to reach your target corpus, with optional annual step-up.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Inputs Card */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4 transition-colors lg:sticky lg:top-20">
          <h3 className="font-semibold text-sm text-text border-b border-border pb-2">
            Target &amp; horizon
          </h3>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-medium text-text">
                Target corpus (₹)
              </label>
              <span className="text-xs font-semibold text-primary">
                {format(targetCorpus)}
              </span>
            </div>
            <input
              type="range"
              min={500000}
              max={50000000}
              step={500000}
              value={targetCorpus}
              onChange={(e) => setTargetCorpus(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>₹5 Lakhs</span>
              <span>₹5 Crores</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-medium text-text">
                Time horizon
              </label>
              <span className="text-xs font-semibold text-primary">
                {horizonYears} Years
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Instrument Preset */}
          <div>
            <label className="block text-xs font-medium text-text mb-1.5">
              Benchmark return vehicle
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange("MF")}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium border transition-colors ${
                  instrumentPreset === "MF"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                Equity MF (~12%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("PPF")}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium border transition-colors ${
                  instrumentPreset === "PPF"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                PPF ({ppfRate}%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("FD")}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium border transition-colors ${
                  instrumentPreset === "FD"
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                Bank FD ({topFdRate}%)
              </button>
            </div>
          </div>

          {/* Step-up Option */}
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text cursor-pointer">
                Annual step-up SIP
              </label>
              <input
                type="checkbox"
                checked={enableStepUp}
                onChange={(e) => setEnableStepUp(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
            </div>

            {enableStepUp && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-text-muted">Step-up rate</span>
                  <span className="text-primary font-semibold">{stepUpPct}% / yr</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={stepUpPct}
                  onChange={(e) => setStepUpPct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-[11px] text-text-muted">
                  Increases SIP amount annually as income rises.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Output & Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Plain Verdict Sentence */}
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-text leading-relaxed">
              To build a target of <strong>{format(targetCorpus)}</strong> in <strong>{horizonYears} years</strong>, start a monthly SIP of <strong>{format(activeStartSip)}</strong>{enableStepUp ? ` (stepping up by ${stepUpPct}% annually)` : " (fixed monthly)"} at {expectedReturnPct}% return. Your total personal investment will be {format(finalInvested)}, creating <strong>+{format(totalGains)}</strong> in compound wealth.
            </div>
          </div>

          {/* Output Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">
                {enableStepUp ? "Initial SIP (Yr 1):" : "Monthly fixed SIP:"}
              </span>
              <div className="text-lg font-semibold text-primary tabular-nums">
                {format(enableStepUp ? requiredStepUpSip : requiredFlatSip)} / mo
              </div>
              <span className="text-[11px] text-text-muted">
                {enableStepUp ? `Steps up by ${stepUpPct}% yearly` : "Constant through tenure"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 transition-colors">
              <span className="text-xs text-text-muted">Total invested:</span>
              <div className="text-lg font-semibold text-text tabular-nums">
                {format(finalInvested)}
              </div>
              <span className="text-[11px] text-text-muted">
                Personal principal contribution
              </span>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1 transition-colors">
              <span className="text-xs text-primary font-medium">
                Wealth created:
              </span>
              <div className="text-lg font-semibold text-primary tabular-nums">
                +{format(totalGains)}
              </div>
              <span className="text-[11px] text-primary/80">
                {Math.round((totalGains / finalCorpus) * 100)}% of final corpus is compounding
              </span>
            </div>
          </div>

          {/* Area Chart: Principal vs Compounded Wealth */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4 transition-colors">
            <h3 className="font-semibold text-sm text-text">
              Wealth accumulation trajectory
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 15, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="year" stroke="currentColor" className="text-text-muted" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="currentColor"
                    className="text-text-muted"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => format(v, 0)}
                  />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || payload.length === 0) return null;
                      return (
                        <div className="bg-surface text-text p-2.5 rounded-lg border border-border text-xs space-y-1 shadow-md">
                          <div className="text-text-muted">{label}</div>
                          {payload.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="text-text-muted">{p.name}:</span>
                              <span className="font-semibold tabular-nums text-text">{format(p.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="Compounded Wealth"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Invested Capital"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
