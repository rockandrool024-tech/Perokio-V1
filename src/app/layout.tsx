import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

// Fraunces (serif) — headings
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Inter (sans) — UI body
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono — numbers, timers, codes
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

// Noto Sans Arabic — Arabic UI
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Perokio · Verified Facts × Local Film",
  description:
    "Agent-mediated marketplace for the MENA creator economy — verified fact bundles, B11 script-locking moat, Base Fee + CPM payouts.",
  keywords: ["Perokio", "MENA", "Creator Economy", "CPM", "Verified Facts", "B11 Moat"],
  authors: [{ name: "Perokio Studio" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="dark">
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable} ${notoArabic.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
