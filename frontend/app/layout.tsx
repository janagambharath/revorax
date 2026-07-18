import type { Metadata } from "next";
import { Inter, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revorax — Stop Losing Jobs to Missed Calls",
  description: "Every missed call is a lost job. Revorax recovers missed leads, books appointments, and follows up automatically for HVAC companies.",
  openGraph: {
    title: "Revorax — Stop Losing Jobs to Missed Calls",
    description: "Recover missed HVAC leads. Book more jobs. Automatically.",
    type: "website",
    siteName: "Revorax",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable} h-full scroll-smooth`}>
      <body className="min-h-full font-body bg-rvx-bone text-rvx-ink antialiased selection:bg-rvx-signal selection:text-white">
        {children}
      </body>
    </html>
  );
}
