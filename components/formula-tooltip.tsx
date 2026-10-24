"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

interface FormulaTooltipProps {
  label: string;
  formula?: string;
  explanation: string;
  source?: string;
  sourceUrl?: string;
  children?: React.ReactNode;
}

export function FormulaTooltip({
  label,
  formula,
  explanation,
  source,
  sourceUrl,
  children,
}: FormulaTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      <span
        className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-slate-400 dark:border-slate-600"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
        aria-label={`Explanation for ${label}`}
      >
        {children || label}
        <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors inline" />
      </span>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>{label}</span>
          </div>

          <p className="text-slate-300 leading-relaxed">{explanation}</p>

          {formula && (
            <div className="bg-slate-950/80 p-2 rounded font-mono text-[11px] text-emerald-400 border border-slate-800 break-all">
              <span className="text-slate-400 block text-[10px] font-sans">Formula:</span>
              {formula}
            </div>
          )}

          {source && (
            <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800/80 flex items-center justify-between">
              <span>Source:</span>
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  {source}
                </a>
              ) : (
                <span className="text-slate-300">{source}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
