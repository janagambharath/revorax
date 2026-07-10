import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp, Users, MessageSquare, BarChart3, Shield, CheckCircle, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Revorax — AI Revenue OS for Growing Businesses',
  description: 'Recover expired memberships, convert more leads, and automate follow-ups with Revorax. The AI Revenue OS built for gyms, clinics, and SMBs.',
};

const features = [
  {
    icon: TrendingUp,
    title: 'Renewal Recovery',
    description: 'Automatically identify expiring memberships and send personalized WhatsApp reminders before revenue walks out the door.',
    stat: '3.2x more renewals',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Follow-Up Engine',
    description: 'AI drafts personalized follow-up messages for every lead and member. Your team reviews and sends in one click.',
    stat: '67% faster response',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Users,
    title: 'Smart CRM',
    description: 'Track every lead, member, and deal in one place. Know who needs attention before revenue leaks.',
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
    description: 'Send renewal reminders, payment notices, and follow-ups via WhatsApp automatically. Compliant, opt-in friendly.',
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

const metrics = [
  { value: '₹2.4L', label: 'Avg. revenue recovered per gym/month' },
  { value: '83%', label: 'Renewal rate improvement' },
  { value: '4.2x', label: 'More leads converted' },
  { value: '6 hrs', label: 'Staff time saved per week' },
];

const plans = [
  {
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    description: 'For small gyms getting started',
    features: ['Up to 200 members', 'WhatsApp reminders', 'Basic CRM', 'Renewal tracking', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '₹5,999',
    period: '/month',
    description: 'For growing businesses that need automation',
    features: ['Up to 1,000 members', 'Full AI assistant', 'Campaign engine', 'Advanced analytics', 'Workflow automation', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    price: '₹9,999',
    period: '/month',
    description: 'For established businesses with high volume',
    features: ['Unlimited members', 'Custom workflows', 'API access', 'Dedicated support', 'Custom reports', 'White-label option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  { name: 'Vikram Singh', role: 'Owner, FitZone Mumbai', text: 'Revorax recovered ₹1.8L in expired memberships in the first month. My staff used to forget follow-ups. Now it just happens.', rating: 5 },
  { name: 'Priya Mehta', role: 'Manager, PowerFit Pune', text: 'The WhatsApp reminders go out automatically. Members renew without us having to chase them. Game changer.', rating: 5 },
  { name: 'Rahul Nair', role: 'Owner, IronCore Gym Bangalore', text: 'Setup took 30 minutes. Within a week, we had 12 expired members come back. ROI was immediate.', rating: 5 },
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
            <Link href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
            <Link href="#testimonials" className="hover:text-zinc-100 transition-colors">Testimonials</Link>
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
            AI-Powered Revenue OS for Growing Businesses
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-zinc-100 leading-tight mb-6 animate-slide-up">
            Stop Losing Revenue
            <br />
            <span className="text-gradient">to Poor Follow-Up</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Revorax automatically recovers expired memberships, converts more leads, and sends
            WhatsApp reminders — so your team focuses on growth, not chasing people.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-8 py-3">
              See How It Works
            </Link>
          </div>

          {/* Metrics strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {metrics.map((m) => (
              <div key={m.label} className="card p-5 text-center">
                <div className="text-3xl font-black text-gradient mb-1">{m.value}</div>
                <div className="text-xs text-zinc-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6">
            Your gym is losing money every single day
          </h2>
          <p className="text-lg text-zinc-400 mb-12">
            Most gyms lose 30–40% of potential revenue not because of bad products — but because of
            poor follow-up, forgotten renewals, and missed leads.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '⏱️', title: 'Replied too late', desc: 'Leads go cold in 5 minutes. Your staff responds hours later.' },
              { emoji: '💸', title: 'Forgotten renewals', desc: 'Members expire and leave because no one reminded them in time.' },
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-surface-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-100 mb-4">
              Gyms that switched to Revorax
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-zinc-100 text-sm">{t.name}</div>
                  <div className="text-zinc-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
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
              Join gyms across India that use Revorax to stop leaking revenue and start growing.
            </p>
            <Link href="/signup" className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2">
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs text-zinc-600">No credit card required. Setup in 30 minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-black text-gradient">⚡ Revorax</div>
          <p className="text-sm text-zinc-600">
            © 2025 Revorax. AI Revenue OS for growing businesses.
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
