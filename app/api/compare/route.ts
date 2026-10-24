import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getMacroRate,
  getFdRates,
  getSmallSavingsRates,
  getInsurancePlans,
  getTaxConfig,
  getHlvConfig,
} from "@/lib/db";
import { getMutualFundDetails } from "@/lib/data-sources/mfapi";
import { calculateFisherRealReturn } from "@/lib/finance/fisher";
import {
  calculatePostTaxReturn,
} from "@/lib/finance/tax";
import {
  fvCompoundLumpsum,
  fvSip,
  calculatePpfSchedule,
} from "@/lib/finance/compound";
import {
  calculateLicCashFlowsAndIRR,
  calculateInsuranceAdequacy,
} from "@/lib/finance/insurance";
import { computeRadarScores, calculateCompositeScore, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { detectTradeoffs } from "@/lib/tradeoffs";
import { InstrumentMetrics, UserProfile } from "@/lib/finance/types";
import { checkRateLimit } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const CompareRequestSchema = z.object({
  profile: z.object({
    age: z.number().default(32),
    annualIncome: z.number().default(1200000),
    taxRegime: z.enum(["NEW", "OLD"]).default("NEW"),
    financialYear: z.enum(["2024-25", "2025-26", "2026-27"]).default("2024-25"),
    investmentMode: z.enum(["LUMPSUM", "SIP"]).default("SIP"),
    investmentAmount: z.number().default(10000),
    horizonYears: z.number().default(10),
    riskAppetite: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]).default("MODERATE"),
    riskScore: z.number().default(50),
    liquidityNeedMonths: z.number().default(36),
    dependents: z.number().default(2),
    existingLifeCover: z.number().default(2500000),
    outstandingLiabilities: z.number().default(1000000),
    goalType: z.enum(["RETIREMENT", "CHILD_EDUCATION", "WEALTH", "TAX_SAVING"]).default("WEALTH"),
  }),
  instruments: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["FD", "PPF", "MF", "LIC"]),
      // FD options
      bankId: z.string().optional(),
      // MF options
      schemeCode: z.number().optional(),
      // LIC options (User enters premium, SA, term, PPT per correction #5)
      planId: z.string().optional(),
      annualPremium: z.number().optional(),
      sumAssured: z.number().optional(),
      policyTerm: z.number().optional(),
      premiumPayingTerm: z.number().optional(),
    })
  ).min(1).max(5),
  customWeights: z.object({
    returns: z.number(),
    safety: z.number(),
    liquidity: z.number(),
    taxEfficiency: z.number(),
    flexibility: z.number(),
    transparency: z.number(),
  }).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parseResult = CompareRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { profile, instruments: requestedInstruments, customWeights } = parseResult.data;
  const userProfile = profile as UserProfile;

  // Fetch live macro and tax configuration
  const [cpiInflation, repoRate, taxConfig, fdList, smallSavingsList, insuranceList, hlvConfig] =
    await Promise.all([
      getMacroRate("cpi_inflation"),
      getMacroRate("repo_rate"),
      getTaxConfig(userProfile.financialYear, userProfile.taxRegime),
      getFdRates(),
      getSmallSavingsRates(),
      getInsurancePlans(),
      getHlvConfig(),
    ]);

  const computedInstruments: InstrumentMetrics[] = [];
  let totalSelectedInsuranceCover = 0;

  for (const item of requestedInstruments) {
    if (item.type === "FD") {
      const match = fdList.find((f: any) => f.id === item.bankId) || fdList[0];
      const nominalRate = profile.age >= 60 ? match.seniorRatePct : match.generalRatePct;
      const postTax = calculatePostTaxReturn({
        nominalReturnPct: nominalRate,
        assetType: "FD",
        annualIncome: userProfile.annualIncome,
        config: taxConfig,
        holdingPeriodYears: userProfile.horizonYears,
      });
      const realReturn = calculateFisherRealReturn(postTax, cpiInflation);

      let baseCorpus = 0;
      if (userProfile.investmentMode === "SIP") {
        baseCorpus = fvSip(userProfile.investmentAmount, postTax, userProfile.horizonYears);
      } else {
        baseCorpus = fvCompoundLumpsum(userProfile.investmentAmount, postTax, userProfile.horizonYears, "quarterly");
      }

      const radar = computeRadarScores(
        {
          type: "FD",
          category: match.category,
          realReturnPct: realReturn,
          postTaxReturnPct: postTax,
          nominalReturnPct: nominalRate,
          maxDrawdownPct: 0,
        },
        userProfile
      );

      const weights = customWeights || DEFAULT_WEIGHTS[userProfile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED;
      const compositeScore = calculateCompositeScore(radar, weights);

      computedInstruments.push({
        id: item.id || `fd-${match.id}`,
        name: `${match.bankName} (${match.tenureBucket})`,
        type: "FD",
        category: `${match.category} Bank FD`,
        nominalReturnPct: nominalRate,
        postTaxReturnPct: postTax,
        realReturnPct: realReturn,
        effectiveIrrPct: postTax,
        volatilityPct: 0,
        maxDrawdownPct: 0,
        worst1YrReturnPct: nominalRate,
        probabilityOfLossPct: 0,
        totalCharges: 0,
        taxBenefit80C: match.tenureBucket.includes("5") && userProfile.taxRegime === "OLD" ? Math.min(userProfile.investmentAmount, 150000) : 0,
        liquidityScore: 80,
        lockInPeriodMonths: match.tenureMonthsMin,
        prematurePenaltyPct: match.prematurePenaltyPct,
        projectedCorpus: {
          pessimistic: baseCorpus,
          base: baseCorpus,
          optimistic: baseCorpus,
        },
        hasInsufficientHistory: false,
        radarScores: radar,
        compositeScore,
        dataSource: {
          name: match.sourceName,
          url: match.sourceUrl,
          lastUpdated: match.lastVerified,
        },
      });
    } else if (item.type === "PPF") {
      const match = smallSavingsList.find((s: any) => s.schemeCode === "PPF") || smallSavingsList[0];
      const nominalRate = match.notifiedRatePct;
      const postTax = nominalRate; // EEE tax free
      const realReturn = calculateFisherRealReturn(postTax, cpiInflation);

      // PPF calculation with annual compounding & ₹1.5L cap
      const annualDeposit =
        userProfile.investmentMode === "SIP" ? userProfile.investmentAmount * 12 : userProfile.investmentAmount;
      const ppfRes = calculatePpfSchedule(annualDeposit, nominalRate, userProfile.horizonYears);
      const baseCorpus = ppfRes.maturityCorpus;

      const radar = computeRadarScores(
        {
          type: "PPF",
          category: "Small Savings",
          realReturnPct: realReturn,
          postTaxReturnPct: postTax,
          nominalReturnPct: nominalRate,
          maxDrawdownPct: 0,
        },
        userProfile
      );

      const weights = customWeights || DEFAULT_WEIGHTS[userProfile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED;
      const compositeScore = calculateCompositeScore(radar, weights);

      computedInstruments.push({
        id: item.id || "ppf-scheme",
        name: match.name,
        type: "PPF",
        category: "Central Government Sovereign Small Savings",
        nominalReturnPct: nominalRate,
        postTaxReturnPct: postTax,
        realReturnPct: realReturn,
        effectiveIrrPct: postTax,
        volatilityPct: 0,
        maxDrawdownPct: 0,
        worst1YrReturnPct: nominalRate,
        probabilityOfLossPct: 0,
        totalCharges: 0,
        taxBenefit80C: userProfile.taxRegime === "OLD" ? Math.min(annualDeposit, 150000) : 0,
        liquidityScore: userProfile.horizonYears >= 15 ? 45 : 25,
        lockInPeriodMonths: 180, // 15 years
        prematurePenaltyPct: 0,
        projectedCorpus: {
          pessimistic: baseCorpus,
          base: baseCorpus,
          optimistic: baseCorpus,
        },
        hasInsufficientHistory: false,
        radarScores: radar,
        compositeScore,
        dataSource: {
          name: match.sourceName,
          url: match.sourceUrl,
          lastUpdated: match.lastVerified,
        },
      });
    } else if (item.type === "MF") {
      const schemeCode = item.schemeCode || 122639; // Default Parag Parikh Flexi Cap Direct
      const mfDetails = await getMutualFundDetails(schemeCode, userProfile.horizonYears);

      if (mfDetails) {
        const nominalReturn = mfDetails.rollingReturns.base50th ?? mfDetails.cagr3Yr ?? mfDetails.cagrSinceInception ?? 12.0;
        const postTax = calculatePostTaxReturn({
          nominalReturnPct: nominalReturn,
          assetType: "MF",
          mfCategory: "EQUITY",
          annualIncome: userProfile.annualIncome,
          config: taxConfig,
          holdingPeriodYears: userProfile.horizonYears,
        });
        const realReturn = calculateFisherRealReturn(postTax, cpiInflation);

        const hasInsufficient = mfDetails.rollingReturns.hasInsufficientHistory;

        let pessimisticCorpus: number | null = null;
        let baseCorpus: number;
        let optimisticCorpus: number | null = null;

        if (userProfile.investmentMode === "SIP") {
          baseCorpus = fvSip(userProfile.investmentAmount, postTax, userProfile.horizonYears);
          if (!hasInsufficient && mfDetails.rollingReturns.pessimistic10th !== null && mfDetails.rollingReturns.optimistic90th !== null) {
            pessimisticCorpus = fvSip(userProfile.investmentAmount, mfDetails.rollingReturns.pessimistic10th, userProfile.horizonYears);
            optimisticCorpus = fvSip(userProfile.investmentAmount, mfDetails.rollingReturns.optimistic90th, userProfile.horizonYears);
          }
        } else {
          baseCorpus = fvCompoundLumpsum(userProfile.investmentAmount, postTax, userProfile.horizonYears);
          if (!hasInsufficient && mfDetails.rollingReturns.pessimistic10th !== null && mfDetails.rollingReturns.optimistic90th !== null) {
            pessimisticCorpus = fvCompoundLumpsum(userProfile.investmentAmount, mfDetails.rollingReturns.pessimistic10th, userProfile.horizonYears);
            optimisticCorpus = fvCompoundLumpsum(userProfile.investmentAmount, mfDetails.rollingReturns.optimistic90th, userProfile.horizonYears);
          }
        }

        const radar = computeRadarScores(
          {
            type: "MF",
            category: mfDetails.schemeCategory,
            realReturnPct: realReturn,
            postTaxReturnPct: postTax,
            nominalReturnPct: nominalReturn,
            maxDrawdownPct: mfDetails.maxDrawdownPct,
            volatilityPct: mfDetails.volatility,
          },
          userProfile
        );

        const weights = customWeights || DEFAULT_WEIGHTS[userProfile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED;
        const compositeScore = calculateCompositeScore(radar, weights);

        computedInstruments.push({
          id: item.id || `mf-${schemeCode}`,
          name: mfDetails.schemeName,
          type: "MF",
          category: `${mfDetails.schemeCategory} (${mfDetails.planType})`,
          nominalReturnPct: nominalReturn,
          postTaxReturnPct: postTax,
          realReturnPct: realReturn,
          effectiveIrrPct: postTax,
          volatilityPct: mfDetails.volatility,
          maxDrawdownPct: mfDetails.maxDrawdownPct,
          worst1YrReturnPct: mfDetails.rollingReturns.minReturn ?? undefined,
          probabilityOfLossPct: mfDetails.rollingReturns.probabilityOfLossPct ?? undefined,
          sharpeRatio: mfDetails.sharpeRatio,
          totalCharges: 0,
          expenseRatioPct: mfDetails.expenseRatio,
          taxBenefit80C: mfDetails.schemeCategory.toUpperCase().includes("ELSS") && userProfile.taxRegime === "OLD" ? Math.min(userProfile.investmentAmount, 150000) : 0,
          liquidityScore: 92,
          lockInPeriodMonths: mfDetails.schemeCategory.toUpperCase().includes("ELSS") ? 36 : 0,
          prematurePenaltyPct: 1.0, // standard 1% exit load < 365 days
          projectedCorpus: {
            pessimistic: pessimisticCorpus,
            base: baseCorpus,
            optimistic: optimisticCorpus,
          },
          hasInsufficientHistory: hasInsufficient,
          radarScores: radar,
          compositeScore,
          dataSource: mfDetails.dataSource,
        });
      }
    } else if (item.type === "LIC") {
      const plan = insuranceList.find((p: any) => p.planId === item.planId) || insuranceList[0];
      const annualPremium = item.annualPremium || 85600;
      const sumAssured = item.sumAssured || 1000000;
      const term = item.policyTerm || 16;
      const ppt = item.premiumPayingTerm || 10;

      totalSelectedInsuranceCover += sumAssured;

      const licResult = calculateLicCashFlowsAndIRR({
        annualPremium,
        sumAssured,
        policyTerm: term,
        premiumPayingTerm: ppt,
        planRules: {
          planId: plan.planId,
          planNo: plan.planNo,
          planName: plan.planName,
          planType: plan.planType,
          minAge: plan.minAge,
          maxAge: plan.maxAge,
          minTerm: plan.minTerm,
          maxTerm: plan.maxTerm,
          guaranteedAdditionPerThousandSA: plan.guaranteedAdditionPerThousandSA,
          guaranteedAdditionYears: plan.guaranteedAdditionYears,
          reversionaryBonusPerThousandSA: plan.reversionaryBonusPerThousandSA,
          finalAdditionalBonusPerThousandSA: plan.finalAdditionalBonusPerThousandSA,
          surrenderFactors: plan.surrenderFactorsJson || {},
          sourceUrl: plan.sourceUrl,
          lastVerified: plan.lastVerified,
        },
        gstRate: taxConfig.lifeInsuranceGstRate, // 0% per correction #1
      });

      const nominalRate = licResult.effectiveIrrPct;
      const postTax = nominalRate; // Sec 10(10D) tax exempt
      const realReturn = calculateFisherRealReturn(postTax, cpiInflation);

      const radar = computeRadarScores(
        {
          type: "LIC",
          category: plan.planType,
          realReturnPct: realReturn,
          postTaxReturnPct: postTax,
          nominalReturnPct: nominalRate,
          maxDrawdownPct: 0,
        },
        userProfile
      );

      const weights = customWeights || DEFAULT_WEIGHTS[userProfile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED;
      const compositeScore = calculateCompositeScore(radar, weights);

      computedInstruments.push({
        id: item.id || `lic-${plan.planId}`,
        name: plan.planName,
        type: "LIC",
        category: `Traditional Insurance (${plan.planType})`,
        nominalReturnPct: nominalRate,
        postTaxReturnPct: postTax,
        realReturnPct: realReturn,
        effectiveIrrPct: licResult.effectiveIrrPct,
        volatilityPct: 0,
        maxDrawdownPct: 0,
        worst1YrReturnPct: nominalRate,
        probabilityOfLossPct: 0,
        totalCharges: Math.round(licResult.totalPremiumsPaid * 0.15),
        taxBenefit80C: userProfile.taxRegime === "OLD" ? Math.min(annualPremium, 150000) : 0,
        liquidityScore: 15,
        lockInPeriodMonths: term * 12,
        prematurePenaltyPct: 50.0,
        projectedCorpus: {
          pessimistic: licResult.maturityCorpus,
          base: licResult.maturityCorpus,
          optimistic: licResult.maturityCorpus,
        },
        hasInsufficientHistory: false,
        radarScores: radar,
        compositeScore,
        dataSource: {
          name: plan.sourceName,
          url: plan.sourceUrl,
          lastUpdated: plan.lastVerified,
        },
      });
    }
  }

  // Detect hidden trade-offs across all selected instruments
  const tradeoffs = detectTradeoffs(computedInstruments, userProfile, cpiInflation);

  // Insurance Adequacy HLV analysis using dynamic hlvConfig from DB (patch #2)
  const insuranceAdequacy = calculateInsuranceAdequacy({
    age: userProfile.age,
    annualIncome: userProfile.annualIncome,
    existingLifeCover: userProfile.existingLifeCover,
    outstandingLiabilities: userProfile.outstandingLiabilities,
    dependents: userProfile.dependents,
    selectedPlanCover: totalSelectedInsuranceCover,
    hlvConfig,
  });

  return NextResponse.json({
    instruments: computedInstruments,
    tradeoffs,
    insuranceAdequacy,
    hlvConfig,
    macro: {
      cpiInflation,
      repoRate,
    },
    taxConfig: {
      financialYear: taxConfig.financialYear,
      regime: taxConfig.regime,
      lifeInsuranceGstRate: taxConfig.lifeInsuranceGstRate,
      fdTdsThresholdGeneral: taxConfig.fdTdsThresholdGeneral,
      fdTdsThresholdSenior: taxConfig.fdTdsThresholdSenior,
    },
    scoringWeights: customWeights || DEFAULT_WEIGHTS[userProfile.riskAppetite] || DEFAULT_WEIGHTS.BALANCED,
    timestamp: new Date().toISOString(),
  });
}
