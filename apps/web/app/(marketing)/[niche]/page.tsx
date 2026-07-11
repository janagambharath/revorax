import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, MessageSquare, BarChart3, Users, Clock, TrendingUp, Shield, Send } from 'lucide-react';
import { VERTICAL_PACKS, type BusinessType } from '@revorax/shared';

// ─── Niche Mapping ──────────────────────────────────────────────────────────

const NICHE_SLUGS: Record<string, BusinessType> = {
  gym: 'GYM',
  clinic: 'CLINIC',
  salon: 'SALON',
  coaching: 'COACHING',
  'real-estate': 'REAL_ESTATE',
  dental: 'DENTAL',
  agency: 'AGENCY',
};

const NICHE_EMOJIS: Record<string, string> = {
  GYM: '🏋️',
  CLINIC: '🏥',
  SALON: '💇',
  COACHING: '📚',
  REAL_ESTATE: '🏠',
  DENTAL: '🦷',
  AGENCY: '📊',
};

const NICHE_PAIN_CARDS: Record<string, Array<{ emoji: string; title: string; desc: string }>> = {
  GYM: [
    { emoji: '💸', title: 'Members expire silently', desc: 'Memberships end and no one follows up. By the time staff notices, the member has moved on to another gym.' },
    { emoji: '⏱️', title: 'Trial leads go cold', desc: 'Free trial visitors leave without converting. No systematic follow-up means 80% of trials never become paying members.' },
    { emoji: '📋', title: 'Renewal reminders are manual', desc: 'Staff forgets to call. WhatsApp messages are copy-pasted. There is no system and no accountability for follow-ups.' },
  ],
  CLINIC: [
    { emoji: '🚫', title: 'Patients miss appointments', desc: 'No-shows cost clinics 20-30% of daily revenue. Without automated reminders, chairs sit empty and slots go unused.' },
    { emoji: '📅', title: 'Recalls are forgotten', desc: 'Follow-up visits, check-ups, and treatment continuations are lost because the clinic has no recall system beyond memory.' },
    { emoji: '📱', title: 'Communication is one-way', desc: 'Patients want confirmation via WhatsApp. Clinics still call. Messages get ignored. Appointments get missed.' },
  ],
  SALON: [
    { emoji: '💇', title: 'Clients don\'t rebook', desc: 'After a visit, clients disappear. Without a rebooking nudge, the average gap between visits stretches from 4 weeks to 10+.' },
    { emoji: '📦', title: 'Packages expire quietly', desc: 'Prepaid packages run out and no one tells the client. Revenue from renewals disappears without a trace.' },
    { emoji: '🎂', title: 'Loyalty is manual', desc: 'Birthday offers, VIP perks, and loyalty rewards are inconsistent because there is no system tracking client milestones.' },
  ],
  COACHING: [
    { emoji: '💰', title: 'Fee collection delays', desc: 'Parents forget payment dates. Staff is too busy teaching to chase fees. Monthly collection takes 2-3 weeks instead of 2-3 days.' },
    { emoji: '📞', title: 'Admission leads are lost', desc: 'Inquiries come in, get noted on paper, and never get a follow-up call. Competitors respond faster and win the admission.' },
    { emoji: '📋', title: 'Batch reminders are manual', desc: 'Schedule changes, exam updates, and parent communication happen through personal WhatsApp — no structure, no history.' },
  ],
  REAL_ESTATE: [
    { emoji: '❄️', title: 'Hot leads go cold', desc: 'Property leads respond once and then vanish. Without systematic follow-up within 24 hours, high-intent buyers choose other brokers.' },
    { emoji: '🏗️', title: 'Site visits don\'t happen', desc: 'Leads express interest but no one books the visit. The pipeline looks full but conversions stay flat.' },
    { emoji: '📊', title: 'Pipeline is invisible', desc: 'Deal stages, follow-up history, and lead quality live in someone\'s head. No dashboard, no forecasting, no accountability.' },
  ],
  DENTAL: [
    { emoji: '🦷', title: 'Recall visits are missed', desc: '6-month recalls and annual check-ups go unreminded. Patients forget, and the practice loses predictable recurring revenue.' },
    { emoji: '💉', title: 'Treatment plans stall', desc: 'Patients accept treatment plans but never schedule the next step. Without follow-up, procedures are abandoned mid-course.' },
    { emoji: '⏰', title: 'Confirmation is phone-based', desc: 'Front desk spends hours calling patients to confirm. Half don\'t pick up. WhatsApp confirmation would take seconds.' },
  ],
  AGENCY: [
    { emoji: '📄', title: 'Proposals go stale', desc: 'Proposals are sent and never followed up. By day 5, the prospect has moved on. By day 10, they\'ve signed with a competitor.' },
    { emoji: '🔄', title: 'Retainer renewals slip', desc: 'Client contracts renew monthly but no one tracks the date. Renewals are reactive, not proactive. Revenue slips through.' },
    { emoji: '👤', title: 'Client health is invisible', desc: 'Account managers don\'t know which clients need attention until they churn. No early warning system. No proactive check-ins.' },
  ],
};

