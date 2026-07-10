'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  Star,
  Target,
  RefreshCw,
  Bell,
  Calendar,
} from 'lucide-react';
import type { VerticalPack } from '@revorax/shared';

interface NicheLandingPageProps {
  pack: VerticalPack;
}

// Niche-specific icon mapping
const NICHE_ICONS: Record<string, typeof Zap> = {
  GYM: RefreshCw,
  CLINIC: Calendar,
  SALON: Star,
  COACHING: Target,
  REAL_ESTATE: TrendingUp,
  DENTAL: Bell,
  AGENCY: Users,
};

// Niche-specific gradient colors
const NICHE_GRADIENTS: Record<string, { from: string; to: string; glow: string }> = {
  GYM: { from: '#f97316', to: '#ea580c', glow: 'rgba(249,115,22,0.2)' },
  CLINIC: { from: '#06b6d4', to: '#0891b2', glow: 'rgba(6,182,212,0.2)' },
  SALON: { from: '#ec4899', to: '#db2777', glow: 'rgba(236,72,153,0.2)' },
  COACHING: { from: '#8b5cf6', to: '#7c3aed', glow: 'rgba(139,92,246,0.2)' },
  REAL_ESTATE: { from: '#10b981', to: '#059669', glow: 'rgba(16,185,129,0.2)' },
  DENTAL: { from: '#3b82f6', to: '#2563eb', glow: 'rgba(59,130,246,0.2)' },
  AGENCY: { from: '#f59e0b', to: '#d97706', glow: 'rgba(245,158,11,0.2)' },
};

// Revenue leaks per niche (problem framing)
const NICHE_LEAKS: Record<string, Array<{ emoji: string; title: string; desc: string }>> = {
  GYM: [
    { emoji: '💸', title: 'Memberships expire silently', desc: 'No reminder goes out. Members walk away. Revenue disappears.' },
    { emoji: '⏱️', title: 'Trials don\'t convert', desc: 'Trial members finish and no one follows up to close the deal.' },
    { emoji: '📋', title: 'Payments go unpaid', desc: 'Overdue renewals pile up because staff forgets to chase them.' },
  ],
  CLINIC: [
    { emoji: '🚫', title: 'Patients miss appointments', desc: 'No confirmation message. No reminder. Revenue lost to no-shows.' },
    { emoji: '💸', title: 'Recalls go forgotten', desc: 'Patients due for follow-ups never get contacted. They don\'t come back.' },
    { emoji: '⏱️', title: 'Treatment plans stall', desc: 'Patients accept treatment plans but never book the next visit.' },
  ],
  SALON: [
    { emoji: '💸', title: 'Clients don\'t return', desc: 'After one visit, no rebooking message goes out. Clients forget you.' },
    { emoji: '📋', title: 'Packages expire quietly', desc: 'Clients finish packages but no one offers a renewal or upgrade.' },
    { emoji: '⏱️', title: 'Loyalty goes unrewarded', desc: 'Loyal clients get no special attention. They switch to competitors.' },
  ],
  COACHING: [
    { emoji: '💸', title: 'Inquiries go cold', desc: 'Parents call, ask about admissions, and never hear back.' },
    { emoji: '⏱️', title: 'Fees pile up unpaid', desc: 'Fee reminders are manual. Staff forgets. Collection drops.' },
    { emoji: '📋', title: 'Parents stay uninformed', desc: 'No updates about batches, schedule changes, or progress.' },
  ],
  REAL_ESTATE: [
    { emoji: '💸', title: 'Leads go cold fast', desc: 'High-intent buyers don\'t hear back for days. They move on.' },
    { emoji: '⏱️', title: 'Site visits don\'t happen', desc: 'Interested leads don\'t get pushed to schedule a visit.' },
    { emoji: '📋', title: 'Pipeline has no visibility', desc: 'Deals sit in spreadsheets. Nobody knows what needs follow-up.' },
  ],
  DENTAL: [
    { emoji: '💸', title: 'Recalls go unscheduled', desc: 'Patients due for 6-month recalls never get a reminder.' },
    { emoji: '⏱️', title: 'Appointments get missed', desc: 'No confirmation message means more empty chairs.' },
    { emoji: '📋', title: 'Treatment plans drop off', desc: 'Patients agree to treatment but never come back to start.' },
  ],
  AGENCY: [
    { emoji: '💸', title: 'Proposals stall forever', desc: 'You send a proposal and forget to follow up. Client goes silent.' },
    { emoji: '⏱️', title: 'Renewals slip through', desc: 'Retainer renewals don\'t have an accountable follow-up system.' },
    { emoji: '📋', title: 'Client check-ins are random', desc: 'No system ensures proactive engagement with paying clients.' },
  ],
};

