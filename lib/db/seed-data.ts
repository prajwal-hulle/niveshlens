import { sql } from "drizzle-orm";
import * as schema from "./schema";
import macroSeed from "../../data/seed/macro.json";
import fdSeed from "../../data/seed/fd_rates.json";
import smallSavingsSeed from "../../data/seed/small_savings.json";
import insuranceSeed from "../../data/seed/insurance_plans.json";
import mfTerSeed from "../../data/seed/mf_ter.json";
import { DEFAULT_TAX_CONFIGS } from "../finance/tax";

export async function seedDatabase(db: any) {
  if (!db) return;

  // 1. Seed macro_rates (natural key: indicator)
  for (const m of macroSeed) {
    await db
      .insert(schema.macroRates)
      .values({
        indicator: m.indicator,
        name: m.name,
        value: m.value,
        unit: m.unit,
        effectiveDate: m.effectiveDate,
        lastVerified: m.lastVerified,
        sourceName: m.sourceName,
        sourceUrl: m.sourceUrl,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.macroRates.indicator,
        set: {
          name: m.name,
          value: m.value,
          unit: m.unit,
          effectiveDate: m.effectiveDate,
          lastVerified: m.lastVerified,
          sourceName: m.sourceName,
          sourceUrl: m.sourceUrl,
        },
        where: sql`${schema.macroRates.editedByAdmin} IS NOT TRUE`,
      });
  }

  // 2. Seed fd_rates (natural key: id)
  for (const f of fdSeed) {
    await db
      .insert(schema.fdRates)
      .values({
        id: f.id,
        bankName: f.bankName,
        category: f.category,
        tenureBucket: f.tenureBucket,
        tenureMonthsMin: f.tenureMonthsMin,
        tenureMonthsMax: f.tenureMonthsMax,
        generalRatePct: f.generalRatePct,
        seniorRatePct: f.seniorRatePct,
        prematurePenaltyPct: f.prematurePenaltyPct,
        effectiveDate: f.effectiveDate,
        lastVerified: f.lastVerified,
        sourceName: f.sourceName,
        sourceUrl: f.sourceUrl,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.fdRates.id,
        set: {
          bankName: f.bankName,
          category: f.category,
          tenureBucket: f.tenureBucket,
          tenureMonthsMin: f.tenureMonthsMin,
          tenureMonthsMax: f.tenureMonthsMax,
          generalRatePct: f.generalRatePct,
          seniorRatePct: f.seniorRatePct,
          prematurePenaltyPct: f.prematurePenaltyPct,
          effectiveDate: f.effectiveDate,
          lastVerified: f.lastVerified,
          sourceName: f.sourceName,
          sourceUrl: f.sourceUrl,
        },
        where: sql`${schema.fdRates.editedByAdmin} IS NOT TRUE`,
      });
  }

  // 3. Seed small_savings_rates (natural key: schemeCode)
  for (const s of smallSavingsSeed) {
    await db
      .insert(schema.smallSavingsRates)
      .values({
        schemeCode: s.schemeCode,
        name: s.name,
        notifiedRatePct: s.notifiedRatePct,
        compoundingFrequency: s.compoundingFrequency,
        lockInYears: s.lockInYears,
        maxDepositPerYear: s.maxDepositPerYear,
        minDepositPerYear: s.minDepositPerYear,
        taxStatus: s.taxStatus,
        quarter: s.quarter,
        effectiveDate: s.effectiveDate,
        lastVerified: s.lastVerified,
        sourceName: s.sourceName,
        sourceUrl: s.sourceUrl,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.smallSavingsRates.schemeCode,
        set: {
          name: s.name,
          notifiedRatePct: s.notifiedRatePct,
          compoundingFrequency: s.compoundingFrequency,
          lockInYears: s.lockInYears,
          maxDepositPerYear: s.maxDepositPerYear,
          minDepositPerYear: s.minDepositPerYear,
          taxStatus: s.taxStatus,
          quarter: s.quarter,
          effectiveDate: s.effectiveDate,
          lastVerified: s.lastVerified,
          sourceName: s.sourceName,
          sourceUrl: s.sourceUrl,
        },
        where: sql`${schema.smallSavingsRates.editedByAdmin} IS NOT TRUE`,
      });
  }

  // 4. Seed insurance_plans (natural key: planId)
  for (const p of insuranceSeed) {
    await db
      .insert(schema.insurancePlans)
      .values({
        planId: p.planId,
        planNo: p.planNo,
        planName: p.planName,
        planType: p.planType,
        minAge: p.minAge,
        maxAge: p.maxAge,
        minTerm: p.minTerm,
        maxTerm: p.maxTerm,
        allowedTermsJson: (p as any).allowedTerms || null,
        pptRulesJson: (p as any).pptRules || null,
        guaranteedAdditionPerThousandSA: (p as any).guaranteedAdditionPerThousandSA || 0,
        guaranteedAdditionYears: (p as any).guaranteedAdditionYears || 0,
        reversionaryBonusPerThousandSA: (p as any).reversionaryBonusPerThousandSA || 0,
        finalAdditionalBonusPerThousandSA: (p as any).finalAdditionalBonusPerThousandSA || 0,
        surrenderFactorsJson: (p as any).surrenderFactors || null,
        description: p.description,
        sourceName: p.sourceName,
        sourceUrl: p.sourceUrl,
        lastVerified: p.lastVerified,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.insurancePlans.planId,
        set: {
          planNo: p.planNo,
          planName: p.planName,
          planType: p.planType,
          minAge: p.minAge,
          maxAge: p.maxAge,
          minTerm: p.minTerm,
          maxTerm: p.maxTerm,
          allowedTermsJson: (p as any).allowedTerms || null,
          pptRulesJson: (p as any).pptRules || null,
          guaranteedAdditionPerThousandSA: (p as any).guaranteedAdditionPerThousandSA || 0,
          guaranteedAdditionYears: (p as any).guaranteedAdditionYears || 0,
          reversionaryBonusPerThousandSA: (p as any).reversionaryBonusPerThousandSA || 0,
          finalAdditionalBonusPerThousandSA: (p as any).finalAdditionalBonusPerThousandSA || 0,
          surrenderFactorsJson: (p as any).surrenderFactors || null,
          description: p.description,
          sourceName: p.sourceName,
          sourceUrl: p.sourceUrl,
          lastVerified: p.lastVerified,
        },
        where: sql`${schema.insurancePlans.editedByAdmin} IS NOT TRUE`,
      });
  }

  // 5. Seed mf_expense_ratios (natural key: schemeCode)
  for (const t of mfTerSeed) {
    await db
      .insert(schema.mfExpenseRatios)
      .values({
        schemeCode: t.schemeCode,
        schemeName: t.schemeName,
        planType: t.planType,
        category: t.category,
        terPct: t.terPct,
        effectiveDate: t.effectiveDate,
        lastVerified: t.lastVerified,
        sourceName: t.sourceName,
        sourceUrl: t.sourceUrl,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.mfExpenseRatios.schemeCode,
        set: {
          schemeName: t.schemeName,
          planType: t.planType,
          category: t.category,
          terPct: t.terPct,
          effectiveDate: t.effectiveDate,
          lastVerified: t.lastVerified,
          sourceName: t.sourceName,
          sourceUrl: t.sourceUrl,
        },
        where: sql`${schema.mfExpenseRatios.editedByAdmin} IS NOT TRUE`,
      });
  }

  // 6. Seed tax_config (natural key: id)
  for (const [key, cfg] of Object.entries(DEFAULT_TAX_CONFIGS)) {
    await db
      .insert(schema.taxConfig)
      .values({
        id: key,
        financialYear: cfg.financialYear,
        regime: cfg.regime,
        slabsJson: cfg.slabs,
        standardDeduction: cfg.standardDeduction,
        rebate87ALimit: cfg.rebate87ALimit,
        deduction80CLimit: cfg.deduction80CLimit,
        equityLtcgRate: cfg.equityLtcgRate,
        equityLtcgExemption: cfg.equityLtcgExemption,
        equityStcgRate: cfg.equityStcgRate,
        fdTdsThresholdGeneral: cfg.fdTdsThresholdGeneral,
        fdTdsThresholdSenior: cfg.fdTdsThresholdSenior,
        lifeInsuranceGstRate: cfg.lifeInsuranceGstRate,
        notes: cfg.notes,
        editedByAdmin: false,
      })
      .onConflictDoUpdate({
        target: schema.taxConfig.id,
        set: {
          financialYear: cfg.financialYear,
          regime: cfg.regime,
          slabsJson: cfg.slabs,
          standardDeduction: cfg.standardDeduction,
          rebate87ALimit: cfg.rebate87ALimit,
          deduction80CLimit: cfg.deduction80CLimit,
          equityLtcgRate: cfg.equityLtcgRate,
          equityLtcgExemption: cfg.equityLtcgExemption,
          equityStcgRate: cfg.equityStcgRate,
          fdTdsThresholdGeneral: cfg.fdTdsThresholdGeneral,
          fdTdsThresholdSenior: cfg.fdTdsThresholdSenior,
          lifeInsuranceGstRate: cfg.lifeInsuranceGstRate,
          notes: cfg.notes,
        },
        where: sql`${schema.taxConfig.editedByAdmin} IS NOT TRUE`,
      });
  }
}
