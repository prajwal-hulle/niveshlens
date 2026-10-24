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
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden transition-colors">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base text-text">
            Analytical comparison
          </h3>
          <p className="text-xs text-text-muted">
            Side-by-side returns, tax drag, real purchasing power, and charges across selected instruments ({profile.financialYear || "FY 2025-26"})
          </p>
        </div>
        {profile.financialYear === "2026-27" && (
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:underline shrink-0"
          >
            ⚠️ Unverified projection – verify at incometax.gov.in
          </a>
        )}
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border h-16">
                <th className="p-4 font-medium text-text-muted text-xs sticky left-0 bg-surface-muted z-20 w-56 min-w-[220px] border-r border-border align-middle">
                  Metric &amp; formula
                </th>
                {instruments.map((inst) => (
                  <th key={inst.id} className="p-4 font-semibold text-text min-w-[220px] align-middle">
                    <div className="space-y-1">
                      <div className="text-sm font-medium truncate" title={inst.name}>{inst.name}</div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {inst.category}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* 1. Transparent Composite Score */}
              <tr className="bg-primary/5 font-medium">
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border text-text">
                  <FormulaTooltip
                    label="NiveshLens score"
                    formula="Σ (Dimension_i × User_Weight_i) / Σ (Weights)"
                    explanation="Objective multi-criteria score (0-100) factoring in returns, safety, liquidity, tax efficiency, flexibility, and transparency."
                    source="Scoring Engine"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 min-w-[220px]">
                    <span className="text-sm font-semibold text-primary">
                      {inst.compositeScore} / 100
                    </span>
                  </td>
                ))}
              </tr>

              {/* 2. Nominal Return */}
              <tr>
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Contracted / Median CAGR"
                    formula="FD: Contracted rate; PPF: Notified rate; MF: Median rolling CAGR; LIC: IRR"
                    explanation="Pre-tax annualized return rate."
                    source="Official Bank / AMFI / MoF records"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-medium text-text tabular-nums min-w-[220px]">
                    {formatPercent(inst.nominalReturnPct)}
                  </td>
                ))}
              </tr>

              {/* 3. Post-Tax Return */}
              <tr className="bg-surface-muted/40">
                <td className="p-4 sticky left-0 bg-surface-muted z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Post-tax return"
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:underline"
                      >
                        ⚠️ FY 2026-27 unverified
                      </a>
                    </div>
                  )}
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-medium text-text tabular-nums min-w-[220px]">
                    {formatPercent(inst.postTaxReturnPct)}
                  </td>
                ))}
              </tr>

              {/* 4. Real Return (Fisher Formula) */}
              <tr>
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Real return (Fisher)"
                    formula="Real = ((1 + PostTaxRate) / (1 + CPI_Inflation)) - 1"
                    explanation="Purchasing power growth rate after accounting for CPI inflation drag. Negative means loss of purchasing power."
                    source="Irving Fisher Mathematical Formula"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-medium tabular-nums min-w-[220px]">
                    <span
                      className={
                        inst.realReturnPct < 0
                          ? "text-danger font-semibold"
                          : "text-primary font-semibold"
                      }
                    >
                      {formatPercent(inst.realReturnPct, 2, true)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* 5. Effective IRR / XIRR */}
              <tr className="bg-surface-muted/40">
                <td className="p-4 sticky left-0 bg-surface-muted z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Effective IRR / XIRR"
                    formula="Σ [ C_t / (1 + IRR)^t ] = 0"
                    explanation="True compounding return across the life of the instrument taking into account irregular outflows and terminal inflows."
                    source="Internal Pure Math Engine (Newton-Raphson)"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 font-medium text-text tabular-nums min-w-[220px]">
                    {formatPercent(inst.effectiveIrrPct)}
                  </td>
                ))}
              </tr>

              {/* 6. Volatility (Annualized Standard Deviation) */}
              <tr>
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Annualized volatility"
                    formula="σ_ann = std(daily_returns) × √250"
                    explanation="Standard deviation of daily returns across 250 Indian trading days. 0% indicates guaranteed return with no price fluctuation."
                    source="Daily NAV History"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums min-w-[220px]">
                    {inst.volatilityPct > 0 ? (
                      <span className="font-medium text-warning">
                        {formatPercent(inst.volatilityPct)}
                      </span>
                    ) : (
                      <span className="text-text-muted">0.00% (Guaranteed)</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 7. Max Historical Drawdown */}
              <tr className="bg-surface-muted/40">
                <td className="p-4 sticky left-0 bg-surface-muted z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Maximum peak drawdown"
                    formula="Max Drawdown = (Trough NAV - Peak NAV) / Peak NAV"
                    explanation="The single largest peak-to-trough drop in historical NAV. Exposes worst-case market crash risk."
                    source="Daily NAV Trough Analysis"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums font-medium min-w-[220px]">
                    {inst.maxDrawdownPct > 0 ? (
                      <span className="text-danger">
                        -{inst.maxDrawdownPct}%
                      </span>
                    ) : (
                      <span className="text-primary">0.00%</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 8. Total Expense Ratio (AMFI) */}
              <tr>
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Expense ratio / Admin load"
                    formula="Annual TER disclosed by AMC to AMFI"
                    explanation="Annual percentage fee deducted directly from scheme AUM. (Per correction #4: never estimated; if missing shows 'TER unavailable')."
                    source="AMFI Monthly TER Disclosures"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 tabular-nums font-medium text-text min-w-[220px]">
                    {inst.type === "MF" ? (
                      inst.expenseRatioPct !== null && inst.expenseRatioPct !== undefined ? (
                        `${inst.expenseRatioPct}% / yr`
                      ) : (
                        <span className="text-text-muted italic">TER unavailable</span>
                      )
                    ) : inst.type === "FD" || inst.type === "PPF" ? (
                      <span className="text-primary">0.00% (Nil)</span>
                    ) : (
                      <span className="text-warning">Brochure mortality + admin charges</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 9. Liquidity & Lock-in */}
              <tr className="bg-surface-muted/40">
                <td className="p-4 sticky left-0 bg-surface-muted z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  <FormulaTooltip
                    label="Mandatory lock-in &amp; liquidity"
                    formula="Minimum holding duration before unrestricted redemption"
                    explanation="How easily and quickly you can convert this investment into cash."
                    source="Scheme Information Document"
                  />
                </td>
                {instruments.map((inst) => (
                  <td key={inst.id} className="p-4 min-w-[220px]">
                    <div className="space-y-0.5">
                      <span className="font-medium text-text">
                        {inst.lockInPeriodMonths > 0
                          ? `${Math.round(inst.lockInPeriodMonths / 12)} yrs lock-in`
                          : "Open ended (T+2)"}
                      </span>
                      <div className="text-[10px] text-text-muted">
                        Liquidity score: {inst.liquidityScore}/100
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* 10. Traceable Source & Freshness */}
              <tr>
                <td className="p-4 sticky left-0 bg-surface z-10 w-56 min-w-[220px] border-r border-border font-medium text-text-muted">
                  Verifiable source &amp; age
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
      </div>
    </div>
  );
}