// What they get section (features per niche)
function getNicheFeatures(pack: VerticalPack) {
  return [
    {
      icon: TrendingUp,
      title: `${pack.retentionObject.charAt(0).toUpperCase() + pack.retentionObject.slice(1)} Recovery`,
      description: `Automatically identify ${pack.customerPluralLabel} at risk and send personalized reminders before they leave.`,
      stat: `Fewer lost ${pack.customerPluralLabel}`,
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Automation',
      description: `Send ${pack.retentionObject} reminders, ${pack.retentionDateLabel} alerts, and follow-ups via WhatsApp. Compliant and opt-in friendly.`,
      stat: '94% open rate',
    },
    {
      icon: Users,
      title: `${pack.primaryNavLabel} Management`,
      description: `Track every ${pack.customerLabel}, ${pack.leadLabel}, and ${pack.retentionObject} in one place. Know who needs attention.`,
      stat: 'Zero missed follow-ups',
    },
    {
      icon: Zap,
      title: 'AI Follow-Up Engine',
      description: `AI drafts personalized follow-up messages for every ${pack.customerLabel}. Your team sends in one click.`,
      stat: '67% faster response',
    },
    {
      icon: BarChart3,
      title: 'Revenue Analytics',
      description: `See your ${pack.retentionMetricLabel}, revenue at risk, and recovery performance in real time.`,
      stat: 'Data-driven decisions',
    },
    {
      icon: Shield,
      title: 'Team Access & Roles',
      description: 'Owner, manager, and staff roles. Everyone sees what they need. Full audit trail.',
      stat: 'RBAC & audit logs',
    },
  ];
}

