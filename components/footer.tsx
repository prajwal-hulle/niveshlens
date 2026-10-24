import React from "react";
import Link from "next/link";
import { Scale, Shield, AlertTriangle, ExternalLink, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      {/* Compact SEBI Regulatory Notice Card inside shared container (no empty gap, my-8, amber border-left) */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="my-8 rounded-2xl bg-slate-950/70 border border-slate-800 border-l-4 border-l-amber-500 p-4 text-xs text-slate-300 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-400">Regulatory Disclaimer:</strong> NiveshLens is an independent financial education tool and not a SEBI-registered adviser or insurance intermediary.
            All return projections, XIRR calculations, tax estimations, and trade-off flags are illustrative; verify figures with official scheme documents before investing.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-white text-base">NiveshLens</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              &quot;See what your investment hides.&quot; Unbiased, mathematical comparison of Indian Fixed Deposits, PPF, Mutual Funds, and LIC policies.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Independent & Transparent Financial Modeling</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Decision Engines</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/compare" className="hover:text-emerald-400 transition-colors">
                  Multi-Scheme Comparator
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-emerald-400 transition-colors">
                  Investor Risk Profiler
                </Link>
              </li>
              <li>
                <Link href="/btir" className="hover:text-emerald-400 transition-colors">
                  Buy Term + Invest Difference
                </Link>
              </li>
              <li>
                <Link href="/goal" className="hover:text-emerald-400 transition-colors">
                  SIP Goal Corpus Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Scheme Explorers */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Asset Classes</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/fd" className="hover:text-emerald-400 transition-colors">
                  Fixed Deposit Rates (Bank vs PO)
                </Link>
              </li>
              <li>
                <Link href="/ppf" className="hover:text-emerald-400 transition-colors">
                  Public Provident Fund (PPF) Rules
                </Link>
              </li>
              <li>
                <Link href="/mf/122639" className="hover:text-emerald-400 transition-colors">
                  Mutual Fund NAV & Drawdown Analyzer
                </Link>
              </li>
              <li>
                <Link href="/lic/lic-jeevan-labh-936" className="hover:text-emerald-400 transition-colors">
                  LIC Endowment Cash Flow & IRR
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Verifiable Data Sources */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Traceable Data Sources</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <a
                  href="https://www.rbi.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>RBI Policy Rates</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://api.mfapi.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>api.mfapi.in (Open MF API)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.amfiindia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>AMFI India (TER Disclosures)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://mospi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>MoSPI CPI Inflation Data</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://dea.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>Ministry of Finance (Small Savings)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} NiveshLens. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="hover:text-slate-300">
              Glossary
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
