import { InstrumentMetrics, TradeoffFlag, UserProfile } from "./finance/types";
import { formatINR } from "./utils";
import { fvCompoundLumpsum, fvSip } from "./finance/compound";

/**
 * Hidden Trade-off Rules Engine
 * Evaluates instruments against user profile and generates severity-ranked trade-off flags
 * with precise evidence numbers and educational rationale.
 */
export function detectTradeoffs(
  instruments: InstrumentMetrics[],
  userProfile: UserProfile,
  cpiInflationPct: number = 5.22
): TradeoffFlag[] {
  const flags: TradeoffFlag[] = [];

  for (const inst of instruments) {
    // -------------------------------------------------------------
    // MUTUAL FUND TRADEOFF RULES
    // -------------------------------------------------------------
    if (inst.type === "MF") {
      // 1. Risk Mismatch / Max Drawdown
      const maxAllowedDrawdown =
        userProfile.riskAppetite === "CONSERVATIVE" ? 15 : userProfile.riskAppetite === "MODERATE" ? 25 : 45;

      if (inst.maxDrawdownPct > maxAllowedDrawdown) {
        flags.push({
          id: `${inst.id}-drawdown-mismatch`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "critical",
          title: "Extreme Volatility vs Risk Appetite Mismatch",
          evidence: `Historical peak drawdown is -${inst.maxDrawdownPct}%, which exceeds your ${userProfile.riskAppetite.toLowerCase()} risk threshold of ${maxAllowedDrawdown}%.`,
          whyItMatters:
            "During major market corrections, this fund has dropped significantly. A conservative or moderate investor may panic-sell at market bottoms, locking in real capital losses.",
          source: "Historical Daily NAV Drawdown Analysis (api.mfapi.in)",
        });
      }

      // 2. Regular vs Direct Expense Drag
      if (inst.name.toUpperCase().includes("REGULAR") || inst.category.toUpperCase().includes("REGULAR")) {
        // Compute compounding drag over horizon
        const estimatedGapPct = 0.85; // ~0.85% average commission drag
        const amount = userProfile.investmentAmount;
        let lostCorpus = 0;
        if (userProfile.investmentMode === "SIP") {
          const directCorpus = fvSip(amount, inst.nominalReturnPct + estimatedGapPct, userProfile.horizonYears);
          const regularCorpus = fvSip(amount, inst.nominalReturnPct, userProfile.horizonYears);
          lostCorpus = Math.max(0, directCorpus - regularCorpus);
        } else {
          const directCorpus = fvCompoundLumpsum(amount, inst.nominalReturnPct + estimatedGapPct, userProfile.horizonYears);
          const regularCorpus = fvCompoundLumpsum(amount, inst.nominalReturnPct, userProfile.horizonYears);
          lostCorpus = Math.max(0, directCorpus - regularCorpus);
        }

        flags.push({
          id: `${inst.id}-regular-plan-drag`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "Regular Plan Commission Drag",
          evidence: `Selecting a Regular plan costs ~0.8% - 1.2% in ongoing distributor commissions. Over your ${userProfile.horizonYears}-year horizon, this wipes out approx. ${formatINR(lostCorpus)} in compounded wealth.`,
          whyItMatters:
            "Direct plans of the exact same fund invest the entire amount without distributor commissions, generating significantly higher terminal wealth with zero additional risk.",
          source: "SEBI Mandated TER Disclosures / AMFI India",
        });
      }

      // 3. Past Performance Caveat & Non-guaranteed returns
      flags.push({
        id: `${inst.id}-returns-not-guaranteed`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        severity: "info",
        title: "Market-Linked Returns & Drawdown Risk",
        evidence: `Annualized volatility is ${inst.volatilityPct}% with a historical max drawdown of -${inst.maxDrawdownPct}%. Capital is not guaranteed.`,
        whyItMatters:
          "Past historical returns do not predict future returns. Equity schemes fluctuate with economic and market cycles.",
        source: "SEBI Risk-o-meter Regulations",
      });

      // 4. Insufficient History Warning
      if (inst.hasInsufficientHistory) {
        flags.push({
          id: `${inst.id}-short-history`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "Fund Track Record Shorter Than Investment Horizon",
          evidence: `The scheme's historical track record is shorter than your requested ${userProfile.horizonYears}-year horizon. Scenarios are disabled per strict data standards.`,
          whyItMatters:
            "Evaluating a long-term goal with short-term fund data leads to survivorship and recency biases.",
          source: "Data Reliability Engine",
        });
      }
    }

    // -------------------------------------------------------------
    // FIXED DEPOSIT TRADEOFF RULES
    // -------------------------------------------------------------
    if (inst.type === "FD") {
      // 1. Negative Real Return (Fisher drag)
      if (inst.realReturnPct <= 0) {
        flags.push({
          id: `${inst.id}-negative-real-return`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "critical",
          title: "Purchasing Power Erosion (Negative Real Return)",
          evidence: `Nominal return: ${inst.nominalReturnPct}%. After your marginal tax slab, post-tax return is ${inst.postTaxReturnPct}%. Against live CPI inflation (${cpiInflationPct}%), real return is ${inst.realReturnPct}%.`,
          whyItMatters:
            "Although the principal number appears safe, inflation and income tax erode purchasing power every year. You end up poorer in real terms.",
          source: "Fisher Equation & MoSPI CPI Inflation",
        });
      } else if (inst.realReturnPct < 1.5) {
        flags.push({
          id: `${inst.id}-sub-inflation-return`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "Sub-optimal Post-Tax Real Return",
          evidence: `Real return after income tax and inflation is only ${inst.realReturnPct}% per annum.`,
          whyItMatters:
            "While capital safety is high, growth is insufficient to beat education or medical inflation (which typically runs at 8-10%).",
          source: "Macroeconomic Rates Analysis",
        });
      }

      // 2. DICGC Limit Risk (> ₹5,00,000 in a single bank)
      const investmentAmt = userProfile.investmentMode === "LUMPSUM" ? userProfile.investmentAmount : userProfile.investmentAmount * 12;
      if (investmentAmt > 500000 && !inst.category.includes("POST_OFFICE")) {
        flags.push({
          id: `${inst.id}-dicgc-limit`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "DICGC Deposit Insurance Ceiling Exceeded",
          evidence: `You are investing ${formatINR(investmentAmt)}, but the statutory insurance cover by DICGC (RBI subsidiary) is capped at ₹ 5,00,000 per depositor per bank (principal + interest).`,
          whyItMatters:
            "Any deposit amount above ₹5 Lakh carries bank solvency and credit risk. Consider splitting deposits across separate banking licenses.",
          source: "Deposit Insurance and Credit Guarantee Corporation (DICGC) Act",
        });
      }

      // 3. Premature Penalty & Reinvestment Risk
      flags.push({
        id: `${inst.id}-premature-penalty`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        severity: "info",
        title: "Premature Withdrawal Penalty & Lock-in Drag",
        evidence: `Breaking this FD before maturity incurs a ${inst.prematurePenaltyPct}% interest rate haircut.`,
        whyItMatters:
          "Emergency withdrawals reduce the contracted return, and renewing matured FDs exposes you to prevailing interest rate cycles.",
        source: "Bank Terms and Conditions",
      });
    }

    // -------------------------------------------------------------
    // PPF TRADEOFF RULES
    // -------------------------------------------------------------
    if (inst.type === "PPF") {
      // 1. Strict 15-Year Lock-in vs Short Liquidity Horizon
      if (userProfile.liquidityNeedMonths < 72 && userProfile.horizonYears < 15) {
        flags.push({
          id: `${inst.id}-liquidity-lockin`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "Rigid 15-Year Statutory Lock-in",
          evidence: `PPF locks money for 15 years. Your horizon is ${userProfile.horizonYears} years and you need emergency access within ${userProfile.liquidityNeedMonths} months. Partial withdrawal opens only from year 7.`,
          whyItMatters:
            "PPF funds cannot be fully withdrawn before 15 years. Partial withdrawals are strictly limited from Year 7 onwards (up to 50% of the 4th preceding year's balance).",
          source: "Government Savings Promotion Act / Public Provident Fund Scheme 2019",
        });
      }

      // 2. Statutory ₹1.5 Lakh Annual Cap
      const plannedAnnualContribution =
        userProfile.investmentMode === "SIP" ? userProfile.investmentAmount * 12 : userProfile.investmentAmount;

      if (plannedAnnualContribution > 150000) {
        flags.push({
          id: `${inst.id}-annual-cap-breached`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "warn",
          title: "Annual Deposit Capped at ₹1.5 Lakh",
          evidence: `Your planned annual allocation of ${formatINR(plannedAnnualContribution)} exceeds the statutory PPF limit of ₹ 1,50,000. Excess amount earns 0% interest and is refunded.`,
          whyItMatters:
            "PPF cannot absorb large investment amounts. You must allocate the surplus to other tax-efficient instruments.",
          source: "Ministry of Finance Notification G.S.R. 915(E)",
        });
      }

      // 3. Quarterly Rate Reset Risk
      flags.push({
        id: `${inst.id}-rate-reset-risk`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        severity: "info",
        title: "Quarterly Government Rate Reset",
        evidence: `Current notified rate is ${inst.nominalReturnPct}%. Small savings rates are reviewed quarterly by the Ministry of Finance.`,
        whyItMatters:
          "The rate is not fixed for the 15-year tenure. Returns will adjust if government bond yields soften.",
        source: "Department of Economic Affairs, Ministry of Finance",
      });
    }

    // -------------------------------------------------------------
    // LIC TRADEOFF RULES
    // -------------------------------------------------------------
    if (inst.type === "LIC") {
      // 1. Poor Effective IRR vs Inflation / PPF
      if (inst.effectiveIrrPct < 6.5) {
        flags.push({
          id: `${inst.id}-low-irr`,
          instrumentId: inst.id,
          instrumentName: inst.name,
          severity: "critical",
          title: "Sub-par Compounded Return (Effective IRR)",
          evidence: `Actual mathematical IRR derived from plan cash flows is ${inst.effectiveIrrPct}%, trailing both PPF (${instruments.find(i => i.type === "PPF")?.nominalReturnPct ?? 7.1}%) and prevailing sovereign yields.`,
          whyItMatters:
            "Traditional endowment policies bundle low investment returns with high agency and administrative expenses, underperforming simple Term Insurance + PPF/MF.",
          source: "Actual Cash Flow IRR Calculation & LIC Brochure Rules",
        });
      }

      // 2. Early Surrender Capital Loss
      flags.push({
        id: `${inst.id}-surrender-loss`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        severity: "critical",
        title: "Severe Capital Loss on Early Surrender",
        evidence: "Surrendering in Years 1 to 3 results in a loss of 50% to 100% of all premiums paid.",
        whyItMatters:
          "If your income fluctuates and you cannot continue paying premiums for the full term, surrender penalties will wipe out a massive portion of your hard-earned money.",
        source: "IRDAI (Protection of Policyholders' Interests) Regulations",
      });

      // 3. Bonuses Not Guaranteed
      flags.push({
        id: `${inst.id}-bonus-uncertainty`,
        instrumentId: inst.id,
        instrumentName: inst.name,
        severity: "warn",
        title: "Reversionary Bonuses Are Not Guaranteed",
        evidence: "Maturity estimates rely on historical bonus declarations which vary with LIC's annual participating surplus.",
        whyItMatters:
          "If the insurer's yields drop, future reversionary bonuses will be reduced, lowering the final maturity corpus.",
        source: "LIC Valuation Report & Policy Brochure",
      });
    }
  }

  // Sort flags: critical first, then warn, then info
  const severityRank = { critical: 0, warn: 1, info: 2 };
  return flags.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
