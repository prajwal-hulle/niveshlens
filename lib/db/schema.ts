import { pgTable, text, serial, integer, doublePrecision, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const macroRates = pgTable("macro_rates", {
  id: serial("id").primaryKey(),
  indicator: text("indicator").notNull().unique(), // e.g. repo_rate, cpi_inflation, t_bill_91d
  name: text("name").notNull(),
  value: doublePrecision("value").notNull(),
  unit: text("unit").notNull().default("%"),
  effectiveDate: text("effective_date").notNull(),
  lastVerified: text("last_verified").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fdRates = pgTable("fd_rates", {
  id: text("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  category: text("category").notNull(), // PUBLIC, PRIVATE, SMALL_FINANCE, POST_OFFICE
  tenureBucket: text("tenure_bucket").notNull(),
  tenureMonthsMin: integer("tenure_months_min").notNull(),
  tenureMonthsMax: integer("tenure_months_max").notNull(),
  generalRatePct: doublePrecision("general_rate_pct").notNull(),
  seniorRatePct: doublePrecision("senior_rate_pct").notNull(),
  prematurePenaltyPct: doublePrecision("premature_penalty_pct").notNull().default(1.0),
  effectiveDate: text("effective_date").notNull(),
  lastVerified: text("last_verified").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smallSavingsRates = pgTable("small_savings_rates", {
  schemeCode: text("scheme_code").primaryKey(), // PPF, SCSS, NSC, SSA, POTD_5Y
  name: text("name").notNull(),
  notifiedRatePct: doublePrecision("notified_rate_pct").notNull(),
  compoundingFrequency: text("compounding_frequency").notNull(),
  lockInYears: integer("lock_in_years").notNull(),
  maxDepositPerYear: integer("max_deposit_per_year"),
  minDepositPerYear: integer("min_deposit_per_year"),
  taxStatus: text("tax_status").notNull(),
  quarter: text("quarter").notNull(),
  effectiveDate: text("effective_date").notNull(),
  lastVerified: text("last_verified").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insurancePlans = pgTable("insurance_plans", {
  planId: text("plan_id").primaryKey(),
  planNo: integer("plan_no").notNull(),
  planName: text("plan_name").notNull(),
  planType: text("plan_type").notNull(), // ENDOWMENT, WHOLE_LIFE, MONEY_BACK, TERM
  minAge: integer("min_age").notNull(),
  maxAge: integer("max_age").notNull(),
  minTerm: integer("min_term").notNull(),
  maxTerm: integer("max_term").notNull(),
  allowedTermsJson: jsonb("allowed_terms_json"),
  pptRulesJson: jsonb("ppt_rules_json"),
  guaranteedAdditionPerThousandSA: doublePrecision("guaranteed_addition_per_thousand_sa").default(0),
  guaranteedAdditionYears: integer("guaranteed_addition_years").default(0),
  reversionaryBonusPerThousandSA: doublePrecision("reversionary_bonus_per_thousand_sa").default(0),
  finalAdditionalBonusPerThousandSA: doublePrecision("final_additional_bonus_per_thousand_sa").default(0),
  surrenderFactorsJson: jsonb("surrender_factors_json"),
  description: text("description"),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  lastVerified: text("last_verified").notNull(),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mfExpenseRatios = pgTable("mf_expense_ratios", {
  schemeCode: integer("scheme_code").primaryKey(),
  schemeName: text("scheme_name").notNull(),
  planType: text("plan_type").notNull(), // DIRECT, REGULAR
  category: text("category").notNull(),
  terPct: doublePrecision("ter_pct").notNull(),
  effectiveDate: text("effective_date").notNull(),
  lastVerified: text("last_verified").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taxConfig = pgTable("tax_config", {
  id: text("id").primaryKey(), // e.g. "2024-25-NEW", "2025-26-NEW", "2026-27-NEW", etc.
  financialYear: text("financial_year").notNull(), // "2024-25" | "2025-26" | "2026-27"
  regime: text("regime").notNull(), // "NEW" | "OLD"
  slabsJson: jsonb("slabs_json").notNull(),
  standardDeduction: integer("standard_deduction").notNull(),
  rebate87ALimit: integer("rebate_87a_limit").notNull(),
  deduction80CLimit: integer("deduction_80c_limit").notNull(),
  equityLtcgRate: doublePrecision("equity_ltcg_rate").notNull(),
  equityLtcgExemption: integer("equity_ltcg_exemption").notNull(),
  equityStcgRate: doublePrecision("equity_stcg_rate").notNull(),
  fdTdsThresholdGeneral: integer("fd_tds_threshold_general").notNull(),
  fdTdsThresholdSenior: integer("fd_tds_threshold_senior").notNull(),
  lifeInsuranceGstRate: doublePrecision("life_insurance_gst_rate").notNull().default(0),
  notes: text("notes"),
  editedByAdmin: boolean("edited_by_admin").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  details: jsonb("details"),
});
