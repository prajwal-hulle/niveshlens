"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { HelpTooltip } from "@/components/help-tooltip";
import { getStagedInstruments, clearStagedInstruments } from "@/components/compare/floating-compare-pill";
import { DEFAULT_WEIGHTS, ScoringWeights } from "@/lib/scoring";
import { UserProfile, RiskAppetite, TaxRegime } from "@/lib/finance/types";
import {
  Scale,
  Loader2,
  AlertCircle,
  Table,
  BarChart2,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  X,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getShortInstrumentName, getInstrumentColor } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/utils";
import { useCurrency } from "@/components/currency-context";

type CompareTab = "table" | "charts" | "warnings" | "insurance-gap";
type ChartView = "growth" | "scatter" | "radar" | "exit";

function CompareContent() {
  const searchParams = useSearchParams();
  const { format } = useCurrency();

  // Tab state with hash sync
  const [activeTab, setActiveTab] = useState<CompareTab>("table");
  const [activeChartView, setActiveChartView] = useState<ChartView>("growth");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as CompareTab;
      if (["table", "charts", "warnings", "insurance-gap"].includes(hash)) {
        setActiveTab(hash);
      }
      if (sessionStorage.getItem("niveshlens_compare_hint_dismissed")) {
        setHintDismissed(true);
      }
    }
  }, []);

  const dismissHint = () => {
    setHintDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("niveshlens_compare_hint_dismissed", "true");
    }
  };

  const handleTabChange = (tab: CompareTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // Primary user inputs
  const presetParam = searchParams.get("preset");

  // Derive initial values from preset or query params
  const initialMode = (searchParams.get("mode") as any) || (presetParam === "emergency" ? "LUMPSUM" : "SIP");
  const initialAmount = Number(searchParams.get("amount")) || (presetParam === "emergency" ? 100000 : presetParam === "tax-saving" ? 12500 : 15000);
  const initialYears = Number(searchParams.get("horizon")) || (presetParam === "emergency" ? 1 : presetParam === "tax-saving" ? 5 : presetParam === "growth" ? 10 : presetParam === "child-education" ? 12 : presetParam === "retirement" ? 15 : 10);
  const initialRisk = (searchParams.get("risk") as RiskAppetite) || (presetParam === "emergency" ? "CONSERVATIVE" : presetParam === "growth" ? "AGGRESSIVE" : "MODERATE");

  const [investmentMode, setInvestmentMode] = useState<"LUMPSUM" | "SIP">(initialMode);
  const [investmentAmount, setInvestmentAmount] = useState<number>(initialAmount);
  const [horizonYears, setHorizonYears] = useState<number>(initialYears);
  const [riskComfort, setRiskComfort] = useState<RiskAppetite>(initialRisk);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>((searchParams.get("regime") as TaxRegime) || (presetParam === "tax-saving" ? "OLD" : "NEW"));
  const [financialYear, setFinancialYear] = useState<"2024-25" | "2025-26" | "2026-27">("2024-25");

  // Secondary details in collapsible section
  const [age, setAge] = useState<number>(Number(searchParams.get("age")) || 32);
  const [annualIncome, setAnnualIncome] = useState<number>(Number(searchParams.get("income")) || 1200000);
  const [existingLifeCover, setExistingLifeCover] = useState<number>(Number(searchParams.get("existingCover")) || 2500000);
  const [outstandingLiabilities, setOutstandingLiabilities] = useState<number>(Number(searchParams.get("liabilities")) || 1000000);
  const [dependents, setDependents] = useState<number>(Number(searchParams.get("dependents")) || 2);

  // Fetch verified master rates from DB
  const { data: ratesData } = useQuery({
    queryKey: ["rates-master"],
    queryFn: async () => {
      const res = await fetch("/api/rates");
      if (!res.ok) throw new Error("Failed to load rates");
      return res.json();
    },
  });

  const availableBanks = ratesData?.fd || [];
  const availableInsurancePlans = ratesData?.insurance || [];

  // Selected instruments list
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

  // Check for staged instruments or apply presets
  useEffect(() => {
    const staged = getStagedInstruments();
    if (staged.length > 0) {
      setSelectedInstruments(staged);
      clearStagedInstruments();
      return;
    }

    if (presetParam) {
      applyPreset(presetParam);
    }
  }, [presetParam, ratesData]);

  const applyPreset = (preset: string) => {
    if (preset === "tax-saving") {
      setHorizonYears(5);
      setRiskComfort("MODERATE");
      setTaxRegime("OLD");
      setInvestmentAmount(12500);
      setInvestmentMode("SIP");

      // Best 5-year FD from DB
      const fiveYearFd = availableBanks.find((b: any) => b.tenureBucket.toLowerCase().includes("5") || b.tenureBucket.toLowerCase().includes("tax")) || availableBanks[0];
      setSelectedInstruments([
        { id: `ppf-${Date.now()}`, type: "PPF" },
        ...(fiveYearFd ? [{ id: `fd-${fiveYearFd.id}-${Date.now()}`, type: "FD" as const, bankId: fiveYearFd.id }] : []),
        { id: `mf-elss-${Date.now()}`, type: "MF" as const, schemeCode: 119598, schemeName: "Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth" },
      ]);
    } else if (preset === "emergency") {
      setHorizonYears(1);
      setRiskComfort("CONSERVATIVE");
      setInvestmentAmount(100000);
      setInvestmentMode("LUMPSUM");

      const shortFd = availableBanks[0];
      setSelectedInstruments([
        ...(shortFd ? [{ id: `fd-${shortFd.id}-${Date.now()}`, type: "FD" as const, bankId: shortFd.id }] : []),
        { id: `ppf-${Date.now()}`, type: "PPF" },
      ]);
    } else if (preset === "growth") {
      setHorizonYears(10);
      setRiskComfort("AGGRESSIVE");
      setInvestmentAmount(15000);
      setInvestmentMode("SIP");

      setSelectedInstruments([
        { id: `mf-${Date.now()}`, type: "MF", schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund - Direct - Growth" },
        { id: `ppf-${Date.now()}`, type: "PPF" },
      ]);
    } else if (preset === "child-education") {
      setHorizonYears(12);
      setRiskComfort("MODERATE");
      setInvestmentAmount(10000);
      setInvestmentMode("SIP");

      setSelectedInstruments([
        { id: `mf-${Date.now()}`, type: "MF", schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund - Direct - Growth" },
        { id: `ppf-${Date.now()}`, type: "PPF" },
      ]);
    } else if (preset === "retirement") {
      setHorizonYears(15);
      setRiskComfort("MODERATE");
      setInvestmentAmount(20000);
      setInvestmentMode("SIP");

      const topFd = availableBanks[0];
      setSelectedInstruments([
        { id: `ppf-${Date.now()}`, type: "PPF" },
        { id: `mf-${Date.now()}`, type: "MF", schemeCode: 122639, schemeName: "Parag Parikh Flexi Cap Fund - Direct - Growth" },
        ...(topFd ? [{ id: `fd-${topFd.id}-${Date.now()}`, type: "FD" as const, bankId: topFd.id }] : []),
      ]);
    }
  };

  const handleReset = () => {
    setInvestmentMode("SIP");
    setInvestmentAmount(15000);
    setHorizonYears(10);
    setRiskComfort("MODERATE");
    setTaxRegime("NEW");
    setFinancialYear("2024-25");
    setAge(32);
    setAnnualIncome(1200000);
    setExistingLifeCover(2500000);
    setOutstandingLiabilities(1000000);
    setDependents(2);
    setSelectedInstruments([
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
  };

  // Construct current profile object
  const profile: UserProfile = useMemo(
    () => ({
      age,
      annualIncome,
      taxRegime,
      financialYear,
      investmentMode,
      investmentAmount,
      horizonYears,
      riskAppetite: riskComfort,
      riskScore: riskComfort === "CONSERVATIVE" ? 30 : riskComfort === "AGGRESSIVE" ? 75 : 52,
      liquidityNeedMonths: horizonYears <= 2 ? 12 : 36,
      dependents,
      existingLifeCover,
      outstandingLiabilities,
      goalType: "WEALTH",
    }),
    [
      age,
      annualIncome,
      taxRegime,
      financialYear,
      investmentMode,
      investmentAmount,
      horizonYears,
      riskComfort,
      dependents,
      existingLifeCover,
      outstandingLiabilities,
    ]
  );

  // Debounced profile state (400ms) for smooth live recalculation
  const [debouncedProfile, setDebouncedProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProfile(profile);
      // Sync URL parameters without page reload
      if (typeof window !== "undefined") {
        const params = new URLSearchParams();
        params.set("mode", profile.investmentMode);
        params.set("amount", String(profile.investmentAmount));
        params.set("horizon", String(profile.horizonYears));
        params.set("risk", profile.riskAppetite);
        params.set("regime", profile.taxRegime);
        window.history.replaceState(null, "", `?${params.toString()}${window.location.hash}`);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [profile]);

  // Scoring weights state
  const [customWeights, setCustomWeights] = useState<ScoringWeights>(
    DEFAULT_WEIGHTS[riskComfort] || DEFAULT_WEIGHTS.BALANCED
  );

  useEffect(() => {
    setCustomWeights(DEFAULT_WEIGHTS[riskComfort] || DEFAULT_WEIGHTS.BALANCED);
  }, [riskComfort]);

  // Query comparison calculation with keepPreviousData semantics
  const {
    data: compareData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["comparison", debouncedProfile, selectedInstruments, customWeights],
    queryFn: async () => {
      if (selectedInstruments.length === 0) return null;
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: debouncedProfile,
          instruments: selectedInstruments,
          customWeights,
        }),
      });
      if (!res.ok) throw new Error("Comparison calculation failed");
      return res.json();
    },
    enabled: selectedInstruments.length > 0,
    staleTime: 60 * 1000,
  });

  // Derive plain-language verdict from computed response data
  const verdict = useMemo(() => {
    if (!compareData?.instruments || compareData.instruments.length === 0) return null;

    const list = [...compareData.instruments];
    const highestRealReturn = [...list].sort((a, b) => b.realReturnPct - a.realReturnPct)[0];
    const safest = [...list].sort((a, b) => b.radarScores.safety - a.radarScores.safety)[0];
    const mostFlexible = [...list].sort(
      (a, b) =>
        a.prematurePenaltyPct + a.lockInPeriodMonths - (b.prematurePenaltyPct + b.lockInPeriodMonths)
    )[0];

    const getWhyReturn = (type: string) => {
      if (type === "MF") return "Equity market compounding historically beats CPI inflation after capital gains tax.";
      if (type === "PPF") return "Completely tax-free sovereign interest protects your purchasing power.";
      if (type === "FD") return "Fixed nominal interest with quarterly compounding guarantees exact terminal cash flows.";
      return "Endowment maturity payout combines guaranteed sum assured with declared bonuses.";
    };

    const getWhySafety = (type: string) => {
      if (type === "PPF") return "Backed by Sovereign Government of India guarantee with zero default risk.";
      if (type === "FD") return "Backed by scheduled bank capital and DICGC insurance up to ₹5 Lakhs.";
      if (type === "LIC") return "Backed by sovereign guarantee under Section 37 of the LIC Act, 1956.";
      return "Regulated by SEBI with assets held in independent custodian trusts.";
    };

    const getWhyFlexible = (type: string) => {
      if (type === "FD") return "Can be closed anytime before maturity with standard 0.5%–1% penalty.";
      if (type === "MF") return "Redeemable on any business day; zero exit load after 365 days.";
      if (type === "PPF") return "Allows partial withdrawals from Year 7 and low-interest loans from Year 3.";
      return "Surrendering early forfeits a large portion of paid premiums.";
    };

    return {
      highestRealReturn,
      whyReturn: getWhyReturn(highestRealReturn.type),
      safest,
      whySafety: getWhySafety(safest.type),
      mostFlexible,
      whyFlexible: getWhyFlexible(mostFlexible.type),
    };
  }, [compareData]);

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight flex items-center gap-2">
            <span>Scheme comparator</span>
            {isFetching && (
              <span title="Updating results...">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Compare returns, tax drag, liquidity, charges, and trade-offs side by side.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScoringDrawer
            weights={customWeights}
            onChange={(w) => setCustomWeights(w)}
            onReset={() =>
              setCustomWeights(DEFAULT_WEIGHTS[riskComfort] || DEFAULT_WEIGHTS.BALANCED)
            }
          />
        </div>
      </div>

      {/* Dismissible Hint Strip */}
      {!hintDismissed && (
        <div className="p-3 rounded-xl bg-surface-muted border border-border flex items-center justify-between gap-3 text-xs text-text transition-all">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Tip:</strong> Change any number on the left and the results update live.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="p-1 rounded text-text-muted hover:text-text"
            aria-label="Dismiss tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Panel: Your Details */}
        <aside
          id="details"
          className="lg:col-span-4 lg:sticky lg:top-20 space-y-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-semibold text-sm text-text flex items-center gap-1.5">
              <span>Your details</span>
              <HelpTooltip text="Your savings amount, horizon, and tax slab used to evaluate actual take-home returns." />
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-primary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Amount & Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text">Investment amount</label>
              <div className="flex items-center bg-surface-muted p-0.5 rounded-lg border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setInvestmentMode("SIP")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    investmentMode === "SIP"
                      ? "bg-surface font-semibold text-primary shadow-sm"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInvestmentMode("LUMPSUM")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    investmentMode === "LUMPSUM"
                      ? "bg-surface font-semibold text-primary shadow-sm"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  One-time
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-muted text-xs font-semibold">₹</span>
              <input
                type="number"
                step={investmentMode === "SIP" ? 1000 : 10000}
                min={500}
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="text-[11px] text-text-muted">
              {format(investmentAmount)} {investmentMode === "SIP" ? "per month" : "lump sum"}
            </div>
          </div>

          {/* Horizon (Years) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text flex items-center gap-1">
                <span>Investment horizon</span>
                <HelpTooltip text="How many years you plan to keep your money invested before withdrawing." />
              </label>
              <span className="font-semibold text-text tabular-nums">{horizonYears} years</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Risk Comfort */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text">
              Risk comfort
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Low", value: "CONSERVATIVE" },
                { label: "Medium", value: "MODERATE" },
                { label: "High", value: "AGGRESSIVE" },
              ].map((rc) => (
                <button
                  key={rc.value}
                  type="button"
                  onClick={() => setRiskComfort(rc.value as RiskAppetite)}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    riskComfort === rc.value
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-surface border-border text-text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  {rc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Slab & Regime */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text flex items-center gap-1">
              <span>Tax regime &amp; year</span>
              <HelpTooltip text="Determines TDS thresholds, 80C deductions, and capital gains tax brackets." />
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NEW">New Tax Regime</option>
                <option value="OLD">Old Tax Regime</option>
              </select>

              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="2024-25">FY 2024-25</option>
                <option value="2025-26">FY 2025-26</option>
                <option value="2026-27">FY 2026-27</option>
              </select>
            </div>
          </div>

          {/* Collapsed "More details" Section */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full flex items-center justify-between text-xs font-medium text-text-muted hover:text-text transition-colors"
            >
              <span>More details (optional)</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showMoreDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMoreDetails && (
              <div className="pt-3 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value) || 30)}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Dependents</label>
                    <input
                      type="number"
                      value={dependents}
                      onChange={(e) => setDependents(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-text-muted">Annual Income (₹)</label>
                  <input
                    type="number"
                    step={50000}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-text-muted">Existing Life Cover (₹)</label>
                  <input
                    type="number"
                    step={100000}
                    value={existingLifeCover}
                    onChange={(e) => setExistingLifeCover(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-text-muted">Outstanding Loans / Debt (₹)</label>
                  <input
                    type="number"
                    step={50000}
                    value={outstandingLiabilities}
                    onChange={(e) => setOutstandingLiabilities(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Panel: Live Results */}
        <section className="lg:col-span-8 space-y-6">
          {/* Instrument Selector Bar with single + Add button */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-sm">
            <InstrumentSelector
              selected={selectedInstruments}
              onChange={setSelectedInstruments}
              availableBanks={availableBanks}
              availableInsurancePlans={availableInsurancePlans}
              onSelectPreset={applyPreset}
            />
          </div>

          {/* Empty State */}
          {selectedInstruments.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-border bg-surface space-y-3">
              <Scale className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-sm font-medium text-text">
                You have no instruments selected yet. Pick a suggested preset below to start comparing.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyPreset("tax-saving")}
                  className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover"
                >
                  Load Tax-Saving Preset
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 text-danger text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>We could not load comparison data. Check your inputs and try again.</span>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1 rounded bg-danger text-white font-medium hover:bg-danger/90 text-xs"
              >
                Retry calculation
              </button>
            </div>
          )}

          {/* Initial Loading skeleton (only when no data is cached yet) */}
          {isLoading && !compareData && (
            <div className="p-12 text-center rounded-2xl border border-border bg-surface space-y-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
              <p className="text-sm font-medium text-text">
                Calculating returns and risk trade-offs...
              </p>
              <p className="text-xs text-text-muted">
                Evaluating marginal tax brackets, Fisher real returns, and historical drawdowns.
              </p>
            </div>
          )}

          {/* Computed Results */}
          {compareData && (
            <div className="space-y-6">
              {/* FY 2026-27 Disclaimer Banner */}
              {profile.financialYear === "2026-27" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-300">
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
                    className="underline hover:no-underline font-medium shrink-0"
                  >
                    incometax.gov.in
                  </a>
                </div>
              )}

              {/* Plain-Language Verdict Card */}
              {verdict && (
                <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span>Summary Verdict</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Highest Return */}
                    <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-1">
                      <div className="font-medium text-text">
                        Over {profile.horizonYears} years,{" "}
                        <strong className="text-primary">{verdict.highestRealReturn.name}</strong> gives the highest real return after tax ({formatPercent(verdict.highestRealReturn.realReturnPct)}).
                      </div>
                      <div className="text-[11px] text-text-muted">{verdict.whyReturn}</div>
                    </div>

                    {/* Safest */}
                    <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-1">
                      <div className="font-medium text-text">
                        <strong className="text-primary">{verdict.safest.name}</strong> is the safest option ({verdict.safest.radarScores.safety}/100 safety score).
                      </div>
                      <div className="text-[11px] text-text-muted">{verdict.whySafety}</div>
                    </div>

                    {/* Lowest Penalty / Flexible */}
                    <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-1">
                      <div className="font-medium text-text">
                        <strong className="text-primary">{verdict.mostFlexible.name}</strong> lets you exit with the lowest penalty ({verdict.mostFlexible.prematurePenaltyPct}% penalty drag).
                      </div>
                      <div className="text-[11px] text-text-muted">{verdict.whyFlexible}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Cards Row Per Instrument */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {compareData.instruments.map((inst: any, idx: number) => {
                  const color = getInstrumentColor(idx);
                  const shortName = getShortInstrumentName(inst.name, inst.type);
                  return (
                    <div
                      key={inst.id}
                      className="p-3.5 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-xs text-text truncate" title={inst.name}>
                          {shortName}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border text-[11px]">
                        <div>
                          <div className="text-[10px] text-text-muted">Post-Tax</div>
                          <div className="font-semibold text-text tabular-nums">
                            {formatPercent(inst.postTaxReturnPct)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-text-muted">Real Return</div>
                          <div
                            className={`font-semibold tabular-nums ${
                              inst.realReturnPct >= 0 ? "text-primary" : "text-danger"
                            }`}
                          >
                            {formatPercent(inst.realReturnPct)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-text-muted">Lock-In</div>
                          <div className="font-semibold text-text tabular-nums">
                            {inst.lockInPeriodMonths > 0
                              ? `${Math.round(inst.lockInPeriodMonths / 12)}y`
                              : "None"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4 Tabs: Table | Charts | Warnings | Insurance Gap */}
              <div className="border-b border-border">
                <nav className="flex space-x-6 text-xs font-medium" aria-label="Comparison Views">
                  <button
                    type="button"
                    onClick={() => handleTabChange("table")}
                    className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                      activeTab === "table"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-text-muted hover:text-text"
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Metrics table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("charts")}
                    className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                      activeTab === "charts"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-text-muted hover:text-text"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Interactive charts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("warnings")}
                    className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                      activeTab === "warnings"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-text-muted hover:text-text"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      Hidden trade-offs{" "}
                      {compareData.tradeoffs?.length > 0 && `(${compareData.tradeoffs.length})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("insurance-gap")}
                    className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                      activeTab === "insurance-gap"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-text-muted hover:text-text"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Insurance adequacy</span>
                  </button>
                </nav>
              </div>

              {/* Tab 1: Metrics Table */}
              {activeTab === "table" && (
                <div className="space-y-4">
                  <MetricsTable instruments={compareData.instruments} profile={debouncedProfile} />
                </div>
              )}

              {/* Tab 2: Interactive Charts with Segmented Switcher */}
              {activeTab === "charts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex p-1 rounded-lg bg-surface-muted border border-border text-xs">
                      {[
                        { id: "growth", label: "Corpus growth" },
                        { id: "scatter", label: "Risk vs return" },
                        { id: "radar", label: "Multi-factor radar" },
                        { id: "exit", label: "Exit penalties" },
                      ].map((view) => (
                        <button
                          key={view.id}
                          type="button"
                          onClick={() => setActiveChartView(view.id as ChartView)}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            activeChartView === view.id
                              ? "bg-surface font-semibold text-primary shadow-sm"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm">
                    {activeChartView === "growth" && (
                      <ProjectionChart
                        instruments={compareData.instruments}
                        profile={debouncedProfile}
                      />
                    )}
                    {activeChartView === "scatter" && (
                      <RiskReturnScatter instruments={compareData.instruments} />
                    )}
                    {activeChartView === "radar" && (
                      <InstrumentRadar instruments={compareData.instruments} />
                    )}
                    {activeChartView === "exit" && (
                      <ExitCostChart
                        instruments={compareData.instruments}
                        profile={debouncedProfile}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Hidden Trade-offs */}
              {activeTab === "warnings" && (
                <div className="space-y-4">
                  <TradeoffCards flags={compareData.tradeoffs} />
                </div>
              )}

              {/* Tab 4: Insurance Adequacy */}
              {activeTab === "insurance-gap" && (
                <div className="space-y-4">
                  <InsuranceAdequacyPanel adequacy={compareData.insuranceAdequacy} />
                </div>
              )}

              {/* Compact Share & Export Bar */}
              <div className="pt-2">
                <ShareExportBar
                  profile={debouncedProfile}
                  instruments={compareData.instruments}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-text-muted">
          Loading comparator...
        </div>
      }
    >
      <CompareContent />
    </React.Suspense>
  );
}