export default function NicheLandingPage({ pack }: NicheLandingPageProps) {
  const gradient = NICHE_GRADIENTS[pack.businessType] || NICHE_GRADIENTS.GYM;
  const leaks = NICHE_LEAKS[pack.businessType] || NICHE_LEAKS.GYM;
  const features = getNicheFeatures(pack);
  const NicheIcon = NICHE_ICONS[pack.businessType] || Zap;
  const signupUrl = `/signup?type=${pack.businessType}`;

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-xl font-black text-gradient">⚡ Revorax</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <Link href="#problem" className="hover:text-zinc-100 transition-colors">Problem</Link>
            <Link href="#features" className="hover:text-zinc-100 transition-colors">Features</Link>
            <Link href="#workflows" className="hover:text-zinc-100 transition-colors">How It Works</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
            <Link href={signupUrl} className="btn-primary text-sm py-2 px-5">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${gradient.glow} 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${gradient.from}20` }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8 animate-fade-in"
            style={{ borderColor: `${gradient.from}40`, color: gradient.from }}
          >
            <NicheIcon className="w-4 h-4" />
            Built for {pack.targetNiche}
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-zinc-100 leading-tight mb-6 animate-slide-up">
            {pack.positioning.replace(/\.$/, '').split(' ').slice(0, -1).join(' ')}
            <br />
            <span style={{ color: gradient.from }}>
              {pack.positioning.replace(/\.$/, '').split(' ').slice(-1)[0]}.
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {pack.valueDelivered}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href={signupUrl}
              className="text-base px-8 py-3.5 flex items-center gap-2 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
            >
              Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-8 py-3">
              See How It Works
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="card p-5 text-center">
              <div className="text-2xl font-black mb-1" style={{ color: gradient.from }}>94%</div>
              <div className="text-xs text-zinc-500">WhatsApp open rate</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-2xl font-black mb-1" style={{ color: gradient.from }}>83%</div>
              <div className="text-xs text-zinc-500">Better {pack.retentionMetricLabel}</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-2xl font-black mb-1" style={{ color: gradient.from }}>6 hrs</div>
              <div className="text-xs text-zinc-500">Staff time saved weekly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6">
            Your {pack.shortLabel.toLowerCase()} is losing revenue every day
          </h2>
          <p className="text-lg text-zinc-400 mb-12">
            {pack.painPoint}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {leaks.map((item) => (
              <div
                key={item.title}
                className="card p-6 text-left transition-colors"
                style={{ borderColor: `${gradient.from}10` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${gradient.from}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${gradient.from}10`; }}
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
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
              Everything your {pack.shortLabel.toLowerCase()} needs to
              <span style={{ color: gradient.from }}> recover revenue</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Revorax for {pack.targetNiche} — same powerful platform, built for your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-hover p-6"
                style={{ borderColor: `${gradient.from}15`, background: `${gradient.from}05` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
                  style={{ background: `${gradient.from}15`, borderColor: `${gradient.from}25` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: gradient.from }} />
                </div>
                <div className="text-xs font-bold mb-2" style={{ color: gradient.from }}>{f.stat}</div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflows" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              How Revorax recovers revenue for your {pack.shortLabel.toLowerCase()}
            </h2>
            <p className="text-lg text-zinc-400">
              Automated workflows that run in the background while you focus on your business.
            </p>
          </div>

          {pack.workflows.map((wf) => (
            <div key={wf.key} className="card p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: gradient.from }}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100">{wf.label}</h3>
                  <p className="text-xs text-zinc-500">Plugs the leak: {wf.leak}</p>
                </div>
              </div>

              <div className="space-y-4">
                {wf.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: gradient.from }}
                      >
                        {i + 1}
                      </div>
                      {i < wf.steps.length - 1 && (
                        <div className="w-px h-8 bg-surface-300 mt-1" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-zinc-200">{step.timing}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {step.action === 'SEND_WHATSAPP' ? '📱 Send WhatsApp message' :
                         step.action === 'SEND_EMAIL' ? '📧 Send email' :
                         '📋 Create follow-up task for staff'}
                        {step.templateName && ` — "${step.templateName}"`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Ready-to-use message templates
            </h2>
            <p className="text-lg text-zinc-400">
              Pre-built WhatsApp and email templates designed for {pack.targetNiche.toLowerCase()}. Use as-is or customize.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pack.templates.map((tpl) => (
              <div key={tpl.name} className="card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${gradient.from}15`,
                      color: gradient.from,
                      border: `1px solid ${gradient.from}25`,
                    }}
                  >
                    {tpl.channel === 'WHATSAPP' ? '📱 WhatsApp' : '📧 Email'}
                  </span>
                  <span className="badge-gray">{tpl.category}</span>
                </div>
                <h4 className="font-semibold text-zinc-200 text-sm mb-2">{tpl.name}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed bg-surface-100 rounded-lg p-3 font-mono text-xs">
                  {tpl.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
            />
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Ready to {pack.positioning.replace(/\.$/, '').toLowerCase()}?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Join {pack.targetNiche.toLowerCase()} that use Revorax to stop losing revenue and start growing.
            </p>
            <Link
              href={signupUrl}
              className="text-base px-10 py-3.5 inline-flex items-center gap-2 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs text-zinc-600">No credit card required. Setup in 30 minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <span className="text-xl font-black text-gradient">⚡ Revorax</span>
          </Link>
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Revorax. {pack.label}.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <a href="mailto:support@revorax.online" className="hover:text-zinc-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
