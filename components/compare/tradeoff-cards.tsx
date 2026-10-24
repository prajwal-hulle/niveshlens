"use client";

import React, { useState } from "react";
import { TradeoffFlag } from "@/lib/finance/types";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

interface TradeoffCardsProps {
  flags: TradeoffFlag[];
}

export function TradeoffCards({ flags }: TradeoffCardsProps) {
  const [showAll, setShowAll] = useState(false);
  const [openDetailIds, setOpenDetailIds] = useState<Record<string, boolean>>({});

  const toggleDetail = (id: string) => {
    setOpenDetailIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!flags || flags.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
        No high-risk trade-off flags detected for your chosen instruments and profile.
      </div>
    );
  }

  // Group / sort flags by severity: critical -> warn -> info
  const sortedFlags = [...flags].sort((a, b) => {
    const priority = { critical: 0, warn: 1, info: 2 };
    return priority[a.severity] - priority[b.severity];
  });

  const visibleFlags = showAll ? sortedFlags : sortedFlags.slice(0, 3);
  const remainingCount = sortedFlags.length - 3;

  const severityConfig = {
    critical: {
      badgeBg: "bg-danger/10 text-danger border-danger/20",
      icon: AlertCircle,
      iconColor: "text-danger",
      label: "Critical",
    },
    warn: {
      badgeBg: "bg-warning/10 text-warning border-warning/20",
      icon: AlertTriangle,
      iconColor: "text-warning",
      label: "Warning",
    },
    info: {
      badgeBg: "bg-primary/10 text-primary border-primary/20",
      icon: Info,
      iconColor: "text-primary",
      label: "Note",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-base text-text">
            Trade-offs and warnings
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {flags.length} audit {flags.length === 1 ? "flag" : "flags"}
        </span>
      </div>

      <div className="space-y-3">
        {visibleFlags.map((flag) => {
          const cfg = severityConfig[flag.severity] || severityConfig.info;
          const Icon = cfg.icon;
          const isDetailOpen = !!openDetailIds[flag.id];

          return (
            <div
              key={flag.id}
              className="rounded-xl border border-border bg-surface p-4 text-xs transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${cfg.badgeBg}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-medium text-text-muted">
                        {flag.instrumentName}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-text">
                      {flag.title}
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {flag.evidence}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDetail(flag.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text transition-colors shrink-0 pt-0.5"
                >
                  <span>Why this matters</span>
                  {isDetailOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isDetailOpen && (
                <div className="pt-2.5 border-t border-border text-xs text-text-muted space-y-2 animate-in fade-in duration-150">
                  <p className="leading-relaxed text-text">
                    {flag.whyItMatters}
                  </p>
                  <div className="text-[11px] text-text-muted/80">
                    Source: <span className="font-mono">{flag.source}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {remainingCount > 0 && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-medium text-text transition-colors"
          >
            {showAll ? "Show less" : `Show all (${flags.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
