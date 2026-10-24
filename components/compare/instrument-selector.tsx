"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, X, Search, Shield, Building, Landmark, TrendingUp, Trash2 } from "lucide-react";
import { AssetType } from "@/lib/finance/types";
import { getInstrumentColor, getShortInstrumentName } from "@/lib/chart-colors";

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
  onAdd: (config: SelectedInstrumentConfig) => void;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  availableBanks: any[];
  availableInsurancePlans: any[];
  modalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
}

export function InstrumentSelector({
  selected,
  onAdd,
  onRemove,
  onClearAll,
  availableBanks,
  availableInsurancePlans,
  modalOpen: externalModalOpen,
  onModalOpenChange,
}: InstrumentSelectorProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const modalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setModalOpen = (open: boolean) => {
    if (onModalOpenChange) onModalOpenChange(open);
    setInternalModalOpen(open);
  };

  const [selectedType, setSelectedType] = useState<AssetType>("FD");

  // FD Tab State
  const [fdSearchQuery, setFdSearchQuery] = useState("");
  const [fdTenureFilter, setFdTenureFilter] = useState("ALL");

  // MF Tab State
  const [mfSearchQuery, setMfSearchQuery] = useState("");
  const [mfCategoryFilter, setMfCategoryFilter] = useState("all");
  const [mfSearchResults, setMfSearchResults] = useState<any[]>([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);

  // LIC Tab State
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

  // Update insurance selection when availableInsurancePlans loads
  useEffect(() => {
    if (availableInsurancePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(availableInsurancePlans[0].planId);
    }
  }, [availableInsurancePlans, selectedPlanId]);

  // Filter and group FDs by Bank
  const filteredFdGroups = useMemo(() => {
    const query = fdSearchQuery.toLowerCase().trim();
    const matching = availableBanks.filter((b) => {
      const matchSearch =
        !query ||
        b.bankName.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query);

      let matchTenure = true;
      if (fdTenureFilter === "1Y") {
        matchTenure = b.tenureBucket.includes("1") && !b.tenureBucket.includes("2") && !b.tenureBucket.includes("5");
      } else if (fdTenureFilter === "2-3Y") {
        matchTenure = b.tenureBucket.includes("2") || b.tenureBucket.includes("3");
      } else if (fdTenureFilter === "5Y") {
        matchTenure = b.tenureBucket.includes("5") || b.tenureBucket.toLowerCase().includes("tax");
      }

      return matchSearch && matchTenure;
    });

    // Group by bank name
    const groups: Record<string, any[]> = {};
    for (const b of matching) {
      if (!groups[b.bankName]) groups[b.bankName] = [];
      groups[b.bankName].push(b);
    }
    return groups;
  }, [availableBanks, fdSearchQuery, fdTenureFilter]);

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

  const handleAddAndClose = (config: SelectedInstrumentConfig) => {
    onAdd(config);
    setModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected Instrument Chips & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((item, index) => {
            let label: string = item.type;
            let icon = Landmark;
            if (item.type === "FD") {
              const bank = availableBanks.find((b) => b.id === item.bankId);
              label = bank ? `${bank.bankName} (${bank.tenureBucket})` : item.bankId || "Bank FD";
              icon = Building;
            } else if (item.type === "PPF") {
              label = "PPF";
              icon = Shield;
            } else if (item.type === "MF") {
              label = item.schemeName || `Fund #${item.schemeCode}`;
              icon = TrendingUp;
            } else if (item.type === "LIC") {
              const plan = availableInsurancePlans.find((p) => p.planId === item.planId);
              label = plan ? plan.planName : item.planId || "LIC Policy";
              icon = Shield;
            }

            const shortLabel = getShortInstrumentName(label, item.type);
            const IconComponent = icon;
            const color = getInstrumentColor(index);

            return (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text shadow-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <IconComponent className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="truncate max-w-[200px]" title={label}>
                  {shortLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-text-muted hover:text-danger p-0.5 rounded transition-colors ml-1 shrink-0"
                  aria-label={`Remove ${shortLabel}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* + Add Button (up to 4) */}
          {selected.length < 4 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>+ Add ({selected.length}/4)</span>
            </button>
          )}
        </div>

        {/* Clear all link */}
        {selected.length > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-danger transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear all</span>
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
            className="w-full max-w-xl rounded-2xl bg-surface border border-border shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-text">Select instrument to compare</h3>
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

            {/* 4 Tabs: FD default */}
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
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* FD Tab: Grouped by bank with tenure filter and search */}
              {selectedType === "FD" && (
                <div className="space-y-3">
                  {/* Search and Tenure Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={fdSearchQuery}
                        onChange={(e) => setFdSearchQuery(e.target.value)}
                        placeholder="Search bank name (e.g. SBI, HDFC, ICICI, PNB)..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-text-muted mr-1">Tenure:</span>
                      {[
                        { label: "All tenures", val: "ALL" },
                        { label: "1 Year", val: "1Y" },
                        { label: "2–3 Years", val: "2-3Y" },
                        { label: "5 Years (Tax Saver)", val: "5Y" },
                      ].map((chip) => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setFdTenureFilter(chip.val)}
                          className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                            fdTenureFilter === chip.val
                              ? "bg-primary text-white border-primary"
                              : "bg-surface border-border text-text-muted hover:text-text"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank Groups */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {Object.keys(filteredFdGroups).length === 0 && (
                      <div className="p-6 text-center text-xs text-text-muted">
                        No banks match your filters. Try clearing the search.
                      </div>
                    )}

                    {Object.entries(filteredFdGroups).map(([bankName, buckets]) => (
                      <div
                        key={bankName}
                        className="p-3 rounded-xl border border-border bg-surface-muted/50 space-y-2"
                      >
                        <div className="font-semibold text-xs text-text flex items-center justify-between">
                          <span>{bankName}</span>
                          <span className="text-[10px] text-text-muted font-normal">
                            {buckets[0]?.category === "SMALL_FINANCE"
                              ? "Small finance bank"
                              : buckets[0]?.category === "PUBLIC"
                              ? "Public sector bank"
                              : "Private sector bank"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {buckets.map((b) => (
                            <div
                              key={b.id}
                              className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-medium text-text">{b.tenureBucket}</div>
                                <div className="text-[11px] text-primary font-semibold">
                                  {b.generalRatePct}% p.a.
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddAndClose({
                                    id: `fd-${b.id}-${Date.now()}`,
                                    type: "FD",
                                    bankId: b.id,
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-medium transition-colors"
                              >
                                Select
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPF Tab */}
              {selectedType === "PPF" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-2 text-xs text-text">
                    <div className="font-semibold text-primary text-sm">Public Provident Fund (PPF)</div>
                    <p className="text-text-muted leading-relaxed">
                      Sovereign central government backed with zero default risk. Current notified rate is <strong>7.10% p.a.</strong> with full EEE tax exemption under Section 80C.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border">
                      <div>
                        <span className="text-text-muted">Lock-in:</span> 15 Years
                      </div>
                      <div>
                        <span className="text-text-muted">Annual limit:</span> ₹1.5 Lakhs
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddAndClose({
                        id: `ppf-${Date.now()}`,
                        type: "PPF",
                      })
                    }
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                  >
                    Add PPF to comparison
                  </button>
                </div>
              )}

              {/* Mutual Fund Tab: Live search */}
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
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-text-muted text-[10px] mr-1">Quick:</span>
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
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {isSearchingMf && (
                      <div className="p-4 text-center text-xs text-text-muted">
                        Searching AMFI database...
                      </div>
                    )}
                    {mfSearchResults.map((m) => (
                      <div
                        key={m.schemeCode}
                        className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between text-xs hover:border-primary/50 transition-colors"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-text truncate">{m.schemeName}</div>
                          <span className="text-[10px] text-text-muted">{m.planType}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddAndClose({
                              id: `mf-${m.schemeCode}-${Date.now()}`,
                              type: "MF",
                              schemeCode: m.schemeCode,
                              schemeName: m.schemeName,
                            })
                          }
                          className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-medium shrink-0 transition-colors"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                    {!isSearchingMf && mfSearchResults.length === 0 && (
                      <div className="p-4 text-center text-[11px] text-text-muted">
                        Type a fund name above or click a filter pill to view schemes.
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
                      <label className="block text-[11px] text-text-muted">Annual Premium (₹)</label>
                      <input
                        type="number"
                        step={5000}
                        value={licAnnualPremium}
                        onChange={(e) => setLicAnnualPremium(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">Sum Assured (₹)</label>
                      <input
                        type="number"
                        step={50000}
                        value={licSumAssured}
                        onChange={(e) => setLicSumAssured(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-text-muted">Policy Term (Yrs)</label>
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
                      <label className="block text-[11px] text-text-muted">Premium Term (Yrs)</label>
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

                  <button
                    type="button"
                    onClick={() =>
                      handleAddAndClose({
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
                    Add LIC Policy to comparison
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
