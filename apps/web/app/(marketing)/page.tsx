import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp, Users, MessageSquare, BarChart3, Shield, CheckCircle, ChevronRight } from 'lucide-react';
import { BUSINESS_TYPE_ORDER, VERTICAL_PACKS } from '@revorax/shared';

export const metadata: Metadata = {
  title: 'Revorax — AI Revenue OS for Growing Businesses',
  description: 'Recover missed revenue, convert more leads, and automate follow-ups with Revorax. The AI Revenue OS built for gyms, clinics, salons, coaching centers, real estate teams, dental clinics, agencies, and SMBs.',
};

const nichePacks = BUSINESS_TYPE_ORDER
  .filter((type) => type !== 'OTHER')
  .map((type) => VERTICAL_PACKS[type]);

const nicheRoutes: Record<string, string> = {
  GYM: '/gym',
  CLINIC: '/clinic',
  SALON: '/salon',
  COACHING: '/coaching',
  REAL_ESTATE: '/real-estate',
  DENTAL: '/dental',
  AGENCY: '/agency',
};

const nicheEmojis: Record<string, string> = {
  GYM: '🏋️',
  CLINIC: '🏥',
  SALON: '💇',
  COACHING: '📚',
  REAL_ESTATE: '🏠',
  DENTAL: '🦷',
  AGENCY: '📊',
};

