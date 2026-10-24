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
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border text-xs transition-colors">
      <div className="flex items-center gap-2 text-text font-medium">
        <Share2 className="w-4 h-4 text-primary" />
        <span>Share this comparison</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Link copied" : "Copy link"}</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text font-medium transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
