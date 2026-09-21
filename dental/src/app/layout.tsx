import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "REvorax Dental | Turn More Patient Calls Into Booked Appointments",
  description:
    "REvorax helps dental practices capture appointment opportunities, follow up with existing patients, keep treatment plans moving, and reduce lost appointments.",
  keywords: [
    "dental appointment automation",
    "dental patient follow-up",
    "dental practice automation",
    "dental appointment booking",
    "dental call automation",
    "patient recall automation",
    "dental revenue automation",
  ],
  openGraph: {
    title: "REvorax Dental | Turn More Patient Calls Into Booked Appointments",
    description:
      "REvorax helps dental practices capture appointment opportunities, follow up with existing patients, keep treatment plans moving, and reduce lost appointments.",
    type: "website",
    url: "https://revorax.online/dental",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
