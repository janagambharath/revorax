import type { Metadata } from 'next';
import { VERTICAL_PACKS } from '@revorax/shared';
import NicheLandingPage from '@/components/NicheLandingPage';

const pack = VERTICAL_PACKS.COACHING;

export const metadata: Metadata = {
  title: `${pack.label} — Revorax`,
  description: `${pack.positioning} ${pack.valueDelivered} AI-powered revenue recovery for ${pack.targetNiche.toLowerCase()}.`,
  openGraph: {
    title: `${pack.label} — Revorax`,
    description: pack.positioning,
    url: 'https://revorax.online/coaching',
  },
};

export default function CoachingPage() {
  return <NicheLandingPage pack={pack} />;
}
