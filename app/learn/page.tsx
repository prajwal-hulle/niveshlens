"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Percent,
  TrendingUp,
  Scale,
  Coins,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Clock,
  Activity,
  ArrowDownRight,
} from "lucide-react";

interface GlossaryTerm {
  id: string;
  term: string;
  icon: React.ComponentType<{ className?: string }>;
  line1: string;
  line2: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "xirr",
    term: "XIRR (Extended Internal Rate of Return)",
    icon: Percent,
    line1: "Calculates the true annual rate of return for investments with multiple cash inflows and outflows at different dates, such as SIPs or insurance premiums.",
    line2: "Unlike point-to-point returns, it accounts for the exact timing and amount of every deposit and withdrawal.",
  },
  {
    id: "cagr",
    term: "CAGR (Compound Annual Growth Rate)",
    icon: TrendingUp,
    line1: "Measures the smoothed annual growth rate of a single lump-sum investment held from a specific start date to an end date.",
    line2: "It is ideal for point-to-point comparisons but should not be used for staggered cash flows like monthly SIPs.",
  },
  {
    id: "real-return",
    term: "Real Return",
    icon: Scale,
    line1: "The actual growth of your purchasing power after accounting for both tax deductions and prevailing CPI inflation.",
    line2: "Calculated via the Fisher equation, a positive nominal return can still turn out to be negative in real purchasing terms.",
  },
  {
    id: "expense-ratio",
    term: "Expense Ratio (TER)",
    icon: Coins,
    line1: "The annual percentage fee deducted daily from a mutual fund's Net Asset Value by the AMC to cover management and operating costs.",
    line2: "A higher expense ratio compounds silently over the years, significantly reducing your final wealth accumulation.",
  },
  {
    id: "direct-vs-regular",
    term: "Direct vs Regular Plans",
    icon: ArrowRightLeft,
    line1: "Direct plans have lower expense ratios because you invest directly without paying recurring commissions to brokers or distributors.",
    line2: "Regular plans deduct an ongoing distribution commission every year, resulting in lower net returns over long horizons.",
  },
  {
    id: "surrender-value",
    term: "Surrender Value",
    icon: AlertTriangle,
    line1: "The payout an insurer returns if you terminate a traditional life insurance or endowment policy before maturity.",
    line2: "Discontinuing early usually results in severe statutory penalties, often forfeiting a substantial portion of all premiums paid.",
  },
  {
    id: "dicgc",
    term: "DICGC",
    icon: ShieldCheck,
    line1: "Deposit Insurance and Credit Guarantee Corporation coverage that protects up to ₹5 Lakhs per depositor per bank entity in India.",
    line2: "It covers both principal and accrued interest across savings, current, and fixed deposits if a bank defaults or fails.",
  },
  {
    id: "lock-in",
    term: "Lock-in",
    icon: Lock,
    line1: "A mandatory timeframe during which your invested money cannot be withdrawn or liquidated without severe penalties.",
    line2: "Instruments like PPF (15 years) or tax-saving ELSS funds (3 years) enforce statutory lock-ins in exchange for specific benefits.",
  },
  {
    id: "exit-load",
    term: "Exit Load",
    icon: Clock,
    line1: "A fee charged by mutual fund houses if you redeem your units before a specified holding period, such as one year.",
    line2: "It discourages short-term withdrawals and protects remaining long-term unit-holders from transaction costs.",
  },
  {
    id: "sharpe-ratio",
    term: "Sharpe Ratio",
    icon: Activity,
    line1: "A measure of risk-adjusted performance that reveals how much excess return an investment delivers relative to a risk-free benchmark.",
    line2: "A higher Sharpe ratio indicates that the fund generated better returns for the volatility and risk taken.",
  },
  {
    id: "drawdown",
    term: "Drawdown",
    icon: ArrowDownRight,
    line1: "The peak-to-trough decline in an investment's value, showing how much money you could lose during market downturns.",
    line2: "Maximum drawdown helps investors understand potential pain points and historical recovery times before committing capital.",
  },
];

export default function LearnPage() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    xirr: true,
    cagr: true,
  });

  const toggleTerm = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full space-y-8">
      <div className="max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
          <span>Financial Glossary</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Financial Terms Explained
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Plain-English definitions of core financial concepts without jargon, formulas, or sales pitches.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {GLOSSARY_TERMS.map((item) => {
          const Icon = item.icon;
          const isOpen = !!openIds[item.id];
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleTerm(item.id)}
                aria-expanded={isOpen}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.term}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                  <p>{item.line1}</p>
                  <p>{item.line2}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
