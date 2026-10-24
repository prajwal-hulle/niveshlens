"use client";

import React, { useState } from "react";
import { TradeoffFlag } from "@/lib/finance/types";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

interface TradeoffCardsProps {
  flags: TradeoffFlag[];
}

export function TradeoffCards({ flags }: TradeoffCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(flags[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (flags.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
        No high-risk trade-off flags detected for your chosen instruments and risk profile.
      </div>
    );
  }

  const severityStyles = {
    critical: {
      bg: "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60",
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      icon: AlertCircle,
      iconColor: "text-rose-500",
      label: "Critical Trade-off",
    },
    warn: {
      bg: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      label: "Warning Flag",
    },
    info: {
      bg: "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
      icon: Info,
      iconColor: "text-blue-500",
      label: "Structural Caveat",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Hidden Trade-Off Detector
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {flags.length} Automated Audit Flags
        </span>
      </div>

      <div className="space-y-3">
        {flags.map((flag) => {
          const style = severityStyles[flag.severity];
          const Icon = style.icon;
          const isExpanded = expandedId === flag.id;

          return (
            <div
              key={flag.id}
              className={`rounded-2xl border transition-all ${style.bg} overflow-hidden shadow-sm`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(flag.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        • {flag.instrumentName}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {flag.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {flag.evidence}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expander: Why This Matters & Traceable Source */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Why this matters for your wealth:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {flag.whyItMatters}
                    </p>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800/40">
                    <span>Evidence Basis:</span>
                    <span className="font-mono">{flag.source}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
