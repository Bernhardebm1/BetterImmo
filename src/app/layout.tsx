import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const sans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

/** Prices and figures. */
const figures = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#12191c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${figures.variable} ${mono.variable} ${hand.variable} ${serif.variable} h-full antialiased`}>
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
