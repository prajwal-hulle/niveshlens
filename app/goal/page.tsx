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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          <span>Reverse SIP Goal Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Plan Your Target Wealth Corpus
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Calculate the exact monthly SIP required to achieve your financial goal, with optional annual step-up linked to salary increments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Inputs Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Goal Target & Horizon
          </h3>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Corpus (₹)
              </label>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹5 Lakhs</span>
              <span>₹5 Crores</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Time Horizon
              </label>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {horizonYears} Years
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Instrument Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Benchmark Return Vehicle
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange("MF")}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                  instrumentPreset === "MF"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                Equity MF (~12%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("PPF")}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                  instrumentPreset === "PPF"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                PPF ({ppfRate}%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("FD")}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                  instrumentPreset === "FD"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                Bank FD ({topFdRate}%)
              </button>
            </div>
          </div>

          {/* Step-up Option */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Annual Step-up SIP
              </label>
              <input
                type="checkbox"
                checked={enableStepUp}
                onChange={(e) => setEnableStepUp(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            {enableStepUp && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Annual Step-up Rate</span>
                  <span className="text-emerald-600 font-bold">{stepUpPct}% / yr</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={stepUpPct}
                  onChange={(e) => setStepUpPct(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Increases SIP amount every 12 months as your income rises.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Output & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Output Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">
                {enableStepUp ? "Initial Monthly SIP (Yr 1):" : "Monthly Fixed SIP:"}
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {format(enableStepUp ? requiredStepUpSip : requiredFlatSip)} / mo
              </div>
              <span className="text-[11px] text-slate-500">
                {enableStepUp ? `Steps up by ${stepUpPct}% annually` : "Constant through tenure"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Total Invested Principal:</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {format(finalInvested)}
              </div>
              <span className="text-[11px] text-slate-500">
                From your personal savings
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Wealth Created (Gains):
              </span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{format(totalGains)}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {Math.round((totalGains / finalCorpus) * 100)}% of final corpus is pure compounding!
              </span>
            </div>
          </div>

          {/* Area Chart: Principal vs Compounded Wealth */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Wealth Accumulation Trajectory
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
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
                    formatter={(val: any) => [format(val), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="Compounded Wealth"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Invested Capital"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.1}
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
