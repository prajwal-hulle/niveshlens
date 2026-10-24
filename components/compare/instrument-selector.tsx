"use client";

import React, { useState } from "react";
import { Plus, X, Search, Shield, Building, Landmark, TrendingUp } from "lucide-react";
import { AssetType } from "@/lib/finance/types";
import { getInstrumentColor } from "@/lib/chart-colors";

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

  // LIC sub-selector states
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
        {selected.map((item, index) => {
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
          const dotColor = getInstrumentColor(index);

          return (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface shadow-sm text-xs font-medium text-text transition-colors"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[240px]">{label}</span>
              {selected.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-0.5 rounded hover:bg-surface-muted text-text-muted hover:text-text transition-colors"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary/50 hover:border-primary bg-primary/5 text-primary text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add instrument ({selected.length}/4)</span>
          </button>
        )}
      </div>

      {/* Add Instrument Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text text-base">
                Select comparison instrument
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-surface-muted border-b border-border">
              {(["FD", "PPF", "MF", "LIC"] as AssetType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedType === type
                      ? "bg-surface text-primary shadow-sm"
                      : "text-text-muted hover:text-text"
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
                    <label className="block text-xs font-medium text-text mb-1">
                      Choose bank &amp; tenure
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
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
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                  >
                    Add Fixed Deposit
                  </button>
                </div>
              )}

              {/* PPF Selector */}
              {selectedType === "PPF" && (
                <div className="space-y-4 text-center py-4">
                  <Shield className="w-10 h-10 text-primary mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-text">
                      Public Provident Fund (PPF)
                    </h4>
                    <p className="text-xs text-text-muted">
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
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                  >
                    Add PPF
                  </button>
                </div>
              )}

              {/* MF Search Selector */}
              {selectedType === "MF" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">
                      Search Mutual Fund Scheme
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={mfSearchQuery}
                        onChange={(e) => handleSearchMf(e.target.value)}
                        placeholder="Type scheme name (e.g. Parag Parikh, HDFC)..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {isSearchingMf && (
                      <div className="p-3 text-center text-xs text-text-muted">Searching schemes...</div>
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
                        className="w-full text-left p-2.5 rounded-lg hover:bg-surface-muted text-xs transition-colors flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-text truncate">{m.schemeName}</div>
                          <span className="text-[10px] text-text-muted">{m.planType}</span>
                        </div>
                        <Plus className="w-4 h-4 text-primary shrink-0" />
                      </button>
                    ))}
                    {!isSearchingMf && mfSearchResults.length === 0 && (
                      <div className="p-2 text-center text-[11px] text-text-muted">
                        Search and click any scheme to add.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LIC Plan Selector */}
              {selectedType === "LIC" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">
                      Select LIC Plan
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs focus:ring-1 focus:ring-primary focus:outline-none"
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
                      <label className="block text-[11px] font-medium text-text-muted mb-1">
                        Annual Premium (₹)
                      </label>
                      <input
                        type="number"
                        step={5000}
                        value={licAnnualPremium}
                        onChange={(e) => setLicAnnualPremium(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-muted mb-1">
                        Sum Assured (₹)
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={licSumAssured}
                        onChange={(e) => setLicSumAssured(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-muted mb-1">
                        Policy Term (Yrs)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={35}
                        value={licTerm}
                        onChange={(e) => setLicTerm(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-muted mb-1">
                        Premium Paying Term
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={licTerm}
                        value={licPpt}
                        onChange={(e) => setLicPpt(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted italic">
                    Per brochure rules: Bonus history &amp; surrender factors fetched from DB. Effective IRR computed strictly from your entered cash flows.
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
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                  >
                    Add LIC Policy
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
