"use client";

import React, { useState } from "react";
import { ScoringWeights } from "@/lib/scoring";
import { Sliders, X, RotateCcw, Info } from "lucide-react";

interface ScoringDrawerProps {
  weights: ScoringWeights;
  onChange: (weights: ScoringWeights) => void;
  onReset: () => void;
}

export function ScoringDrawer({ weights, onChange, onReset }: ScoringDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dimensions = [
    { key: "returns", label: "Real Return", desc: "Weight on inflation-adjusted post-tax CAGR" },
    { key: "safety", label: "Capital Safety", desc: "Weight on sovereign guarantee & low drawdown" },
    { key: "liquidity", label: "Liquidity Access", desc: "Weight on redemption speed without lock-in" },
    { key: "taxEfficiency", label: "Tax Efficiency", desc: "Weight on post-tax vs nominal return ratio & 80C" },
    { key: "flexibility", label: "Operational Flexibility", desc: "Weight on SIP alteration and pause rules" },
    { key: "transparency", label: "Data Transparency", desc: "Weight on daily public NAV/TER disclosures" },
  ];

  const handleSliderChange = (key: keyof ScoringWeights, val: number) => {
    onChange({
      ...weights,
      [key]: val,
    });
  };

  const total =
    weights.returns +
    weights.safety +
    weights.liquidity +
    weights.taxEfficiency +
    weights.flexibility +
    weights.transparency;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
      >
        <Sliders className="w-3.5 h-3.5 text-emerald-500" />
        <span>Inspect & Customize Scoring Formula</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Transparent Scoring Engine
                </h3>
                <span className="text-[11px] text-slate-500">
                  Custom weight sliders update instrument scores live
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Formula Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Formula Specification</span>
                </div>
                <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 break-all">
                  Score = Σ (Dim_i × Weight_i) / Σ (Weights)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No hidden black-box ranking. Adjust each dimension weight below to prioritize what matters most to your financial life.
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {dimensions.map((dim) => {
                  const val = weights[dim.key as keyof ScoringWeights];
                  const pct = Math.round((val / total) * 100);
                  return (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {dim.label}
                        </span>
                        <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {val} pts ({pct}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{dim.desc}</p>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={5}
                        value={val}
                        onChange={(e) =>
                          handleSliderChange(dim.key as keyof ScoringWeights, Number(e.target.value))
                        }
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Profile Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
