"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, ArrowRight } from "lucide-react";
import { SelectedInstrumentConfig } from "./instrument-selector";

const STORAGE_KEY = "niveshlens_staged_compare";

export function getStagedInstruments(): SelectedInstrumentConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function stageInstrumentForCompare(item: SelectedInstrumentConfig) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStagedInstruments();
    const filtered = existing.filter((i) => i.id !== item.id);
    if (filtered.length >= 4) {
      filtered.shift(); // keep max 4
    }
    filtered.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("compare-staged-updated"));
  } catch (e) {
    console.warn("Could not stage instrument", e);
  }
}

export function clearStagedInstruments() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("compare-staged-updated"));
  } catch (e) {
    console.warn("Could not clear staged instruments", e);
  }
}

export function FloatingComparePill() {
  const pathname = usePathname();
  const [stagedCount, setStagedCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setStagedCount(getStagedInstruments().length);
    };
    updateCount();
    window.addEventListener("compare-staged-updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("compare-staged-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  if (stagedCount === 0 || pathname === "/compare") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Link
        href="/compare"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-xs font-semibold shadow-lg hover:bg-primary-hover hover:shadow-xl transition-all"
      >
        <Scale className="w-3.5 h-3.5" />
        <span>Compare ({stagedCount})</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
