"use client";

import React, { useState, useEffect, useRef } from "react";
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
  onSelectPreset?: (presetName: string) => void;
  initialOpenTab?: AssetType;
}

export function InstrumentSelector({
  selected,
  onChange,
  availableBanks,
  availableInsurancePlans,
  onSelectPreset,
}: InstrumentSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AssetType>("FD");

  // FD sub-selector
  const [selectedBankId, setSelectedBankId] = useState(availableBanks[0]?.id || "sbi-1y");

  // MF sub-selector
  const [mfSearchQuery, setMfSearchQuery] = useState("");
  const [mfCategoryFilter, setMfCategoryFilter] = useState("all");
  const [mfSearchResults, setMfSearchResults] = useState<any[]>([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);

  // LIC sub-selector
  const [selectedPlanId, setSelectedPlanId] = useState(
    availableInsurancePlans[0]?.planId || "lic-jeevan-labh-936"
  );
  const [licAnnualPremium, setLicAnnualPremium] = useState(85600);
  const [licSumAssured, setLicSumAssured] = useState(1000000);
  const [licTerm, setLicTerm] = useState(16);
  const [licPpt, setLicPpt] = useState(10);

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Update bank selection when availableBanks loads
  useEffect(() => {
    if (availableBanks.length > 0 && !selectedBankId) {
      setSelectedBankId(availableBanks[0].id);
    }
  }, [availableBanks, selectedBankId]);

  // Update insurance selection when availableInsurancePlans loads
  useEffect(() => {
    if (availableInsurancePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(availableInsurancePlans[0].planId);
    }
  }, [availableInsurancePlans, selectedPlanId]);

  const handleSearchMf = async (q: string, category: string = mfCategoryFilter) => {
    setMfSearchQuery(q);
    const searchTerm = category !== "all" && !q ? category : q;
    if (!searchTerm || searchTerm.trim().length < 2) {
      setMfSearchResults([]);
      return;
    }
    setIsSearchingMf(true);
    try {
      const res = await fetch(`/api/mf/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        let results = data.results || [];
        if (category !== "all" && q) {
          results = results.filter((r: any) =>
            r.schemeName.toLowerCase().includes(category.toLowerCase())
          );
        }
        setMfSearchResults(results);
      }
    } catch {
      //
    } finally {
      setIsSearchingMf(false);
    }
  };

  const handleCategoryPillClick = (cat: string) => {
    setMfCategoryFilter(cat);
    handleSearchMf(mfSearchQuery, cat);
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
      {/* If 0 instruments selected: 3 suggested presets */}
      {selected.length === 0 && onSelectPreset && (
        <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-2 text-center sm:text-left">
          <p className="text-xs font-medium text-text">
            No instruments selected. Load a suggested preset to get started:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectPreset("tax-saving")}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors"
            >
              Tax saving (PPF + 5Y FD + ELSS)
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("growth")}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors"
            >
              Growth (Equity MF + PPF)
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("emergency")}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:border-primary transition-colors"
            >
              Emergency fund (Bank FD + PPF)
            </button>
          </div>
        </div>
      )}

      {/* Selected Instrument Chips & Single + Add Button */}
      <div className="flex flex-wrap items-center gap-2">
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

          const IconComponent = icon;
          const color = getInstrumentColor(index);

          return (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text shadow-sm max-w-[280px]"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <IconComponent className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="truncate" title={label}>
                {label}
              </span>
              {selected.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-text-muted hover:text-danger p-0.5 rounded transition-colors ml-auto shrink-0"
                  aria-label={`Remove ${label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Single + Add Button (Max 4 selected) */}
        {selected.length < 4 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add instrument ({selected.length}/4)</span>
          </button>
        )}
      </div>

      {/* Modal Dialog for Adding Instrument */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-text">Add to comparison</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Tabs */}
            <div className="grid grid-cols-4 border-b border-border bg-surface-muted text-xs font-medium">
              {(["FD", "PPF", "MF", "LIC"] as AssetType[]).map((type) => {
                const isActive = selectedType === type;
                const tabNames: Record<AssetType, string> = {
                  FD: "Fixed Deposit",
                  PPF: "PPF",
                  MF: "Mutual Fund",
                  LIC: "LIC Policy",
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`py-2.5 text-center transition-colors border-b-2 ${
                      isActive
                        ? "border-primary text-primary font-semibold bg-surface"
                        : "border-transparent text-text-muted hover:text-text"
                    }`}
                  >
                    {tabNames[type]}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* FD Tab */}
              {selectedType === "FD" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-text">
                      Select Bank &amp; Tenure Bucket
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} – {b.tenureBucket} ({b.generalRatePct}% p.a.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-text-muted">
                    DICGC protects principal + interest up to ₹5 Lakhs per bank. TDS applies if interest exceeds ₹50,000/year (₹1 Lakh for seniors).
                  </p>

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

              {/* PPF Tab */}
              {selectedType === "PPF" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-surface-muted border border-border space-y-1.5 text-xs text-text">
                    <div className="font-semibold text-primary">Public Provident Fund (PPF)</div>
                    <p className="text-text-muted">
                      Current Notified Rate: <strong>7.10% p.a.</strong> (Quarterly MoF Gazette)
                    </p>
                    <p className="text-text-muted">
                      Statutory Lock-in: 15 Years | Max Deposit: ₹1,50,000/year
                    </p>
                    <p className="text-text-muted">
                      Tax Status: EEE (Exempt on deposit, interest, and maturity)
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

              {/* Mutual Fund Tab */}
              {selectedType === "MF" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-text">
                      Search Mutual Fund Scheme
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={mfSearchQuery}
                        onChange={(e) => handleSearchMf(e.target.value)}
                        placeholder="Search fund name (e.g. Parag Parikh, Nifty 50, ELSS)..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Quick Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-text-muted text-[10px] mr-1">Filter:</span>
                    {[
                      { label: "All", val: "all" },
                      { label: "ELSS (Tax Saver)", val: "ELSS" },
                      { label: "Flexi Cap", val: "Flexi" },
                      { label: "Large Cap", val: "Large" },
                      { label: "Nifty 50", val: "Nifty" },
                    ].map((pill) => (
                      <button
                        key={pill.val}
                        type="button"
                        onClick={() => handleCategoryPillClick(pill.val)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] transition-colors ${
                          mfCategoryFilter === pill.val
                            ? "bg-primary text-white border-primary"
                            : "bg-surface border-border text-text-muted hover:text-text"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Results List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {isSearchingMf && (
                      <div className="p-3 text-center text-xs text-text-muted">
                        Searching AMFI schemes...
                      </div>
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
                        className="w-full text-left p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-surface-muted text-xs transition-colors flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-text truncate">{m.schemeName}</div>
                          <span className="text-[10px] text-text-muted">{m.planType}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                      </button>
                    ))}
                    {!isSearchingMf && mfSearchResults.length === 0 && (
                      <div className="p-3 text-center text-[11px] text-text-muted">
                        Type a fund name above or select a filter pill to view schemes.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LIC Tab */}
              {selectedType === "LIC" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-text">
                      Select LIC Plan
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableInsurancePlans.map((p) => (
                        <option key={p.planId} value={p.planId}>
                          {p.planName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">
                        Annual Premium (₹)
                      </label>
                      <input
                        type="number"
                        step={5000}
                        value={licAnnualPremium}
                        onChange={(e) => setLicAnnualPremium(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">
                        Sum Assured (₹)
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={licSumAssured}
                        onChange={(e) => setLicSumAssured(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">
                        Policy Term (Yrs)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={35}
                        value={licTerm}
                        onChange={(e) => setLicTerm(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">
                        Premium Term (Yrs)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={licTerm}
                        value={licPpt}
                        onChange={(e) => setLicPpt(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted">
                    Bonus rules &amp; surrender values fetched from DB. Effective IRR computed strictly from your entered cash flows.
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
