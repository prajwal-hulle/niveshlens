"use client";

import React from "react";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { FreshnessBadge } from "../freshness-badge";
import { FormulaTooltip } from "../formula-tooltip";
import { useCurrency } from "../currency-context";
import { formatPercent } from "@/lib/utils";

interface MetricsTableProps {
  instruments: InstrumentMetrics[];
  profile: UserProfile;
}

export function MetricsTable({ instruments, profile }: MetricsTableProps) {
  const { format } = useCurrency();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Comprehensive Analytical Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Side-by-side returns, tax drag, real purchasing power, and charges across selected instruments ({profile.financialYear || "FY 2025-26"})
          </p>
        </div>
        {profile.financialYear === "2026-27" && (
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:underline shrink-0"
          >
            ⚠️ Unverified projection – verify at incometax.gov.in
          </a>
        )}
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 h-20">
                <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] sticky left-0 bg-slate-50 dark:bg-slate-950 z-20 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 align-top">
                  Metric & Formula
                </th>
                {instruments.map((inst) => (
                  <th key={inst.id} className="p-4 font-bold text-slate-900 dark:text-white min-w-[220px] align-top">
                    <div className="space-y-1">
                      <div className="text-sm truncate">{inst.name}</div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        {inst.category}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* 1. Transparent Composite Score */}
              <tr className="bg-emerald-500/5 font-semibold">
                <td className="p-4 sticky left-0 bg-emerald-50 dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800">
                  <FormulaTooltip
                    label="NiveshLens Composite Score"
                    formula="Σ (Dimension_i × User_Weight_i) / Σ (Weights)"
                    explanation="Objective multi-criteria score (0-100) factoring in returns, safety, liquidity, tax efficiency, flexibility, and transparency."
                    source="Scoring Engine"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 min-w-[220px]">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {inst.compositeScore} / 100
                    </span>
                  </td>
                ))}
              </tr>

              {/* 2. Nominal Return */}
              <tr>
                <td className="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Contracted / Median CAGR"
                    formula="FD: Contracted rate; PPF: Notified rate; MF: Median rolling CAGR; LIC: IRR"
                    explanation="Pre-tax annualized return rate."
                    source="Official Bank / AMFI / MoF records"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-bold text-slate-900 dark:text-white tabular-nums min-w-[220px]">
                    {formatPercent(inst.nominalReturnPct)}
                  </td>
                ))}
              </tr>

              {/* 3. Post-Tax Return */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <td className="p-4 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Post-Tax Return (Net)"
                    formula="FD: r × (1 - TaxRate); Equity MF: LTCG @ 12.5% above ₹1.25L; PPF: Tax-free (EEE)"
                    explanation="Net annual return after subtracting your income tax slab liabilities."
                    source="Income Tax Act, 1961"
                  />
                  {profile.financialYear === "2026-27" && (
                    <div className="mt-1">
                      <a
                        href="https://www.incometax.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:underline"
                      >
                        ⚠️ Unverified projection – verify at incometax.gov.in
                      </a>
                    </div>
                  )}
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-bold text-slate-900 dark:text-white tabular-nums min-w-[220px]">
                    {formatPercent(inst.postTaxReturnPct)}
                  </td>
                ))}
              </tr>

              {/* 4. Real Return (Fisher Formula) */}
              <tr>
                <td className="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Real Return (Fisher Equation)"
                    formula="Real = ((1 + PostTaxRate) / (1 + CPI_Inflation)) - 1"
                    explanation="Purchasing power growth rate after accounting for CPI inflation drag. Negative means loss of purchasing power."
                    source="Irving Fisher Mathematical Formula"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-bold tabular-nums min-w-[220px]">
                    <span
                      className={
                        inst.realReturnPct < 0
                          ? "text-rose-600 dark:text-rose-400 font-extrabold"
                          : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {formatPercent(inst.realReturnPct, 2, true)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 5. Effective IRR / XIRR */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <td className="p-4 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Effective Internal Rate of Return (IRR)"
                    formula="Σ [ C_t / (1 + IRR)^t ] = 0"
                    explanation="True compounding return across the life of the instrument taking into account irregular outflows and terminal inflows."
                    source="Internal Pure Math Engine (Newton-Raphson)"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-bold tabular-nums min-w-[220px]">
                    {formatPercent(inst.effectiveIrrPct)}
                  </td>
                ))}
              </tr>

              {/* 6. Volatility (Annualized Standard Deviation) */}
              <tr>
                <td className="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Annualized Volatility"
                    formula="σ_ann = std(daily_returns) × √250"
                    explanation="Standard deviation of daily returns across 250 Indian trading days. 0% indicates guaranteed return with no price fluctuation."
                    source="Daily NAV History"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums min-w-[220px]">
                    {inst.volatilityPct > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {formatPercent(inst.volatilityPct)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">0.00% (Guaranteed)</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 7. Max Historical Drawdown */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <td className="p-4 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Maximum Peak Drawdown"
                    formula="Max Drawdown = (Trough NAV - Peak NAV) / Peak NAV"
                    explanation="The single largest peak-to-trough drop in historical NAV. Exposes worst-case market crash risk."
                    source="Daily NAV Trough Analysis"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums font-semibold min-w-[220px]">
                    {inst.maxDrawdownPct > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        -{inst.maxDrawdownPct}%
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">0.00%</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 8. Total Expense Ratio (AMFI) */}
              <tr>
                <td className="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Expense Ratio / Admin Load"
                    formula="Annual TER disclosed by AMC to AMFI"
                    explanation="Annual percentage fee deducted directly from scheme AUM. (Per correction #4: never estimated; if missing shows 'TER unavailable')."
                    source="AMFI Monthly TER Disclosures"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums font-semibold min-w-[220px]">
                    {inst.type === "MF" ? (
                      inst.expenseRatioPct !== null && inst.expenseRatioPct !== undefined ? (
                        `${inst.expenseRatioPct}% / yr`
                      ) : (
                        <span className="text-slate-400 italic">TER unavailable</span>
                      )
                    ) : inst.type === "FD" || inst.type === "PPF" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">0.00% (Nil)</span>
                    ) : (
                      <span className="text-amber-600">Brochure Mortality + Admin Charges</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 9. Liquidity & Lock-in */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <td className="p-4 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <FormulaTooltip
                    label="Mandatory Lock-in & Liquidity"
                    formula="Minimum holding duration before unrestricted redemption"
                    explanation="How easily and quickly you can convert this investment into cash."
                    source="Scheme Information Document"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 min-w-[220px]">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inst.lockInPeriodMonths > 0
                          ? `${Math.round(inst.lockInPeriodMonths / 12)} Yrs Lock-in`
                          : "Open Ended (T+2)"}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        Liquidity score: {inst.liquidityScore}/100
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* 10. Traceable Source & Freshness */}
              <tr>
                <td className="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 w-56 min-w-[220px] border-r border-slate-200 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  Verifiable Source & Age
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 min-w-[220px]">
                    <FreshnessBadge
                      sourceName={inst.dataSource.name}
                      sourceUrl={inst.dataSource.url}
                      lastUpdated={inst.dataSource.lastUpdated}
                      isSeed={inst.dataSource.isSeed}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {/* Subtle right-edge fade to indicate scrollability without duplicate scrollbars */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />
      </div>
    </div>
  );
}