const NICHE_HOW_IT_WORKS: Record<string, Array<{ step: string; title: string; desc: string }>> = {
  GYM: [
    { step: '01', title: 'Import your member list', desc: 'Upload your Excel or CSV file with member names, phone numbers, and renewal dates. We do the rest.' },
    { step: '02', title: 'Automated WhatsApp reminders', desc: 'Revorax sends renewal reminders 7 days, 3 days, and on the day of expiry — via WhatsApp, automatically.' },
    { step: '03', title: 'Track renewals and revenue', desc: 'See exactly who renewed, who expired, and how much revenue is at risk — in a single dashboard.' },
  ],
  CLINIC: [
    { step: '01', title: 'Add your patient list', desc: 'Import patients with phone numbers and appointment dates. Or add them manually as they visit.' },
    { step: '02', title: 'Automated appointment reminders', desc: 'Patients get WhatsApp confirmations 24 hours before. Missed appointments trigger recall follow-ups automatically.' },
    { step: '03', title: 'Track show-up and recall rates', desc: 'See which patients confirmed, who missed, and who needs a recall — all in one dashboard.' },
  ],
  SALON: [
    { step: '01', title: 'Import your client list', desc: 'Upload client names, phone numbers, and last visit dates. Revorax computes rebooking windows automatically.' },
    { step: '02', title: 'Rebooking and package reminders', desc: 'Clients get a WhatsApp nudge 21 days after their last visit. Package expiry triggers renewal messages.' },
    { step: '03', title: 'Track repeat visits and revenue', desc: 'See repeat booking rates, lapsed clients, and revenue recovered — clearly, in real-time.' },
  ],
  COACHING: [
    { step: '01', title: 'Add your student list', desc: 'Import students with parent phone numbers and fee due dates. Revorax tracks every cycle.' },
    { step: '02', title: 'Automated fee reminders', desc: 'Parents get WhatsApp reminders 3 days before, on the day, and 3 days after the fee due date.' },
    { step: '03', title: 'Track collections and admissions', desc: 'See fee collection rates, overdue amounts, and admission pipeline — in a single dashboard.' },
  ],
  REAL_ESTATE: [
    { step: '01', title: 'Capture and import leads', desc: 'Import leads from portals, ads, or walk-ins. Each lead gets a status, source, and follow-up timeline.' },
    { step: '02', title: 'Automated lead follow-up', desc: 'New leads get a qualification message immediately. Unresponsive leads get follow-ups at 24 and 72 hours.' },
    { step: '03', title: 'Track visits and conversions', desc: 'See which leads booked site visits, who went cold, and where revenue is coming from.' },
  ],
  DENTAL: [
    { step: '01', title: 'Add your patient list', desc: 'Import patients with phone numbers and recall dates. Revorax computes the next recall window automatically.' },
    { step: '02', title: 'Recall and confirmation reminders', desc: 'Patients get WhatsApp recall reminders 7 days before. Appointment confirmations go out 24 hours before.' },
    { step: '03', title: 'Track recalls and chair utilization', desc: 'See recall completion rates, missed appointments, and treatment follow-up status — all in one place.' },
  ],
  AGENCY: [
    { step: '01', title: 'Track proposals and clients', desc: 'Import your client list with retainer dates and deal values. Add new proposals as they go out.' },
    { step: '02', title: 'Proposal and renewal follow-up', desc: 'Proposals get follow-ups at 2 and 5 days. Retainer renewals trigger reminders 14 days before expiry.' },
    { step: '03', title: 'Track pipeline and retention', desc: 'See proposal win rates, retainer renewal status, and revenue at risk — in one dashboard.' },
  ],
};

