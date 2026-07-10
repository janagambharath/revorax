import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'Revorax - AI Revenue OS', template: '%s | Revorax' },
  description:
    'Revorax is the AI Revenue OS for growing businesses. Capture leads, recover missed revenue, automate follow-ups, and grow recurring revenue across multiple SMB niches.',
  keywords: ['revenue os', 'CRM', 'WhatsApp automation', 'retention automation', 'lead follow-up', 'AI business tools'],
  openGraph: {
    title: 'Revorax - AI Revenue OS',
    description: 'Recover missed revenue. Convert more leads. Automate follow-ups.',
    url: 'https://revorax.online',
    siteName: 'Revorax',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revorax - AI Revenue OS',
    description: 'The AI Revenue OS for growing businesses',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0f0f13',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
