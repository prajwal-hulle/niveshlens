/**
 * 4 colorblind-safe colors assigned by instrument selection order (Okabe-Ito / Tol inspired)
 * Used identically across instrument chips, summary cards, and all comparison charts.
 */
export const CHART_COLORS = [
  "#059669", // Emerald / Teal (Instrument 1)
  "#2563EB", // Strong Blue (Instrument 2)
  "#D97706", // Amber / Warm Orange (Instrument 3)
  "#7C3AED", // Violet / Purple (Instrument 4)
];

export const CHART_COLORS_DARK = [
  "#10B981", // Emerald 500
  "#3B82F6", // Blue 500
  "#F59E0B", // Amber 500
  "#8B5CF6", // Purple 500
];

export function getInstrumentColor(index: number, isDark = false): string {
  const palette = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  return palette[index % palette.length];
}

/**
 * Returns clean, human-readable short labels for charts, legends, and summary cards.
 * Full official titles stay in table headers, details modals, and tooltips.
 */
export function getShortInstrumentName(fullName: string | null | undefined, type?: string): string {
  if (!fullName) return "Instrument";
  const str = fullName.trim();

  // Mutual Funds
  if (str.includes("Parag Parikh")) return "Parag Parikh Flexi";
  if (str.includes("Mirae")) return "Mirae Large Cap";
  if (str.includes("HDFC Top 100") || str.includes("HDFC Top")) return "HDFC Top 100";
  if (str.includes("SBI Bluechip") || str.includes("SBI Blue")) return "SBI Bluechip";
  if (str.includes("ICICI Prudential") || str.includes("ICICI Pru")) return "ICICI Bluechip";

  // Fixed Deposits
  if (type === "FD" || str.includes("Fixed Deposit")) {
    if (str.includes("State Bank of India") || str.includes("SBI")) return "SBI FD";
    if (str.includes("HDFC Bank") || str.includes("HDFC")) return "HDFC FD";
    if (str.includes("ICICI Bank") || str.includes("ICICI")) return "ICICI FD";
    if (str.includes("Post Office") || str.includes("POTD")) return "Post Office TD";
    if (str.includes("Punjab National") || str.includes("PNB")) return "PNB FD";
    const bank = str.split("(")[0].replace(/Bank/i, "").replace(/Fixed Deposit/i, "").trim();
    return `${bank.slice(0, 10)} FD`;
  }

  // Small Savings / PPF
  if (type === "PPF" || str.includes("Public Provident Fund") || str === "PPF") return "PPF";
  if (str.includes("Senior Citizen") || str.includes("SCSS")) return "SCSS";
  if (str.includes("Sukanya") || str.includes("SSA")) return "SSA";
  if (str.includes("National Savings") || str.includes("NSC")) return "NSC";

  // Insurance / LIC
  if (type === "LIC" || str.includes("LIC") || str.includes("Jeevan")) {
    if (str.includes("Jeevan Labh")) return "LIC Jeevan Labh";
    if (str.includes("Jeevan Anand")) return "LIC Jeevan Anand";
    if (str.includes("Jeevan Umang")) return "LIC Jeevan Umang";
    if (str.includes("Tech Term")) return "LIC Tech Term";
    return str.replace(/New\s+/i, "").replace(/Plan\s+/i, "").slice(0, 16);
  }

  // Clean fallback: remove plan suffixes and truncate cleanly
  return str.split("-")[0].split("(")[0].trim().slice(0, 16);
}
