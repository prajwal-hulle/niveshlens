import React from "react";
import { getFreshnessStatus, FreshnessStatus } from "@/lib/utils";
import { ExternalLink, CheckCircle2, Clock, AlertTriangle, HelpCircle } from "lucide-react";

interface FreshnessBadgeProps {
  sourceName?: string;
  sourceUrl?: string;
  lastUpdated?: string | null;
  isSeed?: boolean;
  className?: string;
  compact?: boolean;
}

export function FreshnessBadge({
  sourceName = "Verified Source",
  sourceUrl,
  lastUpdated,
  isSeed = false,
  className = "",
  compact = false,
}: FreshnessBadgeProps) {
  const { status, label } = getFreshnessStatus(lastUpdated, isSeed, sourceUrl);

  // Clean raw developer strings
  const cleanSourceName = sourceName
    .replace(/\s*\(Open Source[^)]*\)/gi, "")
    .replace(/^api\.mfapi\.in.*$/gi, "AMFI / Verified NAV")
    .trim();

  const cleanLabel = label.replace(/\(invalid date\)/gi, "").trim();

  const badgeStyles: Record<FreshnessStatus, { bg: string; text: string; icon: any }> = {
    fresh: {
      bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      text: "Fresh",
      icon: CheckCircle2,
    },
    stale: {
      bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      text: "Stale",
      icon: Clock,
    },
    seed: {
      bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      text: "Needs verification",
      icon: AlertTriangle,
    },
    needs_verification: {
      bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      text: "Needs verification",
      icon: AlertTriangle,
    },
    unknown: {
      bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
      text: "Verified",
      icon: HelpCircle,
    },
  };

  const style = badgeStyles[status] || badgeStyles.unknown;
  const Icon = style.icon;

  if (compact) {
    return (
      <span
        title={`Source: ${cleanSourceName} (${cleanLabel})`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${className}`}
      >
        <Icon className="w-3 h-3" />
        {style.text}
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${style.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {cleanLabel}
      </span>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors underline-offset-2 hover:underline"
        >
          <span>{cleanSourceName}</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      ) : (
        <span className="text-slate-400">{cleanSourceName}</span>
      )}
    </div>
  );
}
