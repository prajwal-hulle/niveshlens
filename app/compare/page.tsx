"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { InstrumentSelector, SelectedInstrumentConfig } from "@/components/compare/instrument-selector";
import { ProjectionChart } from "@/components/compare/projection-chart";
import { MetricsTable } from "@/components/compare/metrics-table";
import { RiskReturnScatter } from "@/components/compare/risk-return-scatter";
import { InstrumentRadar } from "@/components/compare/instrument-radar";
import { ExitCostChart } from "@/components/compare/exit-cost-chart";
import { ScoringDrawer } from "@/components/compare/scoring-drawer";
import { TradeoffCards } from "@/components/compare/tradeoff-cards";
import { InsuranceAdequacyPanel } from "@/components/compare/insurance-adequacy-panel";
import { ShareExportBar } from "@/components/compare/share-export-bar";
import { DEFAULT_WEIGHTS, ScoringWeights } from "@/lib/scoring";
import { UserProfile, InstrumentMetrics } from "@/lib/finance/types";
import { Scale, Loader2, AlertCircle, Table, BarChart2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/utils";

type CompareTab = "table" | "charts" | "warnings" | "insurance-gap";
type ChartView = "growth" | "scatter" | "radar" | "exit";

function CompareContent() {
  const searchParams = useSearchParams();

  // Tab state with hash sync
  const [activeTab, setActiveTab] = useState<CompareTab>("table");
  const [activeChartView, setActiveChartView] = useState<ChartView>("growth");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as CompareTab;
      if (["table", "charts", "warnings", "insurance-gap"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (tab: CompareTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // Parse user profile from query params with sensible defaults
  const profile: UserProfile = {
    age: Number(searchParams.get("age")) || 32,
    annualIncome: Number(searchParams.get("income")) || 1200000,
    taxRegime: (searchParams.get("regime") as any) || "NEW",
    financialYear: (searchParams.get("fy") as any) || "2024-25",
    investmentMode: (searchParams.get("mode") as any) || "SIP",
    investmentAmount: Number(searchParams.get("amount")) || 15000,
    horizonYears: Number(searchParams.get("horizon")) || 10,
    riskAppetite: (searchParams.get("risk") as any) || "MODERATE",
    riskScore: Number(searchParams.get("riskScore")) || 52,
    liquidityNeedMonths: Number(searchParams.get("liquidity")) || 36,
    dependents: Number(searchParams.get("dependents")) || 2,
    existingLifeCover: Number(searchParams.get("existingCover")) || 2500000,
    outstandingLiabilities: Number(searchParams.get("liabilities")) || 1000000,
    goalType: (searchParams.get("goal") as any) || "WEALTH",
  };

  // Pre-selected default comparison: FD vs PPF vs Parag Parikh Flexi Cap vs LIC Jeevan Labh
  const [selectedInstruments, setSelectedInstruments] = useState<SelectedInstrumentConfig[]>([
    { id: "fd-default", type: "FD", bankId: "sbi-1y" },
    { id: "ppf-default", type: "PPF" },
    { id: "mf-default", type: "MF", schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund - Direct - Growth" },
    {
      id: "lic-default",
      type: "LIC",
      planId: "lic-jeevan-labh-936",
      annualPremium: 85600,
      sumAssured: 1000000,
      policyTerm: 16,
      premiumPayingTerm: 10,
    },
  ]);

  // Scoring weights state
  const [customWeights, setCustomWeights] = useState<ScoringWeights>(
    DEFAULT_WEIGHTS[profile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED
  );

  // Fetch available bank FDs and LIC plans for selector
  const { data: ratesData } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  // Query comparison calculation
  const {
    data: compareData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["comparison", profile, selectedInstruments, customWeights],
    queryFn: async () => {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          instruments: selectedInstruments,
          customWeights,
        }),
      });
      if (!res.ok) throw new Error("Comparison calculation failed");
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const availableBanks = ratesData?.fd || [];
  const availableInsurancePlans = ratesData?.insurance || [];

  return (
    <div className="w-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Scheme comparator
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Compare returns, tax drag, liquidity, charges, and trade-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScoringDrawer
            weights={customWeights}
            onChange={(w) => setCustomWeights(w)}
            onReset={() =>
              setCustomWeights(DEFAULT_WEIGHTS[profile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED)
            }
          />
        </div>
      </div>

      {/* Instrument Selector Bar */}
      <div className="p-3.5 rounded-xl bg-surface border border-border">
        <InstrumentSelector
          selected={selectedInstruments}
          onChange={setSelectedInstruments}
          availableBanks={availableBanks}
          availableInsurancePlans={availableInsurancePlans}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center rounded-xl border border-border bg-surface space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-sm font-medium text-text">
            Calculating cash flows and percentiles...
          </p>
          <p className="text-xs text-text-muted">
            Evaluating historical rolling returns, marginal tax brackets, and inflation drag.
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 text-danger text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not compute comparison. Ensure selected instruments have valid data.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded bg-danger text-white font-medium hover:bg-danger/90 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Comparison Data */}
      {compareData && (
        <div className="space-y-6">
          {profile.financialYear === "2026-27" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  <strong>FY 2026-27 forward projection:</strong> Uses unnotified tax slabs. Verify before filing.
                </span>
              </div>
              <a
                href="https://www.incometax.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 text-center transition-colors text-xs"
              >
                incometax.gov.in
              </a>
            </div>
          )}

          {/* 1. Summary Cards Row (1 compact card per instrument with horizontal scroll on mobile) */}
          <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-[640px] sm:min-w-0">
              {compareData.instruments.map((inst: InstrumentMetrics, idx: number) => {
                const shortName = getShortInstrumentName(inst.name, inst.type);
                const color = getInstrumentColor(idx);

                return (
                  <div
                    key={inst.id}
                    className="flex-1 min-w-[200px] p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-sm text-text truncate" title={inst.name}>
                          {shortName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0">
                        {inst.compositeScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
                      <div>
                        <div className="text-[11px] text-text-muted">Post-tax</div>
                        <div className="font-medium text-text tabular-nums">
                          {formatPercent(inst.postTaxReturnPct)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-text-muted">Real return</div>
                        <div className={`font-semibold tabular-nums ${inst.realReturnPct < 0 ? "text-danger" : "text-primary"}`}>
                          {formatPercent(inst.realReturnPct, 2, true)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-text-muted">Lock-in</div>
                        <div className="font-medium text-text truncate">
                          {inst.lockInPeriodMonths > 0 ? `${Math.round(inst.lockInPeriodMonths / 12)} yrs` : "None (T+2)"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-text-muted">Risk</div>
                        <div className="font-medium text-text truncate">
                          {inst.volatilityPct > 0 ? `${formatPercent(inst.volatilityPct)}` : "Guaranteed"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Four Tabs: Table | Charts | Warnings | Insurance gap */}
          <div className="space-y-4">
            <div className="flex border-b border-border text-xs sm:text-sm font-medium gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => handleTabChange("table")}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
                  activeTab === "table"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("charts")}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
                  activeTab === "charts"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Charts</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("warnings")}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
                  activeTab === "warnings"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Warnings</span>
                {compareData.tradeoffs?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-warning/10 text-warning font-semibold">
                    {compareData.tradeoffs.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("insurance-gap")}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
                  activeTab === "insurance-gap"
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Insurance gap</span>
                {compareData.insuranceAdequacy?.hasGap && (
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                )}
              </button>
            </div>

            {/* Tab 1: Table */}
            {activeTab === "table" && (
              <MetricsTable instruments={compareData.instruments} profile={profile} />
            )}

            {/* Tab 2: Charts with Segmented Control */}
            {activeTab === "charts" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-muted rounded-lg border border-border w-fit text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveChartView("growth")}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      activeChartView === "growth"
                        ? "bg-surface text-primary shadow-sm font-semibold"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    Corpus growth
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartView("scatter")}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      activeChartView === "scatter"
                        ? "bg-surface text-primary shadow-sm font-semibold"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    Risk vs return
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartView("radar")}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      activeChartView === "radar"
                        ? "bg-surface text-primary shadow-sm font-semibold"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    6-Axis balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartView("exit")}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      activeChartView === "exit"
                        ? "bg-surface text-primary shadow-sm font-semibold"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    Cost of early exit
                  </button>
                </div>

                {activeChartView === "growth" && (
                  <ProjectionChart instruments={compareData.instruments} profile={profile} />
                )}
                {activeChartView === "scatter" && (
                  <RiskReturnScatter instruments={compareData.instruments} />
                )}
                {activeChartView === "radar" && (
                  <InstrumentRadar instruments={compareData.instruments} />
                )}
                {activeChartView === "exit" && (
                  <ExitCostChart instruments={compareData.instruments} profile={profile} />
                )}
              </div>
            )}

            {/* Tab 3: Warnings */}
            {activeTab === "warnings" && (
              <TradeoffCards flags={compareData.tradeoffs} />
            )}

            {/* Tab 4: Insurance gap */}
            {activeTab === "insurance-gap" && (
              compareData.insuranceAdequacy ? (
                <InsuranceAdequacyPanel adequacy={compareData.insuranceAdequacy} />
              ) : (
                <div className="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
                  No insurance data needed for selected portfolio.
                </div>
              )
            )}
          </div>

          {/* 3. Compact Save & Share Bar */}
          <ShareExportBar instruments={compareData.instruments} profile={profile} />
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs text-text-muted">Loading comparator...</div>}>
      <CompareContent />
    </React.Suspense>
  );
}
