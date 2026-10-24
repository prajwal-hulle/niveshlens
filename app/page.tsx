import React from "react";
import Link from "next/link";
import { LiveTicker } from "@/components/ticker";
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Percent,
  Shield,
  TrendingUp,
  Target,
  Landmark,
  ShieldAlert,
} from "lucide-react";

export default function HomePage() {
  const scenarios = [
    {
      title: "Save tax",
      href: "/compare?preset=tax-saving&i=ppf,fd:sbi-5y,mf:119598&horizon=5&regime=OLD",
      icon: Percent,
      desc: "Compare Section 80C options: PPF, tax-saver ELSS fund, and 5-year bank FD.",
    },
    {
      title: "Build an emergency fund",
      href: "/compare?preset=emergency&i=fd:sbi-1y&horizon=1&mode=LUMPSUM&amount=100000",
      icon: Shield,
      desc: "High liquidity and safety with minimal early exit penalties.",
    },
    {
      title: "Grow money for 10+ years",
      href: "/compare?preset=growth&i=mf:122639,ppf&horizon=10",
      icon: TrendingUp,
      desc: "Long-term compounding to outpace inflation with equity funds and PPF.",
    },
    {
      title: "Plan for a child's education",
      href: "/compare?preset=child-education&i=mf:122639,ppf&horizon=12",
      icon: Target,
      desc: "Medium horizon goal balancing growth with capital protection.",
    },
    {
      title: "Retirement income",
      href: "/compare?preset=retirement&i=ppf,mf:122639,fd:sbi-5y&horizon=15",
      icon: Landmark,
      desc: "Stable corpus accumulation combining sovereign safety and regular growth.",
    },
    {
      title: "Check my LIC policy",
      href: "/btir",
      icon: ShieldAlert,
      desc: "Compare an endowment policy against buying pure term cover and investing the difference.",
    },
  ];

  return (
    <div className="w-full space-y-10">
      {/* Top Live Rates Ticker */}
      <LiveTicker />

      {/* Hero Section */}
      <section className="w-full pt-2 sm:pt-4 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <span>Compare FD, PPF, Mutual Funds and LIC</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold text-text tracking-tight max-w-3xl mx-auto leading-tight">
          See what your investment hides
        </h1>

        <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
          See how returns, charges, lock-ins, and tax drag change what you actually take home.
        </p>

        {/* 1 Line of Trust Ticks */}
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

      {/* What do you want to do? - 6 Scenario Cards */}
      <section className="w-full space-y-4 pt-2">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold text-text tracking-tight">
            What do you want to do?
          </h2>
          <p className="text-xs text-text-muted">
            Choose a common scenario to launch a live comparison in one click.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.title}
                href={s.href}
                className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm text-text group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{s.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Explore asset classes directly */}
      <section className="w-full space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Explore asset classes
          </h3>
          <Link href="/compare" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            <span>Custom comparator</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            href="/fd"
            className="p-3.5 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors"
          >
            <div className="font-medium text-text">Fixed Deposits</div>
            <div className="text-[11px] text-text-muted mt-0.5">Bank rates &amp; DICGC limits</div>
          </Link>

          <Link
            href="/ppf"
            className="p-3.5 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors"
          >
            <div className="font-medium text-text">PPF Scheme</div>
            <div className="text-[11px] text-text-muted mt-0.5">7.1% EEE statutory rules</div>
          </Link>

          <Link
            href="/mf/122639"
            className="p-3.5 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors"
          >
            <div className="font-medium text-text">Mutual Funds</div>
            <div className="text-[11px] text-text-muted mt-0.5">Rolling returns &amp; TER</div>
          </Link>

          <Link
            href="/lic/lic-jeevan-labh-936"
            className="p-3.5 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors"
          >
            <div className="font-medium text-text">LIC Policies</div>
            <div className="text-[11px] text-text-muted mt-0.5">Endowment cash flows &amp; IRR</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
