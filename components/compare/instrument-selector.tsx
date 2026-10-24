"use client";

import React, { useState } from "react";
import { Plus, X, Search, Shield, Building, Landmark, TrendingUp } from "lucide-react";
import { AssetType } from "@/lib/finance/types";

export interface SelectedInstrumentConfig {
  id: string;
  type: AssetType;
  bankId?: string;
  schemeCode?: number;
  schemeName?: string;
  planId?: string;
  annualPremium?: number;
  sumAssured?: number;
  policyTerm?: number;
  premiumPayingTerm?: number;
}

interface InstrumentSelectorProps {
  selected: SelectedInstrumentConfig[];
  onChange: (updated: SelectedInstrumentConfig[]) => void;
  availableBanks: any[];
  availableInsurancePlans: any[];
}

export function InstrumentSelector({
  selected,
  onChange,
  availableBanks,
  availableInsurancePlans,
}: InstrumentSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AssetType>("FD");

  // Sub-selector states
  const [selectedBankId, setSelectedBankId] = useState(availableBanks[0]?.id || "sbi-1y");
  const [mfSearchQuery, setMfSearchQuery] = useState("");
  const [mfSearchResults, setMfSearchResults] = useState<any[]>([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);

  // LIC sub-selector states (User enters premium, SA, term, PPT per correction #5)
  const [selectedPlanId, setSelectedPlanId] = useState(availableInsurancePlans[0]?.planId || "lic-jeevan-labh-936");
  const [licAnnualPremium, setLicAnnualPremium] = useState(85600);
  const [licSumAssured, setLicSumAssured] = useState(1000000);
  const [licTerm, setLicTerm] = useState(16);
  const [licPpt, setLicPpt] = useState(10);

  const handleSearchMf = async (q: string) => {
    setMfSearchQuery(q);
    if (q.trim().length < 2) {
      setMfSearchResults([]);
      return;
    }
    setIsSearchingMf(true);
    try {
      const res = await fetch(`/api/mf/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMfSearchResults(data.results || []);
      }
    } catch {
      //
    } finally {
      setIsSearchingMf(false);
    }
  };

  const handleAddInstrument = (config: SelectedInstrumentConfig) => {
    if (selected.length >= 4) return;
    onChange([...selected, config]);
    setModalOpen(false);
  };

  const handleRemove = (id: string) => {
    if (selected.length <= 1) return; // Keep at least one
    onChange(selected.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {selected.map((item) => {
          let label: string = item.type;
          let icon = Landmark;
          if (item.type === "FD") {
            const bank = availableBanks.find((b) => b.id === item.bankId);
            label = bank ? `${bank.bankName} (${bank.tenureBucket})` : "Fixed Deposit";
            icon = Building;
          } else if (item.type === "PPF") {
            label = "PPF (Public Provident Fund)";
            icon = Shield;
          } else if (item.type === "MF") {
            label = item.schemeName || `Mutual Fund #${item.schemeCode}`;
            icon = TrendingUp;
          } else if (item.type === "LIC") {
            const plan = availableInsurancePlans.find((p) => p.planId === item.planId);
            label = plan ? plan.planName : "LIC Policy";
            icon = Shield;
          }

          const Icon = icon;

          return (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[240px]">{label}</span>
              {selected.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Remove instrument"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {selected.length < 4 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Instrument ({selected.length}/4)</span>
          </button>
        )}
      </div>

      {/* Add Instrument Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base">
                Select Comparison Instrument
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-4 gap-1 p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              {(["FD", "PPF", "MF", "LIC"] as AssetType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedType === type
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
              {/* FD Selector */}
              {selectedType === "FD" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Choose Bank & Tenure Bucket
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {availableBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} – {b.tenureBucket} ({b.generalRatePct}% / Sr: {b.seniorRatePct}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddInstrument({
                        id: `fd-${selectedBankId}-${Date.now()}`,
                        type: "FD",
                        bankId: selectedBankId,
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    Add Fixed Deposit to Comparison
                  </button>
                </div>
              )}

              {/* PPF Selector */}
              {selectedType === "PPF" && (
                <div className="space-y-4 text-center py-4">
                  <Shield className="w-12 h-12 text-emerald-500 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Public Provident Fund (PPF)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sovereign central government backed. 15-year statutory lock-in, quarterly notified interest, EEE tax status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddInstrument({
                        id: `ppf-${Date.now()}`,
                        type: "PPF",
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    Add PPF to Comparison
                  </button>
                </div>
              )}

              {/* MF Search Selector */}
              {selectedType === "MF" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Search Mutual Fund Scheme (via live api.mfapi.in)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={mfSearchQuery}
                        onChange={(e) => handleSearchMf(e.target.value)}
                        placeholder="Type scheme name (e.g. Parag Parikh, HDFC)..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {isSearchingMf && (
                      <div className="p-3 text-center text-xs text-slate-400">Searching schemes...</div>
                    )}
                    {mfSearchResults.map((m) => (
                      <button
                        key={m.schemeCode}
                        type="button"
                        onClick={() =>
                          handleAddInstrument({
                            id: `mf-${m.schemeCode}-${Date.now()}`,
                            type: "MF",
                            schemeCode: m.schemeCode,
                            schemeName: m.schemeName,
                          })
                        }
                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{m.schemeName}</div>
                          <span className="text-[10px] text-slate-400">{m.planType}</span>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
                      </button>
                    ))}
                    {!isSearchingMf && mfSearchResults.length === 0 && (
                      <div className="p-2 text-center text-[11px] text-slate-400">
                        Search and click any scheme to add.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LIC Plan Selector (Per correction #5: user enters premium, SA, term, PPT) */}
              {selectedType === "LIC" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select LIC Plan
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {availableInsurancePlans.map((p) => (
                        <option key={p.planId} value={p.planId}>
                          {p.planName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Annual Premium (₹)
                      </label>
                      <input
                        type="number"
                        step={5000}
                        value={licAnnualPremium}
                        onChange={(e) => setLicAnnualPremium(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Sum Assured (₹)
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={licSumAssured}
                        onChange={(e) => setLicSumAssured(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Policy Term (Yrs)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={35}
                        value={licTerm}
                        onChange={(e) => setLicTerm(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Premium Paying Term
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={licTerm}
                        value={licPpt}
                        onChange={(e) => setLicPpt(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    Per brochure rules: Bonus history & surrender factors fetched from DB. Effective IRR computed strictly from your entered cash flows.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddInstrument({
                        id: `lic-${selectedPlanId}-${Date.now()}`,
                        type: "LIC",
                        planId: selectedPlanId,
                        annualPremium: licAnnualPremium,
                        sumAssured: licSumAssured,
                        policyTerm: licTerm,
                        premiumPayingTerm: licPpt,
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    Add LIC Policy to Comparison
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
