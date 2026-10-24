import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import { DEFAULT_TAX_CONFIGS, TaxConfigModel } from "../finance/tax";
import { DEFAULT_HLV_CONFIG, HlvConfigModel } from "../finance/insurance";
import { seedDatabase } from "./seed-data";
import { isSupabaseConfigured } from "../supabase/client";

// Statically import verified seed datasets (No runtime fs calls, 100% Vercel & Edge safe)
import macroSeedRaw from "../../data/seed/macro.json";
import fdSeedRaw from "../../data/seed/fd_rates.json";
import smallSavingsSeedRaw from "../../data/seed/small_savings.json";
import insuranceSeedRaw from "../../data/seed/insurance_plans.json";
import mfTerSeedRaw from "../../data/seed/mf_ter.json";

// In-Memory fallback store with deep clone of static verified seeds
class RepositoryStore {
  macroRates = JSON.parse(JSON.stringify(macroSeedRaw));
  fdRates = JSON.parse(JSON.stringify(fdSeedRaw));
  smallSavings = JSON.parse(JSON.stringify(smallSavingsSeedRaw));
  insurancePlans = JSON.parse(JSON.stringify(insuranceSeedRaw));
  mfTer = JSON.parse(JSON.stringify(mfTerSeedRaw));
  taxConfigs: Record<string, TaxConfigModel> = JSON.parse(JSON.stringify(DEFAULT_TAX_CONFIGS));
  hlvConfig: HlvConfigModel = JSON.parse(JSON.stringify(DEFAULT_HLV_CONFIG));
  auditLogs: Array<{ id: number; timestamp: string; action: string; actor: string; details: any }> = [];
  lastRefreshedAt: Record<string, string> = {
    macro: new Date().toISOString(),
    fd: new Date().toISOString(),
    smallSavings: new Date().toISOString(),
    insurance: new Date().toISOString(),
    mfTer: new Date().toISOString(),
    taxConfig: new Date().toISOString(),
    hlv: new Date().toISOString(),
  };
}

// Global singleton in development/production for in-memory persistence
const globalForStore = globalThis as unknown as { appStore?: RepositoryStore };
export const memoryStore = globalForStore.appStore || new RepositoryStore();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = memoryStore;

// Database connection URL: accept DATABASE_URL, falling back to POSTGRES_URL / POSTGRES_URL_NON_POOLING
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let dbClient: ReturnType<typeof drizzle> | null = null;

if (databaseUrl && databaseUrl.trim() !== "") {
  try {
    const sqlClient = neon(databaseUrl);
    dbClient = drizzle(sqlClient, { schema });
  } catch (err) {
    console.warn("Failed to initialize Neon Postgres client. Operating with verified static seed repository.", err);
  }
}

export const db = dbClient;

/**
 * Runtime safety net:
 * Guarded by a module-level promise so it runs at most once on first request.
 * If tables are empty or missing, seeds them once.
 * If DB is unreachable, falls back to static seed.
 */
let dbInitPromise: Promise<void> | null = null;
let isDbHealthy = false;

export async function ensureDbInitialized(): Promise<boolean> {
  if (!db) {
    isDbHealthy = false;
    return false;
  }

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        const rows = await db.select().from(schema.macroRates).limit(1);
        if (!rows || rows.length === 0) {
          console.log("Database tables empty. Seeding tables at runtime...");
          await seedDatabase(db);
        }
        isDbHealthy = true;
      } catch (err) {
        console.warn("Neon Postgres safety check failed; falling back to static seed repository:", err);
        isDbHealthy = false;
      }
    })();
  }

  await dbInitPromise;
  return isDbHealthy;
}

/**
 * High-level data accessor functions: DB first, static seed fallback
 */

export async function getMacroRates() {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.macroRates);
        if (rows && rows.length > 0) return rows;
      }
    } catch {
      // Fall back to memoryStore
    }
  }
  return memoryStore.macroRates;
}

export async function getMacroRate(indicator: string): Promise<number> {
  const rates = await getMacroRates();
  const match = rates.find((r: any) => r.indicator === indicator);
  return match ? match.value : indicator === "repo_rate" ? 6.5 : 5.0;
}

