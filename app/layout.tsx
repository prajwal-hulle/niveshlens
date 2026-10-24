import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { CurrencyProvider } from "@/components/currency-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingComparePill } from "@/components/compare/floating-compare-pill";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1B3A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NiveshLens – Investment Risk & Scheme Comparator",
  description:
    "See what your investment hides. Unbiased comparison of Indian Fixed Deposits, PPF, Mutual Funds, and LIC policies on returns, real inflation drag, liquidity, charges, and insurance adequacy.",
  keywords: [
    "NiveshLens",
    "FD vs PPF vs Mutual Fund vs LIC",
    "Indian investment comparator",
    "Fisher real return",
    "LIC IRR calculator",
    "Buy term and invest the difference",
    "AMFI TER disclosure",
    "DICGC insurance limit",
  ],
  authors: [{ name: "NiveshLens Team" }],
  metadataBase: new URL("https://niveshlens.vercel.app"),
  openGraph: {
    title: "NiveshLens – See what your investment hides",
    description:
      "Mathematical multi-asset comparator for Indian retail investors. Exposing hidden charges, sub-inflation real returns, and surrender penalties.",
    siteName: "NiveshLens",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NiveshLens – Investment Risk & Scheme Comparator",
    description: "Compare Fixed Deposits, PPF, Mutual Funds, and LIC policies without marketing spin.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans bg-background text-text antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
              <Footer />
              <FloatingComparePill />
            </CurrencyProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
