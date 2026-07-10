import type { Metadata } from 'next';
import { VERTICAL_PACKS } from '@revorax/shared';
import NicheLandingPage from '@/components/NicheLandingPage';

const pack = VERTICAL_PACKS.GYM;

export const metadata: Metadata = {
  title: `${pack.label} — Revorax`,
  description: `${pack.positioning} ${pack.valueDelivered} AI-powered revenue recovery for ${pack.targetNiche.toLowerCase()}.`,
  openGraph: {
    title: `${pack.label} — Revorax`,
    description: pack.positioning,
    url: 'https://revorax.online/gym',
  },
};

export default function GymPage() {
  return <NicheLandingPage pack={pack} />;
}
