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
import { UserProfile } from "@/lib/finance/types";
import { Scale, Loader2, Sparkles, AlertCircle } from "lucide-react";

function CompareContent() {
  const searchParams = useSearchParams();

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
    <div className="w-full space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Multi-Asset Comparator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Investment Risk & Scheme Comparator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparing returns, real inflation drag, liquidity, charges, and hidden trade-offs across your portfolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
        <InstrumentSelector
          selected={selectedInstruments}
          onChange={setSelectedInstruments}
          availableBanks={availableBanks}
          availableInsurancePlans={availableInsurancePlans}
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Calculating precision cash flows & statistical percentiles...
          </p>
          <p className="text-xs text-slate-400">
            Evaluating historical rolling returns, marginal tax slabs, and Fisher real purchasing power.
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Could not compute comparison. Ensure selected instruments have valid data.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Comparison Data */}
      {compareData && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {profile.financialYear === "2026-27" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">⚠️</span>
                <div>
                  <strong className="font-bold">FY 2026-27 Forward Projection:</strong>
                  <span className="ml-1 text-slate-700 dark:text-slate-300">
                    Results incorporate unnotified FY 2026-27 income tax slabs. Verify official notifications before making tax decisions.
                  </span>
                </div>
              </div>
              <a
                href="https://www.incometax.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 text-center transition-colors shadow-sm"
              >
                Unverified projection – verify at incometax.gov.in
              </a>
            </div>
          )}

          {/* 1. Side-by-Side Analytical Metrics Table */}
          <MetricsTable instruments={compareData.instruments} profile={profile} />

          {/* 2. Projected Corpus Growth Line Chart */}
          <ProjectionChart instruments={compareData.instruments} profile={profile} />

          {/* 3. Insurance Adequacy Audit Panel (correction #12) */}
          {compareData.insuranceAdequacy && (
            <InsuranceAdequacyPanel adequacy={compareData.insuranceAdequacy} />
          )}

          {/* 4. Hidden Trade-Off Warning Detector */}
          <TradeoffCards flags={compareData.tradeoffs} />

          {/* 5. Visual Deep-Dives: Risk-Return Scatter, Radar Profile, and Exit Cost Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RiskReturnScatter instruments={compareData.instruments} />
            <InstrumentRadar instruments={compareData.instruments} />
            <ExitCostChart instruments={compareData.instruments} profile={profile} />
          </div>

          {/* 6. Save & Share Export Bar */}
          <ShareExportBar instruments={compareData.instruments} profile={profile} />
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500">Loading comparator...</div>}>
      <CompareContent />
    </React.Suspense>
  );
}