// ─── SSG: Pre-generate all niche pages ──────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(NICHE_SLUGS).map((niche) => ({ niche }));
}

// ─── Dynamic Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const { niche } = await params;
  const bt = NICHE_SLUGS[niche];
  if (!bt) return { title: 'Revorax' };
  const pack = VERTICAL_PACKS[bt];
  return {
    title: `${pack.label} — Revorax AI Revenue OS`,
    description: `${pack.positioning} ${pack.valueDelivered} Revorax is the AI Revenue OS for ${pack.targetNiche}.`,
    openGraph: {
      title: `${pack.label} — Revorax`,
      description: pack.positioning,
      url: `https://revorax.online/${niche}`,
    },
  };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function NicheLandingPage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche } = await params;
  const bt = NICHE_SLUGS[niche];

  if (!bt) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-zinc-100 mb-4">Page Not Found</h1>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const pack = VERTICAL_PACKS[bt];
  const emoji = NICHE_EMOJIS[bt];
  const pains = NICHE_PAIN_CARDS[bt];
  const steps = NICHE_HOW_IT_WORKS[bt];
  const sampleTemplate = pack.templates[0];
  const sampleWorkflow = pack.workflows[0];

  const plans = [
    {
      name: 'Starter',
      price: '₹2,999',
      period: '/month',
      description: `For small ${pack.targetNiche} getting started`,
      features: [`Up to 200 ${pack.customerPluralLabel}`, 'WhatsApp reminders', `${pack.primaryNavLabel} CRM`, `${pack.retentionMetricLabel} tracking`, 'Email support'],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '₹5,999',
      period: '/month',
      description: `For growing ${pack.targetNiche} that need automation`,
      features: [`Up to 1,000 ${pack.customerPluralLabel}`, 'Full AI assistant', 'Campaign engine', 'Advanced analytics', 'Workflow automation', 'Priority support'],
      cta: 'Start Free Trial',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Pro',
      price: '₹9,999',
      period: '/month',
      description: `For established ${pack.targetNiche} with high volume`,
      features: [`Unlimited ${pack.customerPluralLabel}`, 'Custom workflows', 'API access', 'Dedicated support', 'Custom reports', 'White-label option'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const featureGrid = [
    { icon: Users, title: `${pack.primaryNavLabel} Management`, desc: `Track every ${pack.customerLabel} with complete history, status, and ${pack.retentionDateLabel}.`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { icon: MessageSquare, title: 'WhatsApp Automation', desc: `Send ${pack.retentionObject} reminders, follow-ups, and reactivation messages via WhatsApp — automatically.`, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { icon: TrendingUp, title: 'Revenue Recovery', desc: `Identify ${pack.overdueLabel.toLowerCase()} and ${pack.expiringLabel.toLowerCase()} before revenue leaks away.`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: BarChart3, title: `${pack.retentionMetricLabel.charAt(0).toUpperCase() + pack.retentionMetricLabel.slice(1)} Analytics`, desc: `Real-time dashboard showing ${pack.activeLabel.toLowerCase()}, ${pack.inactiveLabel}, and revenue at risk.`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: Zap, title: 'AI Follow-Up Engine', desc: `AI drafts personalized messages for every ${pack.customerLabel}. Your team reviews and sends in one tap.`, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { icon: Shield, title: 'Team & Roles', desc: `Owner, manager, and staff roles. Everyone sees what they need. Full audit trail on every action.`, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-gradient">⚡ Revorax</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <Link href="#features" className="hover:text-zinc-100 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-zinc-100 transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${pack.accentColor}20 0%, transparent 60%)` }} />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: `${pack.accentColor}15` }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8" style={{ borderColor: `${pack.accentColor}40`, color: pack.accentColor }}>
            <span className="text-lg">{emoji}</span>
            Built for {pack.targetNiche}
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-zinc-100 leading-tight mb-6">
            {pack.positioning.split('.')[0]}
            <span className="block mt-2" style={{ color: pack.accentColor }}>
              {pack.positioning.split('.').slice(1).join('.').trim() || pack.revenueGoal.split('.')[0] + '.'}
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {pack.painPoint}
            {' '}Revorax fixes this with automated WhatsApp follow-ups, AI-powered messaging, and real-time revenue tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="text-base px-8 py-3.5 flex items-center gap-2 font-semibold text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${pack.accentColor}, ${pack.accentColor}cc)` }}>
              Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3.5">
              See How It Works
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: '14 days', label: 'Free trial' },
              { value: '5 min', label: 'Setup time' },
              { value: '94%', label: 'WhatsApp open rate' },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-black mb-1" style={{ color: pack.accentColor }}>{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6">
            {pack.targetNiche.charAt(0).toUpperCase() + pack.targetNiche.slice(1)} lose revenue every day
          </h2>
          <p className="text-lg text-zinc-400 mb-12">
            Not because of bad service — but because of missed follow-ups, forgotten reminders, and inconsistent communication.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {pains.map((p) => (
              <div key={p.title} className="card p-6 text-left border-red-500/10 hover:border-red-500/30 transition-colors">
                <div className="text-3xl mb-3">{p.emoji}</div>
                <h3 className="font-bold text-zinc-100 mb-2">{p.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Everything you need to <span style={{ color: pack.accentColor }}>recover revenue</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Purpose-built for {pack.targetNiche}. Not a generic CRM. A revenue machine.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureGrid.map((f) => (
              <div key={f.title} className={`card-hover p-6 border ${f.bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.bg} border mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Live in <span style={{ color: pack.accentColor }}>3 simple steps</span>
            </h2>
            <p className="text-lg text-zinc-400">No technical setup. No complicated onboarding. Just results.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px" style={{ background: `linear-gradient(90deg, ${pack.accentColor}40, transparent)` }} />
                )}
                <div className="card p-6 relative">
                  <div className="text-5xl font-black mb-4" style={{ color: `${pack.accentColor}30` }}>{s.step}</div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Preview */}
      {sampleTemplate && (
        <section className="py-20 px-6 bg-surface-50/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Automation
                </div>
                <h2 className="text-3xl font-black text-zinc-100 mb-4">
                  Messages that sound personal. Sent automatically.
                </h2>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  Pre-approved WhatsApp templates with dynamic fields. Each {pack.customerLabel} gets a personalized message — sent at the right time, every time.
                </p>
                <ul className="space-y-3">
                  {[
                    'Automatic variable substitution (name, date, amount)',
                    'Sent via official WhatsApp Business API',
                    'Opt-in compliant with DND checks',
                    'Delivery and read receipts tracked',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {/* WhatsApp message mockup */}
                <div className="bg-[#0b141a] rounded-2xl p-4 border border-surface-300 shadow-card max-w-sm mx-auto">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-300">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: pack.accentColor }}>
                      {pack.iconLabel}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">Your Business</div>
                      <div className="text-xs text-zinc-500">Business Account</div>
                    </div>
                  </div>
                  <div className="bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2.5 ml-auto max-w-[85%] mb-2">
                    <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-line">
                      {sampleTemplate.body
                        .replace(/{{name}}/g, 'Rahul')
                        .replace(/{{business_name}}/g, 'Your Business')
                        .replace(/{{renewal_date}}/g, '20 Jul 2026')
                        .replace(/{{appointment_date}}/g, '20 Jul 2026')
                        .replace(/{{due_date}}/g, '20 Jul 2026')
                        .replace(/{{phone}}/g, '+91 98765 43210')}
                    </p>
                    <div className="text-right mt-1">
                      <span className="text-[10px] text-zinc-400">10:30 AM ✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Workflow Preview */}
      {sampleWorkflow && (
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
                <Zap className="w-3.5 h-3.5" /> Built-in Automation
              </div>
              <h2 className="text-3xl font-black text-zinc-100 mb-4">
                {sampleWorkflow.label}
              </h2>
              <p className="text-zinc-400">
                Plugs the &ldquo;{sampleWorkflow.leak}&rdquo; leak automatically.
              </p>
            </div>
            <div className="flex flex-col gap-4 max-w-lg mx-auto">
              {sampleWorkflow.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: pack.accentColor }}>
                      {i + 1}
                    </div>
                    {i < sampleWorkflow.steps.length - 1 && (
                      <div className="w-px h-8 mt-1" style={{ background: `${pack.accentColor}30` }} />
                    )}
                  </div>
                  <div className="card p-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.action === 'SEND_WHATSAPP' && <Send className="w-3.5 h-3.5 text-green-400" />}
                      {step.action === 'SEND_EMAIL' && <Send className="w-3.5 h-3.5 text-blue-400" />}
                      {step.action === 'CREATE_TASK' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="text-xs font-semibold text-zinc-300">
                        {step.action === 'SEND_WHATSAPP' ? 'WhatsApp Message' : step.action === 'SEND_EMAIL' ? 'Email' : 'Create Staff Task'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">{step.timing}</div>
                    {step.templateName && (
                      <div className="text-xs text-zinc-600 mt-1">Template: {step.templateName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">Pricing that pays for itself</h2>
            <p className="text-zinc-400">14-day free trial. No credit card required. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card p-8 relative flex flex-col ${p.highlighted ? 'shadow-card' : ''}`}
                style={p.highlighted ? { borderColor: `${pack.accentColor}50`, boxShadow: `0 0 20px ${pack.accentColor}20` } : {}}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: pack.accentColor }}>
                      {p.badge}
                    </span>
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
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: pack.accentColor }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.cta === 'Contact Sales' ? 'mailto:sales@revorax.online' : '/signup'}
                  className={`text-center font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 ${p.highlighted ? 'text-white hover:scale-[1.02]' : 'btn-secondary'}`}
                  style={p.highlighted ? { background: `linear-gradient(135deg, ${pack.accentColor}, ${pack.accentColor}cc)` } : {}}
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
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `linear-gradient(135deg, ${pack.accentColor}, ${pack.accentColor}cc)` }} />
            <div className="text-4xl mb-4">{emoji}</div>
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Ready to recover lost revenue?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Join {pack.targetNiche} that use Revorax to stop leaking revenue and start growing.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-base px-10 py-3.5 font-semibold text-white rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${pack.accentColor}, ${pack.accentColor}cc)` }}
            >
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
              <p className="text-sm text-zinc-600">AI Revenue OS for growing businesses.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-2 text-sm text-zinc-500">
              <Link href="/gym" className="hover:text-zinc-300 transition-colors">Gyms</Link>
              <Link href="/clinic" className="hover:text-zinc-300 transition-colors">Clinics</Link>
              <Link href="/salon" className="hover:text-zinc-300 transition-colors">Salons</Link>
              <Link href="/coaching" className="hover:text-zinc-300 transition-colors">Coaching</Link>
              <Link href="/dental" className="hover:text-zinc-300 transition-colors">Dental</Link>
              <Link href="/agency" className="hover:text-zinc-300 transition-colors">Agencies</Link>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href="/login" className="hover:text-zinc-300 transition-colors">Login</Link>
              <a href="mailto:support@revorax.online" className="hover:text-zinc-300 transition-colors">Support</a>
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
