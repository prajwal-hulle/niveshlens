import React from "react";
import Link from "next/link";
import { LiveTicker } from "@/components/ticker";
import {
  Scale,
  Compass,
  ArrowRight,
  CheckCircle2,
  Percent,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full space-y-12">
      {/* Top Live Rates Ticker */}
      <LiveTicker />

      {/* Hero Section */}
      <section className="w-full pt-4 sm:pt-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <span>Compare FD, PPF, Mutual Funds and LIC</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold text-text tracking-tight max-w-3xl mx-auto leading-tight">
          See what your investment hides
        </h1>

        <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
          See how returns, charges, lock-ins and insurance gaps change what you actually take home.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/compare"
            className="w-full sm:w-auto h-11 px-6 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Scale className="w-4 h-4" />
            <span>Compare schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/profile"
            className="w-full sm:w-auto h-11 px-6 rounded-lg border border-border bg-surface text-text font-medium text-sm hover:bg-surface-muted transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-text-muted" />
            <span>Investor profile</span>
          </Link>
        </div>

        {/* 3 Trust Ticks */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Zero sponsored schemes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Live AMFI NAV &amp; TER data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Verifiable RBI &amp; MoF sources</span>
          </div>
        </div>
      </section>

      {/* 3 Pillar Cards */}
      <section className="w-full space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-3 transition-colors">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-text">
                Real returns
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                See what you keep after tax and inflation, computed with the exact Fisher relation instead of rough estimates.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-3 transition-colors">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-text">
                Insurance vs term plus invest
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Compare an endowment policy with term cover plus investing the rest. True mathematical IRR reveals the trade-off.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-3 transition-colors">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-text">
                Realistic outcomes
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Low, middle and high cases from a fund&apos;s own history. No fabricated linear 12% compounding assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you can compare - 4-card grid (clean cards, light in light theme) */}
      <section className="w-full space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text">
            Compare across four asset classes
          </h2>
          <p className="text-xs text-text-muted">
            Inspect rules, tax slabs, lock-in periods, and underlying costs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/fd"
            className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors space-y-2 group"
          >
            <div className="font-medium text-sm text-text group-hover:text-primary flex items-center justify-between">
              <span>Fixed Deposits</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Bank vs Post Office rates, quarterly compounding, and tax deducted at source thresholds.
            </p>
          </Link>

          <Link
            href="/ppf"
            className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors space-y-2 group"
          >
            <div className="font-medium text-sm text-text group-hover:text-primary flex items-center justify-between">
              <span>Public Provident Fund</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              15-year tenure, ₹1.5L annual cap, sovereign guarantee, and partial withdrawal guidelines.
            </p>
          </Link>

          <Link
            href="/mf/122639"
            className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors space-y-2 group"
          >
            <div className="font-medium text-sm text-text group-hover:text-primary flex items-center justify-between">
              <span>Mutual Funds</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Rolling return percentiles, volatility, drawdown history, and AMFI total expense ratio disclosure.
            </p>
          </Link>

          <Link
            href="/lic/lic-jeevan-labh-936"
            className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors space-y-2 group"
          >
            <div className="font-medium text-sm text-text group-hover:text-primary flex items-center justify-between">
              <span>LIC Policies</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Endowment cash flow modeling, surrender factor lookups, and calculated internal rate of return.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
