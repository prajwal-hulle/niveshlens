import React from "react";
import Link from "next/link";
import { Scale, AlertTriangle, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-surface-muted text-text-muted border-t border-border text-xs transition-colors">
      {/* 2-line SEBI Regulatory Notice Card inside shared container */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="my-6 rounded-xl bg-surface border border-border border-l-4 border-l-amber-500 p-3.5 text-xs text-text-muted shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-text font-medium">Regulatory notice:</strong> NiveshLens is an independent financial education tool, not a SEBI-registered investment advisor or insurance intermediary.
            Return projections, tax models, and trade-off flags are illustrative. Verify details in official scheme documents before investing.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-10 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-text text-base">NiveshLens</span>
            </div>
            <p className="text-text-muted text-xs leading-relaxed">
              &quot;See what your investment hides.&quot; Unbiased, mathematical comparison of Fixed Deposits, PPF, Mutual Funds, and LIC policies.
            </p>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="font-semibold text-text mb-3 text-sm">Calculators</h4>
            <ul className="space-y-2 text-text-muted">
              <li>
                <Link href="/compare" className="hover:text-primary transition-colors">
                  Comparator
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Risk profile
                </Link>
              </li>
              <li>
                <Link href="/btir" className="hover:text-primary transition-colors">
                  Term + invest
                </Link>
              </li>
              <li>
                <Link href="/goal" className="hover:text-primary transition-colors">
                  Goal planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Asset Classes */}
          <div>
            <h4 className="font-semibold text-text mb-3 text-sm">Instruments</h4>
            <ul className="space-y-2 text-text-muted">
              <li>
                <Link href="/fd" className="hover:text-primary transition-colors">
                  Fixed Deposits
                </Link>
              </li>
              <li>
                <Link href="/ppf" className="hover:text-primary transition-colors">
                  Public Provident Fund
                </Link>
              </li>
              <li>
                <Link href="/mf/122639" className="hover:text-primary transition-colors">
                  Mutual Funds
                </Link>
              </li>
              <li>
                <Link href="/lic/lic-jeevan-labh-936" className="hover:text-primary transition-colors">
                  LIC Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Verifiable Data Sources */}
          <div>
            <h4 className="font-semibold text-text mb-3 text-sm">Data sources</h4>
            <ul className="space-y-2 text-text-muted text-xs">
              <li>
                <a
                  href="https://www.rbi.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span>Reserve Bank of India (RBI)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.amfiindia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span>Association of Mutual Funds in India (AMFI)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://mospi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span>Ministry of Statistics (MoSPI)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://dea.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span>Ministry of Finance</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted">
          <div>
            © {new Date().getFullYear()} NiveshLens. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="hover:text-text transition-colors">
              Learn
            </Link>
            <Link href="/admin" className="hover:text-text transition-colors text-xs text-text-muted/60">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
