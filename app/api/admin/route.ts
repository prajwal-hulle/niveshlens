import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedAdmin, isAdminConfigured } from "@/lib/auth";
import {
  getMacroRates,
  getFdRates,
  getSmallSavingsRates,
  getInsurancePlans,
  getMfExpenseRatios,
  getAllTaxConfigs,
  getAuditLogs,
  getDatasetHealth,
  isDatabaseConnected,
  updateMacroRateRecord,
  updateFdRateRecord,
  updateSmallSavingsRecord,
  updateTaxConfigRecord,
  updateMfTerRecord,
  getHlvConfig,
  updateHlvConfigRecord,
} from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { adminEnabled: false, error: "Admin disabled: set ADMIN_TOKEN in Vercel" },
      { status: 403 }
    );
  }

  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { adminEnabled: true, error: "Unauthorized. Valid ADMIN_TOKEN required." },
      { status: 401 }
    );
  }

  const [macro, fd, smallSavings, insurance, mfTer, taxConfigs, hlvConfig, auditLogs] = await Promise.all([
    getMacroRates(),
    getFdRates(),
    getSmallSavingsRates(),
    getInsurancePlans(),
    getMfExpenseRatios(),
    getAllTaxConfigs(),
    getHlvConfig(),
    getAuditLogs(),
  ]);

  return NextResponse.json({
    adminEnabled: true,
    databaseConnected: isDatabaseConnected(),
    macro,
    fd,
    smallSavings,
    insurance,
    mfTer,
    taxConfigs,
    hlvConfig,
    auditLogs,
    health: getDatasetHealth(),
  });
}

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin disabled: set ADMIN_TOKEN in Vercel" },
      { status: 403 }
    );
  }

  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Valid ADMIN_TOKEN required." },
      { status: 401 }
    );
  }

  if (!isDatabaseConnected()) {
    return NextResponse.json(
      { error: "Database not connected, edits are disabled" },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, id, updates } = body;
  if (!type || !updates) {
    return NextResponse.json({ error: "Missing type or updates payload" }, { status: 400 });
  }

  try {
    switch (type) {
      case "macro":
        await updateMacroRateRecord(id, updates, "admin-ui");
        break;
      case "fd":
        await updateFdRateRecord(id, updates, "admin-ui");
        break;
      case "smallSavings":
        await updateSmallSavingsRecord(id, updates, "admin-ui");
        break;
      case "taxConfig":
        await updateTaxConfigRecord(id, updates, "admin-ui");
        break;
      case "mfTer":
        await updateMfTerRecord(Number(id), updates.terPct, "admin-ui");
        break;
      case "hlvConfig":
        await updateHlvConfigRecord(updates, "admin-ui");
        break;
      default:
        return NextResponse.json({ error: `Unknown entity type: ${type}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update record" }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/fd");
  revalidatePath("/ppf");
  revalidatePath("/compare");

  return NextResponse.json({ success: true, message: `Successfully updated ${type}:${id}` });
}
