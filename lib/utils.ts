import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Currency (INR)
 * Standard: ₹ 12,34,567
 * Compact option: ₹ 1.25 Cr, ₹ 15.4 L
 */
export function formatINR(
  amount: number | null | undefined,
  options: {
    compact?: boolean;
    decimals?: number;
    showSign?: boolean;
    hideSymbol?: boolean;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const { compact = false, decimals = 2, showSign = false, hideSymbol = false } = options;
  const prefix = hideSymbol ? "" : "₹ ";
  const sign = showSign && amount > 0 ? "+" : "";

  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_00_00_000) {
      // Crores
      return `${sign}${prefix}${(amount / 1_00_00_000).toFixed(decimals)} Cr`;
    } else if (abs >= 1_00_000) {
      // Lakhs
      return `${sign}${prefix}${(amount / 1_00_000).toFixed(decimals)} L`;
    } else if (abs >= 1_000) {
      return `${sign}${prefix}${(amount / 1_000).toFixed(decimals)} k`;
    }
  }

  const parts = amount.toFixed(decimals).split(".");
  const intPart = parts[0];
  const decPart = decimals > 0 && parts[1] ? `.${parts[1]}` : "";

  // Indian numbering system formatting
  const isNegative = intPart.startsWith("-");
  const cleanInt = isNegative ? intPart.slice(1) : intPart;

  let lastThree = cleanInt.slice(-3);
  const otherNumbers = cleanInt.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  return `${isNegative ? "-" : sign}${prefix}${formattedInt}${decPart}`;
}

export function formatPercent(
  val: number | null | undefined,
  decimals: number = 2,
  showSign: boolean = false
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return "—";
  }
  const sign = showSign && val > 0 ? "+" : "";
  return `${sign}${val.toFixed(decimals)}%`;
}

export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) return null;
  const clean = dateStr.trim();

  // Check DD-MM-YYYY format
  const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function formatNavDate(dateStr: string | null | undefined): string | null {
  const d = parseDateSafe(dateStr);
  if (!d) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export type FreshnessStatus = "fresh" | "stale" | "seed" | "needs_verification" | "unknown";

/**
 * Freshness badge logic:
 * - Fresh: updated within last 24h
 * - Stale: older than 24h
 * - Seed: static verified seed
 * - Needs verification: seed row older than 30 days OR not confirmed from source_url
 */
export function getFreshnessStatus(
  dateStr: string | null | undefined,
  isSeed: boolean = false,
  sourceUrl?: string | null,
  isConfirmed?: boolean
): { status: FreshnessStatus; label: string; ageHours: number; needsVerification: boolean } {
  const hasValidUrl =
    typeof sourceUrl === "string" &&
    sourceUrl.trim().length > 0 &&
    (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://"));

  const confirmed = isConfirmed !== false && hasValidUrl;
  const parsedDate = parseDateSafe(dateStr);

  if (!parsedDate) {
    return { status: "unknown", label: "Date unrecorded", ageHours: Infinity, needsVerification: false };
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const ageHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const ageDays = Math.floor(ageHours / 24);

  if (isSeed) {
    if (ageDays > 30 || !confirmed) {
      const reason = !confirmed ? "unconfirmed source" : `${ageDays}d old`;
      return {
        status: "needs_verification",
        label: `Needs verification (${reason})`,
        ageHours,
        needsVerification: true,
      };
    }
    return { status: "fresh", label: `Verified Seed (${ageDays}d ago)`, ageHours, needsVerification: false };
  }

  if (ageHours < 24) {
    return { status: "fresh", label: `Fresh (<24h ago)`, ageHours, needsVerification: false };
  }
  return { status: "stale", label: `Updated ${ageDays}d ago`, ageHours, needsVerification: false };
}
