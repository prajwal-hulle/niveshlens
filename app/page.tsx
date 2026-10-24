import React from "react";
import Link from "next/link";
import { LiveTicker } from "@/components/ticker";
import {
  Scale,
  ShieldAlert,
  Compass,
  Target,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full space-y-12">
      {/* Top Live Rates Ticker */}
      <LiveTicker />

      {/* Hero Section */}
      <section className="w-full pt-4 sm:pt-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Eye className="w-4 h-4 text-emerald-500" />
          <span>Compare FD · PPF · Mutual Funds · LIC</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto font-heading">
          See What Your Investment{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            Hides.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          See how returns, charges, lock-ins and insurance gaps change what you actually earn.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/compare"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-navy-900 to-emerald-700 dark:from-emerald-600 dark:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Scale className="w-4 h-4" />
            <span>Launch Scheme Comparator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/profile"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>Take 2-Min Investor Profiler</span>
          </Link>
        </div>

        {/* Zero-Fake Data Pledge */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Zero sponsored schemes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Live AMFI NAV & TER data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Verifiable RBI & MoF sources</span>
          </div>
        </div>
      </section>

      {/* Feature Matrix / How It Works */}
      <section className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            How NiveshLens Unveils Truth
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Traditional calculators hide inflation, tax brackets, and exit loads. We put them front and center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Fisher Equation Real Returns
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When taxes and inflation outpace nominal interest, your savings quietly lose purchasing power over time. We calculate exact real post-tax returns using live economic data.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              The Endowment Surrender Trap
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional insurance agents promise &quot;guaranteed returns + life cover&quot;. We compute the exact mathematical IRR (often 4.5%–5.5%) and demonstrate the power of Buy Term + Invest Difference.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Empirical Rolling Scenarios
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Never invent a 12% linear return. Our engine calculates 10th percentile (pessimistic), 50th percentile (median), and 90th percentile (optimistic) rolling returns directly from live NAV history.
            </p>
          </div>
        </div>
      </section>

      {/* Four Asset Pillars Section */}
      <section className="w-full">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-navy-900 to-slate-900 text-white space-y-8 shadow-xl">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Unbiased Multi-Asset Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
              Comparing India&apos;s Core Wealth Vehicles
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select any combination to see how they stack against each other in real post-tax corpus, liquidity, and charges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/fd"
              className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500 transition-colors space-y-2 group"
            >
              <div className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>Fixed Deposits (FD)</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400">
                Compare Public, Private, SFBs & Post Office TD rates, quarterly compounding & TDS limits.
              </p>
            </Link>

            <Link
              href="/ppf"
              className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500 transition-colors space-y-2 group"
            >
              <div className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>Public Provident Fund (PPF)</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400">
                15-year statutory lock-in, ₹1.5L annual cap, EEE tax status, and year-7 partial withdrawal rules.
              </p>
            </Link>

            <Link
              href="/mf/122639"
              className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500 transition-colors space-y-2 group"
            >
              <div className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>Mutual Funds</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400">
                Search 40k+ AMFI schemes. Rolling returns, volatility, max drawdown, and AMFI TER disclosure.
              </p>
            </Link>

            <Link
              href="/lic/lic-jeevan-labh-936"
              className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500 transition-colors space-y-2 group"
            >
              <div className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                <span>LIC Traditional Policies</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400">
                Endowment & whole-life cash flow modeling, surrender factor lookup, and true mathematical IRR.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
