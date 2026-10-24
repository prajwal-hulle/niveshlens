"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, TrendingUp, Check } from "lucide-react";
import { RiskAppetite } from "@/lib/finance/types";

interface Question {
  id: number;
  title: string;
  options: { text: string; points: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "How long do you plan to keep your money invested without touching it?",
    options: [
      { text: "Less than 2 years (Immediate liquidity needed)", points: 5 },
      { text: "3 to 5 years (Medium term goal)", points: 15 },
      { text: "5 to 10 years (Long term wealth building)", points: 25 },
      { text: "More than 10 years (Retirement or generational wealth)", points: 30 },
    ],
  },
  {
    id: 2,
    title: "If your investment dropped by 20% in a market correction within 6 months, what would you do?",
    options: [
      { text: "Panic and redeem everything immediately to prevent further loss", points: 5 },
      { text: "Feel anxious and stop any further investments", points: 12 },
      { text: "Wait patiently without doing anything until markets recover", points: 22 },
      { text: "View it as a discount sale and aggressively invest more money", points: 30 },
    ],
  },
  {
    id: 3,
    title: "What is your primary investment objective?",
    options: [
      { text: "100% Capital Protection with guaranteed returns (even if below inflation)", points: 5 },
      { text: "Stable returns slightly above inflation with low volatility", points: 15 },
      { text: "Balanced growth with moderate periodic market fluctuations", points: 22 },
      { text: "Maximum compounding wealth creation with high volatility tolerance", points: 30 },
    ],
  },
  {
    id: 4,
    title: "How stable and reliable is your monthly household income?",
    options: [
      { text: "Highly volatile / irregular (freelance / cyclical business)", points: 5 },
      { text: "Somewhat variable with seasonal spikes", points: 12 },
      { text: "Stable corporate salary / steady predictable income", points: 22 },
      { text: "Very secure permanent role with multiple surplus income streams", points: 30 },
    ],
  },
  {
    id: 5,
    title: "Do you maintain a dedicated 6-month liquid emergency fund?",
    options: [
      { text: "No, I have no separate emergency reserve", points: 5 },
      { text: "Partial reserve (1 to 2 months expenses)", points: 12 },
      { text: "Yes, fully funded 6 months emergency money in liquid FD / savings", points: 25 },
      { text: "Yes, 12+ months expenses securely stashed away", points: 30 },
    ],
  },
  {
    id: 6,
    title: "What percentage of your total net worth is currently in equity mutual funds / stocks?",
    options: [
      { text: "0% (Only FDs, gold, and traditional insurance)", points: 5 },
      { text: "1% to 25% (Very conservative exposure)", points: 15 },
      { text: "25% to 60% (Moderate diversified exposure)", points: 22 },
      { text: "Over 60% (High equity exposure)", points: 30 },
    ],
  },
];

interface RiskQuestionnaireProps {
  onComplete: (appetite: RiskAppetite, score: number) => void;
  initialScore?: number;
}

export function RiskQuestionnaire({ onComplete, initialScore }: RiskQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleSelect = (questionId: number, points: number) => {
    const updated = { ...answers, [questionId]: points };
    setAnswers(updated);

    // If all questions answered, calculate
    if (Object.keys(updated).length === QUESTIONS.length) {
      const totalPoints = Object.values(updated).reduce((a, b) => a + b, 0);
      // Max points = 180, normalize to 0-100
      const score = Math.round((totalPoints / 180) * 100);

      let appetite: RiskAppetite = "MODERATE";
      if (score < 40) appetite = "CONSERVATIVE";
      else if (score > 68) appetite = "AGGRESSIVE";

      onComplete(appetite, score);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / QUESTIONS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Questionnaire Progress: {answeredCount} / {QUESTIONS.length} answered</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{progressPct}%</span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((q) => {
          const selectedPoints = answers[q.id];
          return (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
            >
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {q.id}. {q.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, i) => {
                  const isSelected = selectedPoints === opt.points;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(q.id, opt.points)}
                      className={`text-left p-2.5 rounded-lg text-xs font-medium border transition-all flex items-start gap-2 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