const features = [
  {
    icon: TrendingUp,
    title: 'Renewal Recovery',
    description: 'Automatically identify revenue at risk and send personalized WhatsApp reminders before customers go cold.',
    stat: 'Less revenue leakage',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Follow-Up Engine',
    description: 'AI drafts personalized follow-up messages for every lead, customer, patient, client, student, prospect, or account.',
    stat: '67% faster response',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Users,
    title: 'Smart CRM',
    description: 'Track every contact, lead, customer, and deal in one place. Know who needs attention before revenue leaks.',
    stat: 'Zero missed follow-ups',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: BarChart3,
    title: 'Revenue Analytics',
    description: 'See exactly where revenue is coming from and where it is leaking. Make decisions on data, not gut feeling.',
    stat: 'Real-time insights',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'WhatsApp Automation',
    description: 'Send reminders, payment notices, reactivation messages, and follow-ups via WhatsApp. Compliant, opt-in friendly.',
    stat: '94% open rate',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: Shield,
    title: 'Multi-Role Access',
    description: 'Owner, manager, and staff roles. Everyone sees what they need. Nothing more, nothing less.',
    stat: 'RBAC & audit logs',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    description: 'For small businesses getting started',
    features: ['Up to 200 records', 'WhatsApp reminders', 'Basic CRM', 'Retention tracking', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '₹5,999',
    period: '/month',
    description: 'For growing businesses that need automation',
    features: ['Up to 1,000 records', 'Full AI assistant', 'Campaign engine', 'Advanced analytics', 'Workflow automation', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    price: '₹9,999',
    period: '/month',
    description: 'For established businesses with high volume',
    features: ['Unlimited records', 'Custom workflows', 'API access', 'Dedicated support', 'Custom reports', 'White-label option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const howItWorks = [
  { step: '01', title: 'Import your data', desc: 'Upload your member, patient, client, or student list from Excel or CSV. Setup takes under 5 minutes.', emoji: '📥' },
  { step: '02', title: 'Automate follow-ups', desc: 'Revorax sends WhatsApp reminders, renewal nudges, and follow-up messages — automatically, on schedule.', emoji: '⚡' },
  { step: '03', title: 'Recover revenue', desc: 'Track renewals, conversions, and revenue recovered in real-time. See exactly how much Revorax saves you.', emoji: '💰' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gradient">⚡ Revorax</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <Link href="#features" className="hover:text-zinc-100 transition-colors">Features</Link>
            <Link href="#niches" className="hover:text-zinc-100 transition-colors">Industries</Link>
            <Link href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            AI-Powered Revenue OS for 7+ Industries
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-zinc-100 leading-tight mb-6 animate-slide-up">
            Stop Losing Revenue
            <br />
            <span className="text-gradient">to Poor Follow-Up</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Revorax helps gyms, clinics, salons, coaching centers, dental clinics, real estate teams, and agencies 
            recover missed revenue with automated WhatsApp follow-ups and AI-powered messaging.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
              Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3.5">
              See How It Works
            </Link>
          </div>

          {/* Niche badges - floating */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {nichePacks.map((pack) => (
              <Link
                key={pack.businessType}
                href={nicheRoutes[pack.businessType]}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 bg-surface-50 border-surface-300 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
              >
                <span>{nicheEmojis[pack.businessType]}</span>
                {pack.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6">
            Your business is losing money every single day
          </h2>
          <p className="text-lg text-zinc-400 mb-12">
            Most businesses lose revenue not because of bad service, but because of
            late replies, forgotten follow-ups, missed reminders, and weak retention systems.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '⏱️', title: 'Replied too late', desc: 'Leads go cold in 5 minutes. Your staff responds hours later.' },
              { emoji: '💸', title: 'Forgotten follow-ups', desc: 'Customers go cold because no one reminded, rebooked, recalled, or renewed them in time.' },
              { emoji: '📋', title: 'No follow-up system', desc: 'Tasks exist in someone\'s head. Not in a system. Not trackable.' },
            ].map((item) => (
              <div key={item.title} className="card p-6 text-left border-red-500/10 hover:border-red-500/30 transition-colors">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Live in <span className="text-gradient">3 simple steps</span>
            </h2>
            <p className="text-lg text-zinc-400">No technical setup. No complicated onboarding. Just results.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((s, i) => (
              <div key={s.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-500/30 to-transparent" />
                )}
                <div className="card p-6 relative">
                  <div className="text-4xl mb-4">{s.emoji}</div>
                  <div className="text-xs font-black text-brand-500/40 mb-2">STEP {s.step}</div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Everything you need to
              <span className="text-gradient"> grow recurring revenue</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Revorax is not a generic CRM. It is a revenue machine built specifically for businesses
              with recurring customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`card-hover p-6 border ${f.bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.bg} border mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div className={`text-xs font-bold ${f.color} mb-2`}>{f.stat}</div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Niche Packs */}
      <section id="niches" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              One platform. <span className="text-gradient">Every industry.</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Same powerful core. Different workflows, labels, templates, and revenue goals — purpose-built for your niche.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {nichePacks.map((pack) => (
              <Link
                key={pack.businessType}
                href={nicheRoutes[pack.businessType]}
                className="card p-5 hover:border-brand-500/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: pack.accentColor }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${pack.accentColor}20`, color: pack.accentColor }}>
                      {nicheEmojis[pack.businessType]}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{pack.shortLabel}</h3>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{pack.retentionMetricLabel}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 mb-1.5">{pack.positioning}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-3">{pack.signupHint}</p>
                  <div className="text-xs font-medium group-hover:text-brand-400 text-zinc-600 transition-colors flex items-center gap-1">
                    Explore {pack.shortLabel} <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-zinc-100 mb-6">
            Trusted by growing businesses across India
          </h2>
          <p className="text-zinc-400 mb-12">
            From solo gyms to multi-location clinics — Revorax powers revenue recovery for service businesses that depend on recurring customers.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { metric: '7', label: 'Industry verticals supported', sub: 'Gym, Clinic, Salon, Coaching, Real Estate, Dental, Agency' },
              { metric: '94%', label: 'WhatsApp message open rate', sub: 'vs 20% for email and 5% for SMS' },
              { metric: '5 min', label: 'Average setup time', sub: 'Import CSV → Connect WhatsApp → Go live' },
            ].map((item) => (
              <div key={item.label} className="card p-6">
                <div className="text-3xl font-black text-gradient mb-2">{item.metric}</div>
                <div className="text-sm font-semibold text-zinc-200 mb-1">{item.label}</div>
                <div className="text-xs text-zinc-600">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Pricing that pays for itself
            </h2>
            <p className="text-zinc-400">14-day free trial. No credit card required. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card p-8 relative flex flex-col ${p.highlighted ? 'border-brand-500/50 shadow-glow' : ''}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-purple text-xs px-3 py-1">{p.badge}</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">{p.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{p.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-zinc-100">{p.price}</span>
                    <span className="text-zinc-500 text-sm">{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.cta === 'Contact Sales' ? 'mailto:sales@revorax.online' : '/signup'}
                  className={p.highlighted ? 'btn-primary text-center' : 'btn-secondary text-center'}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-brand opacity-5 pointer-events-none" />
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Ready to recover lost revenue?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Join growing businesses that use Revorax to stop leaking revenue and start growing.
            </p>
            <Link href="/signup" className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2">
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs text-zinc-600">No credit card required. Setup in 5 minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="text-xl font-black text-gradient mb-2">⚡ Revorax</div>
              <p className="text-sm text-zinc-600 max-w-xs">AI Revenue OS for growing businesses. Recover missed revenue across 7+ industries.</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Industries</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-zinc-500">
                <Link href="/gym" className="hover:text-zinc-300 transition-colors">Gyms</Link>
                <Link href="/clinic" className="hover:text-zinc-300 transition-colors">Clinics</Link>
                <Link href="/salon" className="hover:text-zinc-300 transition-colors">Salons</Link>
                <Link href="/coaching" className="hover:text-zinc-300 transition-colors">Coaching</Link>
                <Link href="/dental" className="hover:text-zinc-300 transition-colors">Dental</Link>
                <Link href="/agency" className="hover:text-zinc-300 transition-colors">Agencies</Link>
                <Link href="/real-estate" className="hover:text-zinc-300 transition-colors">Real Estate</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Company</div>
              <div className="flex flex-col gap-1.5 text-sm text-zinc-500">
                <Link href="/login" className="hover:text-zinc-300 transition-colors">Login</Link>
                <Link href="/signup" className="hover:text-zinc-300 transition-colors">Sign Up</Link>
                <a href="mailto:support@revorax.online" className="hover:text-zinc-300 transition-colors">Support</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-surface-200 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Revorax. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