export async function getFdRates() {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.fdRates);
        if (rows && rows.length > 0) return rows;
      }
    } catch {
      // Fall back to memoryStore
    }
  }
  return memoryStore.fdRates;
}

export async function getSmallSavingsRates() {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.smallSavingsRates);
        if (rows && rows.length > 0) return rows;
      }
    } catch {
      // Fall back to memoryStore
    }
  }
  return memoryStore.smallSavings;
}

export async function getInsurancePlans() {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.insurancePlans);
        if (rows && rows.length > 0) return rows;
      }
    } catch {
      // Fall back to memoryStore
    }
  }
  return memoryStore.insurancePlans;
}

export async function getMfExpenseRatios() {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.mfExpenseRatios);
        if (rows && rows.length > 0) return rows;
      }
    } catch {
      // Fall back to memoryStore
    }
  }
  return memoryStore.mfTer;
}

export async function getMfTerBySchemeCode(schemeCode: number | string): Promise<{
  terPct: number | null;
  sourceName?: string;
  sourceUrl?: string;
  lastVerified?: string;
}> {
  const codeNum = Number(schemeCode);
  const ters = await getMfExpenseRatios();
  const found = ters.find((t: any) => Number(t.schemeCode) === codeNum);
  if (!found) {
    return { terPct: null }; // "TER unavailable" - never estimate
  }
  return {
    terPct: found.terPct,
    sourceName: found.sourceName,
    sourceUrl: found.sourceUrl,
    lastVerified: found.lastVerified,
  };
}

export async function getTaxConfig(
  financialYear: "2024-25" | "2025-26" | "2026-27" = "2024-25",
  regime: "NEW" | "OLD" = "NEW"
): Promise<TaxConfigModel> {
  const key = `${financialYear}-${regime}`;
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.taxConfig).where(eq(schema.taxConfig.id, key));
        const match = rows[0];
        if (match) {
          return {
            financialYear: match.financialYear as any,
            regime: match.regime as any,
            slabs: match.slabsJson as any,
            standardDeduction: match.standardDeduction,
            rebate87ALimit: match.rebate87ALimit,
            deduction80CLimit: match.deduction80CLimit,
            equityLtcgRate: match.equityLtcgRate,
            equityLtcgExemption: match.equityLtcgExemption,
            equityStcgRate: match.equityStcgRate,
            fdTdsThresholdGeneral: match.fdTdsThresholdGeneral,
            fdTdsThresholdSenior: match.fdTdsThresholdSenior,
            lifeInsuranceGstRate: match.lifeInsuranceGstRate,
            notes: match.notes || "",
          };
        }
      }
    } catch {
      // Fall back to memoryStore
    }
  }

  return (
    memoryStore.taxConfigs[key] ||
    memoryStore.taxConfigs["2024-25-NEW"] ||
    DEFAULT_TAX_CONFIGS["2024-25-NEW"]
  );
}

export async function getAllTaxConfigs(): Promise<Record<string, TaxConfigModel>> {
  if (db) {
    try {
      await ensureDbInitialized();
      if (isDbHealthy) {
        const rows = await db.select().from(schema.taxConfig);
        if (rows && rows.length > 0) {
          const map: Record<string, TaxConfigModel> = {};
          for (const match of rows) {
            map[match.id] = {
              financialYear: match.financialYear as any,
              regime: match.regime as any,
              slabs: match.slabsJson as any,
              standardDeduction: match.standardDeduction,
              rebate87ALimit: match.rebate87ALimit,
              deduction80CLimit: match.deduction80CLimit,
              equityLtcgRate: match.equityLtcgRate,
              equityLtcgExemption: match.equityLtcgExemption,
              equityStcgRate: match.equityStcgRate,
              fdTdsThresholdGeneral: match.fdTdsThresholdGeneral,
              fdTdsThresholdSenior: match.fdTdsThresholdSenior,
              lifeInsuranceGstRate: match.lifeInsuranceGstRate,
              notes: match.notes || "",
            };
          }
          return map;
        }
      }
    } catch {
      // Fall back
    }
  }
  return memoryStore.taxConfigs;
}

