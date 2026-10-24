"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, ArrowRight } from "lucide-react";
import { useCompareSelection } from "./selection-context";

export function FloatingComparePill() {
  const pathname = usePathname();
  const { selected, serializedParam } = useCompareSelection();

  if (selected.length === 0 || pathname === "/compare") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Link
        href={`/compare${serializedParam ? `?i=${serializedParam}` : ""}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-xs font-semibold shadow-lg hover:bg-primary-hover hover:shadow-xl transition-all"
      >
        <Scale className="w-3.5 h-3.5" />
        <span>Compare ({selected.length})</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
