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
  title: "Revorax | AI-assisted missed-call recovery for HVAC",
  description: "Turn missed HVAC calls into qualified leads with timely text recovery, voicemail intelligence, and a focused lead workspace.",
  openGraph: {
    title: "Revorax | AI-assisted missed-call recovery for HVAC",
    description: "Turn missed HVAC calls into qualified leads with timely text recovery and a focused lead workspace.",
    type: "website",
    siteName: "Revorax",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-rvx-canvas font-body text-rvx-ink antialiased selection:bg-rvx-signal selection:text-white">
        {children}
      </body>
    </html>
  );
}