export async function getHlvConfig(): Promise<HlvConfigModel> {
  return memoryStore.hlvConfig || DEFAULT_HLV_CONFIG;
}

export async function updateHlvConfigRecord(updates: Partial<HlvConfigModel>, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }
  memoryStore.hlvConfig = {
    ...memoryStore.hlvConfig,
    ...updates,
  };
  memoryStore.lastRefreshedAt.hlv = new Date().toISOString();

  await db.insert(schema.auditLogs).values({
    action: "UPDATE_HLV_CONFIG",
    actor,
    details: updates,
  });

  return { success: true };
}

/**
 * Mutation handlers used by /admin and cron endpoints.
 * Rule: Writes (/admin, audit logs) go to DB only. If no DB, reject edit.
 */

export async function updateMacroRateRecord(indicator: string, updates: Partial<any>, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }

  const today = new Date().toISOString().split("T")[0];
  const setValues: any = {
    ...updates,
    editedByAdmin: true,
    lastVerified: today,
    updatedAt: new Date(),
  };

  await db
    .update(schema.macroRates)
    .set(setValues)
    .where(eq(schema.macroRates.indicator, indicator));

  await db.insert(schema.auditLogs).values({
    action: `UPDATE_MACRO_RATE:${indicator}`,
    actor,
    details: updates,
  });

  // Mirror in memoryStore
  const idx = memoryStore.macroRates.findIndex((m: any) => m.indicator === indicator);
  if (idx !== -1) {
    memoryStore.macroRates[idx] = {
      ...memoryStore.macroRates[idx],
      ...updates,
      lastVerified: today,
    };
    memoryStore.lastRefreshedAt.macro = new Date().toISOString();
  }

  return { success: true };
}

export async function updateFdRateRecord(id: string, updates: Partial<any>, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }

  const today = new Date().toISOString().split("T")[0];
  const setValues: any = {
    ...updates,
    editedByAdmin: true,
    lastVerified: today,
    updatedAt: new Date(),
  };

  await db.update(schema.fdRates).set(setValues).where(eq(schema.fdRates.id, id));

  await db.insert(schema.auditLogs).values({
    action: `UPDATE_FD_RATE:${id}`,
    actor,
    details: updates,
  });

  const idx = memoryStore.fdRates.findIndex((f: any) => f.id === id);
  if (idx !== -1) {
    memoryStore.fdRates[idx] = {
      ...memoryStore.fdRates[idx],
      ...updates,
      lastVerified: today,
    };
    memoryStore.lastRefreshedAt.fd = new Date().toISOString();
  }

  return { success: true };
}

export async function updateSmallSavingsRecord(schemeCode: string, updates: Partial<any>, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }

  const today = new Date().toISOString().split("T")[0];
  const setValues: any = {
    ...updates,
    editedByAdmin: true,
    lastVerified: today,
    updatedAt: new Date(),
  };

  await db
    .update(schema.smallSavingsRates)
    .set(setValues)
    .where(eq(schema.smallSavingsRates.schemeCode, schemeCode));

  await db.insert(schema.auditLogs).values({
    action: `UPDATE_SMALL_SAVINGS:${schemeCode}`,
    actor,
    details: updates,
  });

  const idx = memoryStore.smallSavings.findIndex((s: any) => s.schemeCode === schemeCode);
  if (idx !== -1) {
    memoryStore.smallSavings[idx] = {
      ...memoryStore.smallSavings[idx],
      ...updates,
      lastVerified: today,
    };
    memoryStore.lastRefreshedAt.smallSavings = new Date().toISOString();
  }

  return { success: true };
}

