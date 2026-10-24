"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatINR as baseFormatINR } from "@/lib/utils";

interface CurrencyContextType {
  compact: boolean;
  toggleCompact: () => void;
  format: (amount: number | null | undefined, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  compact: false,
  toggleCompact: () => {},
  format: (val) => baseFormatINR(val),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);

  const toggleCompact = () => setCompact((prev) => !prev);

  const format = (amount: number | null | undefined, decimals: number = 2) => {
    return baseFormatINR(amount, { compact, decimals });
  };

  return (
    <CurrencyContext.Provider value={{ compact, toggleCompact, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
