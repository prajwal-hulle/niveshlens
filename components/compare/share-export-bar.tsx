"use client";

import React, { useState } from "react";
import { Share2, Download, Printer, Check, Copy } from "lucide-react";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";

interface ShareExportBarProps {
  instruments: InstrumentMetrics[];
  profile: UserProfile;
}

export function ShareExportBar({ instruments, profile }: ShareExportBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = [
      "Instrument Name",
      "Asset Type",
      "Category",
      "Nominal Return (%)",
      "Post-Tax Return (%)",
      "Fisher Real Return (%)",
      "Effective IRR (%)",
      "Volatility (%)",
      "Max Drawdown (%)",
      "Lock-in (Months)",
      "Composite Score (out of 100)",
      "Data Source",
    ];

    const rows = instruments.map((inst) => [
      `"${inst.name.replace(/"/g, '""')}"`,
      inst.type,
      `"${inst.category.replace(/"/g, '""')}"`,
      inst.nominalReturnPct,
      inst.postTaxReturnPct,
      inst.realReturnPct,
      inst.effectiveIrrPct,
      inst.volatilityPct,
      inst.maxDrawdownPct,
      inst.lockInPeriodMonths,
      inst.compositeScore,
      `"${inst.dataSource.name}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `niveshlens-comparison-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
        <span>Save & Share:</span>
        <span className="hidden sm:inline">Persisted URL state with zero client data loss</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-colors shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 dark:bg-slate-800 text-white hover:bg-navy-800 font-semibold transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / PDF</span>
        </button>
      </div>
    </div>
  );
}
