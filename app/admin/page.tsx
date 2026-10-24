"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FreshnessBadge } from "@/components/freshness-badge";
import {
  Settings,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  History,
  TrendingUp,
  Percent,
  Building,
  Save,
  AlertTriangle,
  LogOut,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "macro" | "fd" | "smallSavings" | "taxConfig" | "hlvConfig" | "mfTer" | "crons" | "audit"
  >("macro");

  // Query admin data (automatically sends httpOnly cookie)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const res = await fetch("/api/admin");
      if (res.status === 403) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "ADMIN_DISABLED");
      }
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      if (!res.ok) throw new Error("Failed to load admin data");
      return res.json();
    },
    retry: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Invalid admin token");
      }

      setTokenInput("");
      await refetch();
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    queryClient.clear();
    refetch();
  };

  // Mutation to update rate
  const updateMutation = useMutation({
    mutationFn: async ({ type, id, updates }: { type: string; id: string; updates: any }) => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, updates }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update entity");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      queryClient.invalidateQueries({ queryKey: ["rates-master"] });
      alert("Rate updated successfully! Changes take effect immediately in the comparator.");
    },
    onError: (err: any) => {
      alert(`Error updating rate: ${err.message}`);
    },
  });

  // Cron trigger helper
  const [cronResult, setCronResult] = useState<string | null>(null);
  const triggerCron = async (endpoint: string) => {
    setCronResult("Triggering job...");
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setCronResult(JSON.stringify(json, null, 2));
      queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    } catch (err: any) {
      setCronResult(`Cron execution failed: ${err.message}`);
    }
  };

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <span>Loading governance console...</span>
      </div>
    );
  }

  // State 2: Admin Disabled (ADMIN_TOKEN missing in environment)
  const isTokenMissing = error?.message === "ADMIN_DISABLED" || error?.message?.includes("Admin disabled");
  if (isTokenMissing) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
            Admin Disabled
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Administrative access is strictly protected. Set{" "}
            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">
              ADMIN_TOKEN
            </code>{" "}
            in your Vercel Project Environment Variables to enable this console.
          </p>
        </div>
      </div>
    );
  }

  // State 3: Unauthenticated (Login Box)
  if (error?.message === "UNAUTHORIZED" || !data?.adminEnabled) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
            Admin Rate Governance Portal
          </h1>
          <p className="text-xs text-slate-500">
            Protected endpoint for verifying benchmark rates, AMFI TER disclosures, and tax configurations.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Admin Access Token
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter ADMIN_TOKEN"
              disabled={isLoggingIn}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {authError && (
            <div className="text-xs text-rose-500 font-medium">{authError}</div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Authenticate Session</span>
            )}
          </button>
        </form>
      </div>
    );
  }

  const isDbConnected = Boolean(data?.databaseConnected);

  return (
    <div className="w-full space-y-6">
      {/* DB Disconnected Warning Banner */}
      {!isDbConnected && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Database not connected, edits are disabled.</span>{" "}
            The application is operating in read-only verified static seed repository mode. Connect a Neon Postgres database to persist custom rate updates and audit logs.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Rate Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            NiveshLens Data Master
          </h1>
          <p className="text-xs text-slate-500">
            Database Mode: <strong>{data?.health?.databaseMode}</strong>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock / Logout</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        {[
          { key: "macro", label: "Macro Rates (RBI / MoSPI)" },
          { key: "fd", label: "Bank FD Rates" },
          { key: "smallSavings", label: "Small Savings (PPF / SCSS)" },
          { key: "taxConfig", label: "Tax Config (FY 24-25 / 25-26 / 26-27)" },
          { key: "hlvConfig", label: "HLV Multipliers Config" },
          { key: "mfTer", label: "AMFI TER Overrides" },
          { key: "crons", label: "Cron Job Triggers" },
          { key: "audit", label: "Audit Logs" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-2 rounded-xl font-bold transition-colors ${
              activeTab === tab.key
                ? "bg-navy-900 text-white dark:bg-emerald-500 dark:text-slate-950"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MACRO RATES */}
      {activeTab === "macro" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Macro Indicators Master
            </h3>
            <span className="text-xs text-slate-400">Updates sync directly with comparator models</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-2">Indicator Key</th>
                  <th className="pb-2">Display Name</th>
                  <th className="pb-2">Current Value</th>
                  <th className="pb-2">Source URL</th>
                  <th className="pb-2">Last Verified</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.macro?.map((m: any) => (
                  <tr key={m.indicator} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-emerald-600">{m.indicator}</td>
                    <td className="py-3">{m.name}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={m.value}
                        disabled={!isDbConnected}
                        id={`input-macro-${m.indicator}`}
                        className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                      />
                      <span className="ml-1 text-slate-400">{m.unit}</span>
                    </td>
                    <td className="py-3 text-slate-400 truncate max-w-xs">{m.sourceUrl}</td>
                    <td className="py-3 text-slate-400">{m.lastVerified}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={!isDbConnected || updateMutation.isPending}
                        onClick={() => {
                          const val = (document.getElementById(`input-macro-${m.indicator}`) as HTMLInputElement)?.value;
                          updateMutation.mutate({
                            type: "macro",
                            id: m.indicator,
                            updates: { value: parseFloat(val) },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 disabled:opacity-40"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BANK FD RATES */}
      {activeTab === "fd" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Bank Fixed Deposit Schedule
            </h3>
            <span className="text-xs text-slate-400">Quarterly compounding applied</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-2">Bank</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Bucket</th>
                  <th className="pb-2">General Rate %</th>
                  <th className="pb-2">Senior Rate %</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.fd?.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold">{f.bankName}</td>
                    <td className="py-3 text-slate-400">{f.category}</td>
                    <td className="py-3">{f.tenureBucket}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        step="0.05"
                        defaultValue={f.generalRatePct}
                        disabled={!isDbConnected}
                        id={`input-fd-gen-${f.id}`}
                        className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        step="0.05"
                        defaultValue={f.seniorRatePct}
                        disabled={!isDbConnected}
                        id={`input-fd-sen-${f.id}`}
                        className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={!isDbConnected || updateMutation.isPending}
                        onClick={() => {
                          const gen = (document.getElementById(`input-fd-gen-${f.id}`) as HTMLInputElement)?.value;
                          const sen = (document.getElementById(`input-fd-sen-${f.id}`) as HTMLInputElement)?.value;
                          updateMutation.mutate({
                            type: "fd",
                            id: f.id,
                            updates: {
                              generalRatePct: parseFloat(gen),
                              seniorRatePct: parseFloat(sen),
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 disabled:opacity-40"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SMALL SAVINGS */}
      {activeTab === "smallSavings" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Small Savings Schemes (DEA Ministry of Finance)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-2">Scheme</th>
                  <th className="pb-2">Notified Rate %</th>
                  <th className="pb-2">Lock-in</th>
                  <th className="pb-2">Annual Limit</th>
                  <th className="pb-2">Tax Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.smallSavings?.map((s: any) => (
                  <tr key={s.schemeCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold">{s.name} ({s.schemeCode})</td>
                    <td className="py-3">
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={s.notifiedRatePct}
                        disabled={!isDbConnected}
                        id={`input-ss-${s.schemeCode}`}
                        className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3">{s.lockInYears} yrs</td>
                    <td className="py-3 text-slate-400">{s.maxDepositPerYear ? `₹${s.maxDepositPerYear.toLocaleString("en-IN")}` : "No limit"}</td>
                    <td className="py-3 text-emerald-500 font-bold">{s.taxStatus}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={!isDbConnected || updateMutation.isPending}
                        onClick={() => {
                          const rate = (document.getElementById(`input-ss-${s.schemeCode}`) as HTMLInputElement)?.value;
                          updateMutation.mutate({
                            type: "smallSavings",
                            id: s.schemeCode,
                            updates: { notifiedRatePct: parseFloat(rate) },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 disabled:opacity-40"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TAX CONFIG */}
      {activeTab === "taxConfig" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Income Tax Act Parameters
            </h3>
            <span className="text-xs text-amber-500 font-medium">Verify with official CBDT gazette</span>
          </div>

          <div className="space-y-6">
            {Object.entries(data?.taxConfigs || {}).map(([key, cfg]: [string, any]) => (
              <div key={key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    FY {cfg.financialYear} ({cfg.regime} Regime)
                  </span>
                  <span className="text-[11px] text-slate-400">{cfg.notes}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Standard Deduction</label>
                    <input
                      type="number"
                      defaultValue={cfg.standardDeduction}
                      disabled={!isDbConnected}
                      id={`tax-sd-${key}`}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">87A Rebate Threshold</label>
                    <input
                      type="number"
                      defaultValue={cfg.rebate87ALimit}
                      disabled={!isDbConnected}
                      id={`tax-rebate-${key}`}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Equity LTCG Rate %</label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={cfg.equityLtcgRate}
                      disabled={!isDbConnected}
                      id={`tax-ltcg-${key}`}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">LTCG Exemption</label>
                    <input
                      type="number"
                      defaultValue={cfg.equityLtcgExemption}
                      disabled={!isDbConnected}
                      id={`tax-ltcg-exempt-${key}`}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!isDbConnected || updateMutation.isPending}
                    onClick={() => {
                      const sd = (document.getElementById(`tax-sd-${key}`) as HTMLInputElement)?.value;
                      const rebate = (document.getElementById(`tax-rebate-${key}`) as HTMLInputElement)?.value;
                      const ltcg = (document.getElementById(`tax-ltcg-${key}`) as HTMLInputElement)?.value;
                      const exempt = (document.getElementById(`tax-ltcg-exempt-${key}`) as HTMLInputElement)?.value;
                      updateMutation.mutate({
                        type: "taxConfig",
                        id: key,
                        updates: {
                          standardDeduction: parseInt(sd, 10),
                          rebate87ALimit: parseInt(rebate, 10),
                          equityLtcgRate: parseFloat(ltcg),
                          equityLtcgExemption: parseInt(exempt, 10),
                        },
                      });
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-40"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save FY {cfg.financialYear} Settings</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HLV CONFIG */}
      {activeTab === "hlvConfig" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Human Life Value (HLV) Age Multipliers
          </h3>
          <p className="text-xs text-slate-400">
            Rule of thumb multiplier formula: Baseline Coverage = Annual Income × Age Bracket Multiplier + (Dependents × Dependent Buffer)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
            <div>
              <label className="text-slate-400 block mb-1">Age ≤ 35 Multiplier</label>
              <input
                type="number"
                defaultValue={data?.hlvConfig?.ageUnder35Multiplier || 20}
                disabled={!isDbConnected}
                id="hlv-under35"
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Age 36–45 Multiplier</label>
              <input
                type="number"
                defaultValue={data?.hlvConfig?.age36to45Multiplier || 15}
                disabled={!isDbConnected}
                id="hlv-36to45"
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Age 46–55 Multiplier</label>
              <input
                type="number"
                defaultValue={data?.hlvConfig?.age46to55Multiplier || 10}
                disabled={!isDbConnected}
                id="hlv-46to55"
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Dependent Buffer</label>
              <input
                type="number"
                defaultValue={data?.hlvConfig?.perDependentBuffer || 500000}
                disabled={!isDbConnected}
                id="hlv-dependent"
                className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!isDbConnected || updateMutation.isPending}
              onClick={() => {
                const u35 = (document.getElementById("hlv-under35") as HTMLInputElement)?.value;
                const m36 = (document.getElementById("hlv-36to45") as HTMLInputElement)?.value;
                const m46 = (document.getElementById("hlv-46to55") as HTMLInputElement)?.value;
                const dep = (document.getElementById("hlv-dependent") as HTMLInputElement)?.value;
                updateMutation.mutate({
                  type: "hlvConfig",
                  id: "default",
                  updates: {
                    ageUnder35Multiplier: parseInt(u35, 10),
                    age36to45Multiplier: parseInt(m36, 10),
                    age46to55Multiplier: parseInt(m46, 10),
                    perDependentBuffer: parseInt(dep, 10),
                  },
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save HLV Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: CRON JOBS */}
      {activeTab === "crons" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Trigger Scheduled Refresh Jobs
          </h3>
          <p className="text-xs text-slate-400">
            Manually trigger Vercel Cron routes for live data refresh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: "Refresh Macro Indicators", path: "/api/cron/macro-refresh" },
              { name: "Verify Fixed Deposit Rates", path: "/api/cron/fd-verify" },
              { name: "Pre-warm AMFI NAV Cache", path: "/api/cron/mf-refresh" },
              { name: "Verify Small Savings Rates", path: "/api/cron/small-savings" },
            ].map((cron) => (
              <div key={cron.path} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold">{cron.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{cron.path}</div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerCron(cron.path)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold"
                >
                  Run Now
                </button>
              </div>
            ))}
          </div>

          {cronResult && (
            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto mt-4">
              {cronResult}
            </pre>
          )}
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Governance Audit Trail
          </h3>

          <div className="space-y-2 text-xs">
            {data?.auditLogs?.map((log: any) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                  <span className="text-slate-400 ml-2">by {log.actor}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  {new Date(log.timestamp).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
            {(!data?.auditLogs || data.auditLogs.length === 0) && (
              <div className="text-slate-400 py-4 text-center">No modification logs yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
