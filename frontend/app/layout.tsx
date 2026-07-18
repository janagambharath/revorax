import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