export async function updateTaxConfigRecord(id: string, updates: Partial<TaxConfigModel>, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }

  const setValues: any = {
    editedByAdmin: true,
    updatedAt: new Date(),
  };
  if (updates.standardDeduction !== undefined) setValues.standardDeduction = updates.standardDeduction;
  if (updates.rebate87ALimit !== undefined) setValues.rebate87ALimit = updates.rebate87ALimit;
  if (updates.deduction80CLimit !== undefined) setValues.deduction80CLimit = updates.deduction80CLimit;
  if (updates.equityLtcgRate !== undefined) setValues.equityLtcgRate = updates.equityLtcgRate;
  if (updates.equityLtcgExemption !== undefined) setValues.equityLtcgExemption = updates.equityLtcgExemption;
  if (updates.equityStcgRate !== undefined) setValues.equityStcgRate = updates.equityStcgRate;
  if (updates.fdTdsThresholdGeneral !== undefined) setValues.fdTdsThresholdGeneral = updates.fdTdsThresholdGeneral;
  if (updates.fdTdsThresholdSenior !== undefined) setValues.fdTdsThresholdSenior = updates.fdTdsThresholdSenior;
  if (updates.lifeInsuranceGstRate !== undefined) setValues.lifeInsuranceGstRate = updates.lifeInsuranceGstRate;
  if (updates.notes !== undefined) setValues.notes = updates.notes;
  if (updates.slabs !== undefined) setValues.slabsJson = updates.slabs;

  await db.update(schema.taxConfig).set(setValues).where(eq(schema.taxConfig.id, id));

  await db.insert(schema.auditLogs).values({
    action: `UPDATE_TAX_CONFIG:${id}`,
    actor,
    details: updates,
  });

  if (memoryStore.taxConfigs[id]) {
    memoryStore.taxConfigs[id] = {
      ...memoryStore.taxConfigs[id],
      ...updates,
    };
    memoryStore.lastRefreshedAt.taxConfig = new Date().toISOString();
  }

  return { success: true };
}

export async function updateMfTerRecord(schemeCode: number, terPct: number, actor = "admin") {
  if (!db) {
    throw new Error("Database not connected, edits are disabled");
  }

  const today = new Date().toISOString().split("T")[0];
  await db
    .update(schema.mfExpenseRatios)
    .set({
      terPct,
      editedByAdmin: true,
      lastVerified: today,
      updatedAt: new Date(),
    })
    .where(eq(schema.mfExpenseRatios.schemeCode, schemeCode));

  await db.insert(schema.auditLogs).values({
    action: `UPDATE_MF_TER:${schemeCode}`,
    actor,
    details: { terPct },
  });

  const idx = memoryStore.mfTer.findIndex((m: any) => Number(m.schemeCode) === schemeCode);
  if (idx !== -1) {
    memoryStore.mfTer[idx].terPct = terPct;
    memoryStore.mfTer[idx].lastVerified = today;
  }
  memoryStore.lastRefreshedAt.mfTer = new Date().toISOString();

  return { success: true };
}

export async function getAuditLogs() {
  if (db) {
    try {
      const logs = await db
        .select()
        .from(schema.auditLogs)
        .orderBy(sql`${schema.auditLogs.id} DESC`)
        .limit(50);
      if (logs && logs.length > 0) {
        return logs.map((l) => ({
          id: l.id,
          timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
          action: l.action,
          actor: l.actor,
          details: l.details,
        }));
      }
    } catch {
      // Fall back
    }
  }
  return memoryStore.auditLogs.slice(0, 50);
}

export function isDatabaseConnected(): boolean {
  return db !== null;
}

export function getDatasetHealth() {
  const connected = db !== null && isDbHealthy;
  return {
    databaseConnected: connected,
    databaseMode: connected ? "Connected" : "Static seed",
    usingSeedData: !connected,
    authConfigured: isSupabaseConfigured(),
    lastRefreshedAt: memoryStore.lastRefreshedAt,
    recordCounts: {
      macroRates: memoryStore.macroRates.length,
      fdRates: memoryStore.fdRates.length,
      smallSavings: memoryStore.smallSavings.length,
      insurancePlans: memoryStore.insurancePlans.length,
      mfTer: memoryStore.mfTer.length,
      taxConfigs: Object.keys(memoryStore.taxConfigs).length,
    },
  };
}
