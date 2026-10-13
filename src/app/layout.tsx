import type { Metadata, Viewport } from "next";
import { Caveat, IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";
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

const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
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
    { media: "(prefers-color-scheme: light)", color: "#f2ede5" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2220" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${hand.variable} ${serif.variable} h-full antialiased`}>
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
