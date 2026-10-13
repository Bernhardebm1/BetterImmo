import type { Metadata, Viewport } from "next";
import { Caveat, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const hand = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "BetterImmo · Find a home by describing it",
  description:
    "Tell us what you're looking for in your own words. We ask when something is unclear, push back when it doesn't add up, and show you a few homes that actually fit.",
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${hand.variable} h-full antialiased`}>
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
