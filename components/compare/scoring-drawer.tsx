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
    { key: "returns", label: "Real return", desc: "Weight on inflation-adjusted post-tax CAGR" },
    { key: "safety", label: "Capital safety", desc: "Weight on sovereign guarantee & low drawdown" },
    { key: "liquidity", label: "Liquidity access", desc: "Weight on redemption speed without lock-in" },
    { key: "taxEfficiency", label: "Tax efficiency", desc: "Weight on post-tax vs nominal return ratio & 80C" },
    { key: "flexibility", label: "Operational flexibility", desc: "Weight on SIP alteration and pause rules" },
    { key: "transparency", label: "Data transparency", desc: "Weight on daily public NAV/TER disclosures" },
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text hover:bg-surface-muted transition-colors shadow-sm"
      >
        <Sliders className="w-3.5 h-3.5 text-text-muted" />
        <span>Scoring weights</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] bg-surface rounded-none sm:rounded-xl border border-border shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-text">
                  Transparent scoring engine
                </h3>
                <span className="text-[11px] text-text-muted">
                  Custom weight sliders update instrument scores live
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Formula Explanation */}
              <div className="p-3.5 rounded-lg bg-surface-muted border border-border space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>Formula specification</span>
                </div>
                <div className="font-mono text-[11px] text-primary bg-surface p-2 rounded border border-border break-all">
                  Score = Σ (Dim_i × Weight_i) / Σ (Weights)
                </div>
                <p className="text-[11px] text-text-muted">
                  No hidden black-box ranking. Adjust each dimension weight below to prioritize what matters most to your goals.
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
                        <span className="font-medium text-text">
                          {dim.label}
                        </span>
                        <span className="font-semibold tabular-nums text-primary">
                          {val} pts ({pct}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">{dim.desc}</p>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={5}
                        value={val}
                        onChange={(e) =>
                          handleSliderChange(dim.key as keyof ScoringWeights, Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-surface-muted">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to profile defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
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
