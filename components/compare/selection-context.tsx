"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AssetType } from "@/lib/finance/types";
import { X, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

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

interface SelectionContextType {
  selected: SelectedInstrumentConfig[];
  addInstrument: (inst: SelectedInstrumentConfig, navigateToCompare?: boolean) => void;
  removeInstrument: (id: string) => void;
  replaceInstrument: (oldId: string, newInst: SelectedInstrumentConfig, navigateToCompare?: boolean) => void;
  clearAll: () => void;
  isSelected: (type: AssetType, identifier?: string | number) => boolean;
  serializedParam: string;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

const STORAGE_KEY = "niveshlens_selected_i";

export function serializeInstruments(list: SelectedInstrumentConfig[]): string {
  return list
    .map((item) => {
      if (item.type === "FD") return `fd:${item.bankId || item.id.replace("fd-", "")}`;
      if (item.type === "PPF") return "ppf";
      if (item.type === "MF") return `mf:${item.schemeCode || item.id.replace("mf-", "")}`;
      if (item.type === "LIC") return `lic:${item.planId || item.id.replace("lic-", "")}`;
      return "";
    })
    .filter(Boolean)
    .join(",");
}

export function deserializeInstruments(queryStr: string): SelectedInstrumentConfig[] {
  if (!queryStr || queryStr.trim() === "") return [];

  const parts = queryStr.split(",").map((p) => p.trim()).filter(Boolean);
  const result: SelectedInstrumentConfig[] = [];

  for (const part of parts.slice(0, 4)) {
    if (part === "ppf") {
      result.push({ id: "ppf", type: "PPF" });
    } else if (part.startsWith("fd:")) {
      const bankId = part.replace("fd:", "");
      result.push({ id: `fd-${bankId}`, type: "FD", bankId });
    } else if (part.startsWith("mf:")) {
      const code = Number(part.replace("mf:", ""));
      result.push({ id: `mf-${code}`, type: "MF", schemeCode: code });
    } else if (part.startsWith("lic:")) {
      const planId = part.replace("lic:", "");
      result.push({
        id: `lic-${planId}`,
        type: "LIC",
        planId,
        annualPremium: 85600,
        sumAssured: 1000000,
        policyTerm: 16,
        premiumPayingTerm: 10,
      });
    }
  }

  return result;
}

export function CompareSelectionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState<SelectedInstrumentConfig[]>(() => {
    // Initial read from URL param 'i' if available
    if (typeof window !== "undefined") {
      const urlParam = new URLSearchParams(window.location.search).get("i");
      if (urlParam) {
        return deserializeInstruments(urlParam);
      }
      // Or fallback to sessionStorage
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return deserializeInstruments(stored);
      }
    }
    return [];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [pendingInstrument, setPendingInstrument] = useState<SelectedInstrumentConfig | null>(null);
  const [pendingNavigate, setPendingNavigate] = useState(false);

  // Sync to sessionStorage & URL param 'i' when selected changes
  useEffect(() => {
    const serialized = serializeInstruments(selected);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, serialized);

      if (pathname === "/compare") {
        const currentUrl = new URL(window.location.href);
        if (serialized) {
          currentUrl.searchParams.set("i", serialized);
        } else {
          currentUrl.searchParams.delete("i");
        }
        window.history.replaceState(null, "", currentUrl.toString());
      }
    }
  }, [selected, pathname]);

  // Sync from URL param if user lands on /compare?i=... or navigates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUrlSync = () => {
      const urlParam = new URLSearchParams(window.location.search).get("i");
      if (urlParam !== null) {
        const parsed = deserializeInstruments(urlParam);
        setSelected((prev) => {
          if (serializeInstruments(parsed) !== serializeInstruments(prev)) {
            return parsed;
          }
          return prev;
        });
      }
    };

    handleUrlSync();
    window.addEventListener("popstate", handleUrlSync);
    return () => window.removeEventListener("popstate", handleUrlSync);
  }, [pathname]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const getShortName = (item: SelectedInstrumentConfig) => {
    if (item.type === "PPF") return "PPF";
    if (item.type === "FD") return item.bankId || "Bank FD";
    if (item.type === "MF") return item.schemeName || `Fund #${item.schemeCode}`;
    if (item.type === "LIC") return item.planId || "LIC Policy";
    return item.type;
  };

  const isSelected = useCallback(
    (type: AssetType, identifier?: string | number) => {
      return selected.some((item) => {
        if (item.type !== type) return false;
        if (type === "PPF") return true;
        if (type === "FD") return !identifier || item.bankId === identifier;
        if (type === "MF") return !identifier || item.schemeCode === Number(identifier);
        if (type === "LIC") return !identifier || item.planId === identifier;
        return false;
      });
    },
    [selected]
  );

  const addInstrument = useCallback(
    (inst: SelectedInstrumentConfig, navigateToCompare: boolean = false) => {
      // Check if already present
      const alreadyPresent = selected.some((s) => {
        if (s.type !== inst.type) return false;
        if (s.type === "PPF") return true;
        if (s.type === "FD") return s.bankId === inst.bankId;
        if (s.type === "MF") return s.schemeCode === inst.schemeCode;
        if (s.type === "LIC") return s.planId === inst.planId;
        return false;
      });

      if (alreadyPresent) {
        if (navigateToCompare) {
          const serialized = serializeInstruments(selected);
          router.push(`/compare${serialized ? `?i=${serialized}` : ""}`);
        }
        return;
      }

      // If already at 4 items: prompt replacement
      if (selected.length >= 4) {
        setPendingInstrument(inst);
        setPendingNavigate(navigateToCompare);
        setReplaceModalOpen(true);
        return;
      }

      // Add item
      const updated = [...selected, inst];
      setSelected(updated);
      showToast(`Added ${getShortName(inst)}`);

      if (navigateToCompare) {
        const serialized = serializeInstruments(updated);
        router.push(`/compare${serialized ? `?i=${serialized}` : ""}`);
      }
    },
    [selected, router]
  );

  const removeInstrument = useCallback((id: string) => {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const replaceInstrument = useCallback(
    (oldId: string, newInst: SelectedInstrumentConfig, navigateToCompare: boolean = false) => {
      setSelected((prev) => {
        const updated = prev.map((item) => (item.id === oldId ? newInst : item));
        if (navigateToCompare) {
          const serialized = serializeInstruments(updated);
          router.push(`/compare${serialized ? `?i=${serialized}` : ""}`);
        }
        return updated;
      });
      setReplaceModalOpen(false);
      setPendingInstrument(null);
      showToast(`Added ${getShortName(newInst)}`);
    },
    [router]
  );

  const clearAll = useCallback(() => {
    setSelected([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
      if (pathname === "/compare") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("i");
        window.history.replaceState(null, "", currentUrl.toString());
      }
    }
  }, [pathname]);

  const serializedParam = serializeInstruments(selected);

  return (
    <SelectionContext.Provider
      value={{
        selected,
        addInstrument,
        removeInstrument,
        replaceInstrument,
        clearAll,
        isSelected,
        serializedParam,
      }}
    >
      {children}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-4 py-2 rounded-full bg-surface border border-border shadow-lg text-xs font-medium text-text flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 4-Item Replacement Modal */}
      {replaceModalOpen && pendingInstrument && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-border shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-semibold text-sm text-text">Limit reached</h3>
              </div>
              <button
                type="button"
                onClick={() => setReplaceModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              You can compare up to 4 instruments at once. Which one would you like to replace with{" "}
              <strong>{getShortName(pendingInstrument)}</strong>?
            </p>

            <div className="space-y-2">
              {selected.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface-muted text-xs"
                >
                  <span className="font-medium text-text truncate max-w-[180px]">
                    {getShortName(item)}
                  </span>
                  <button
                    type="button"
                    onClick={() => replaceInstrument(item.id, pendingInstrument, pendingNavigate)}
                    className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-medium transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setReplaceModalOpen(false)}
                className="w-full py-2 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </SelectionContext.Provider>
  );
}

export function useCompareSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useCompareSelection must be used within CompareSelectionProvider");
  }
  return context;
}
