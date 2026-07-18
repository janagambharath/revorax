"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Phone, PhoneMissed, MessageSquare, CalendarCheck, Bell, Clock,
  ChevronDown, CheckCircle2, ArrowRight, Shield, DollarSign, Star,
  PhoneCall, TrendingUp, X, Menu, BarChart3, ArrowUpRight,
  Send, Timer,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════ */

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const t0 = Date.now();
    const tick = setInterval(() => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * end));
      if (p >= 1) clearInterval(tick);
    }, 16);
    return () => clearInterval(tick);
  }, [end, duration, inView]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

/* ═══════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="label-caps text-accent mb-4 block">{children}</span>;
}

function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border">
      <button onClick={onClick} className="w-full flex items-center justify-between py-6 text-left cursor-pointer group">
        <span className="heading-card text-text group-hover:text-accent transition-colors pr-8">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 w-7 h-7 rounded-full bg-bg-section border border-border flex items-center justify-center">
          <ChevronDown className="w-4 h-4 text-text-faint" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
            <p className="body-md pb-6 max-w-[600px]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Dashboard Mockup ────────────────────────────── */

function ProductDashboard() {
  const leads = [
    { initials: "SM", name: "Sarah Mitchell", service: "AC Repair — Unit not cooling", urgency: "Emergency", urgencyColor: "bg-danger-light text-danger", time: "2 min ago", status: "New Lead", statusColor: "text-accent" },
    { initials: "JC", name: "James Cooper", service: "Furnace Installation — Quote", urgency: "This week", urgencyColor: "bg-warning-light text-warning", time: "18 min ago", status: "Qualified", statusColor: "text-success" },
    { initials: "MG", name: "Maria Garcia", service: "Annual Maintenance — 2 units", urgency: "Flexible", urgencyColor: "bg-accent-light text-accent", time: "1 hr ago", status: "Booked", statusColor: "text-success" },
    { initials: "RC", name: "Robert Chen", service: "AC Install — New construction", urgency: "This week", urgencyColor: "bg-warning-light text-warning", time: "3 hrs ago", status: "Qualified", statusColor: "text-success" },
  ];

  return (
    <div className="browser-chrome">
      <div className="browser-chrome-bar">
        <div className="browser-dot" />
        <div className="browser-dot" />
        <div className="browser-dot" />
        <div className="browser-url">
          <svg className="w-3 h-3 mr-1.5 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          app.revorax.com/dashboard
        </div>
      </div>

      <div className="bg-bg">
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-text tracking-tight">Revorax</span>
            <div className="hidden sm:flex items-center gap-1">
              {["Dashboard", "Leads", "Calls", "Settings"].map((tab, i) => (
                <span key={tab} className={`px-3 py-1.5 text-xs font-medium rounded-md ${i === 0 ? "bg-accent-light text-accent" : "text-text-muted"}`}>{tab}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[11px] text-text-muted font-medium">Active</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-border">
          {[
            { label: "New Leads", value: "12", delta: "+3 today" },
            { label: "Calls Answered", value: "28", delta: "+8 today" },
            { label: "Jobs Booked", value: "7", delta: "+2 today" },
            { label: "Revenue Recovered", value: "$18.4K", delta: "+$4.2K" },
          ].map((s) => (
            <div key={s.label} className="bg-white p-4">
              <div className="label-caps mb-2 !text-[10px]">{s.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text stat-value">{s.value}</span>
                <span className="text-[11px] font-medium text-success">{s.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Lead list */}
        <div className="bg-white border-t border-border">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
            <span className="text-xs font-semibold text-text">Recent Leads</span>
            <span className="text-[11px] text-accent font-medium">View all →</span>
          </div>
          {leads.map((l, i) => (
            <div key={l.name} className={`flex items-center gap-3 px-5 py-3 ${i < leads.length - 1 ? "border-b border-border-light" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-bg-section flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-text-muted">{l.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-text truncate">{l.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.urgencyColor}`}>{l.urgency}</span>
                </div>
                <span className="text-[11px] text-text-muted truncate block">{l.service}</span>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[11px] font-semibold ${l.statusColor}`}>{l.status}</span>
                <div className="text-[10px] text-text-faint">{l.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-bg">

      {/* ═══════ NAV ═══════ */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-sm border-b border-border" : "border-b border-transparent"}`}
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[1160px] mx-auto flex items-center justify-between h-16 px-5">
          <a href="#" className="text-[17px] font-bold tracking-tight text-text">Revorax</a>
          <div className="hidden md:flex items-center gap-1">
            {["Product", "How It Works", "Pricing", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="px-3.5 py-2 text-[13.5px] text-text-muted hover:text-text transition-colors rounded-lg">{item}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-[13.5px] text-text-muted hover:text-text px-3 py-2">Sign in</a>
            <a href="#cta" className="btn-primary !py-2.5 !px-6 !text-[13.5px] !rounded-lg">Get started <ArrowRight className="w-3.5 h-3.5" /></a>
          </div>
          <button className="md:hidden p-2 text-text-muted" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileNav && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-white border-t border-border">
              <div className="p-4 space-y-1">
                {["Product", "How It Works", "Pricing", "FAQ"].map((i) => (
                  <a key={i} href={`#${i.toLowerCase().replace(/\s+/g, "-")}`} className="block px-4 py-3 text-sm text-text-muted rounded-lg hover:bg-bg-section" onClick={() => setMobileNav(false)}>{i}</a>
                ))}
                <div className="pt-3 mt-2 border-t border-border">
                  <a href="#cta" className="btn-primary w-full !text-sm" onClick={() => setMobileNav(false)}>Get started</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-32 md:pt-44 pb-20 md:pb-28 px-5">
        <div className="max-w-[1160px] mx-auto">
          <div className="max-w-[700px] mx-auto text-center mb-16 md:mb-20">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="badge bg-accent-light text-accent mb-6">For HVAC companies</span>
            </motion.div>
            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="heading-hero text-text mb-6">
              Every missed call<br />is a lost job.
            </motion.h1>
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="body-lg max-w-[500px] mx-auto mb-10">
              Revorax catches the calls you miss, qualifies leads instantly, and books appointments — while you&apos;re on the job.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <a href="#cta" className="btn-primary">Start recovering revenue <ArrowRight className="w-4 h-4" /></a>
              <a href="#how-it-works" className="btn-secondary">See how it works</a>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="flex flex-wrap items-center justify-center gap-5 text-[13px] text-text-faint">
              {["No contracts", "30-day money-back", "Setup in 30 min"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" />{t}</span>
              ))}
            </motion.div>
          </div>
          <motion.div variants={scaleUp} initial="hidden" animate="visible" className="max-w-[960px] mx-auto">
            <ProductDashboard />
          </motion.div>
        </div>
      </section>

      {/* ═══════ TRUST BAR ═══════ */}
      <section className="border-y border-border py-8 px-5 bg-white">
        <div className="max-w-[1160px] mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
          <span className="label-caps shrink-0">Works with</span>
          <div className="flex items-center gap-8 md:gap-10 flex-wrap justify-center">
            {["ServiceTitan", "Housecall Pro", "Jobber", "Google Calendar", "Twilio"].map((n) => (
              <span key={n} className="text-[14px] font-semibold text-text-faint">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ THE PROBLEM ═══════ */}
      <section className="section-spacing px-5">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <SectionLabel>The problem</SectionLabel>
              <h2 className="heading-section text-text mb-6">
                You&apos;re on a job. The phone rings. Nobody answers. The customer calls your competitor.
              </h2>
              <p className="body-lg mb-8">
                HVAC companies lose 30–40% of inbound calls during peak season. Each missed call is a $3,000–$12,000 job that walks away in minutes.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "38%", label: "calls missed\nduring peak" },
                  { value: "78%", label: "hire first\nresponder" },
                  { value: "$4.2K", label: "avg job\nlost" },
                ].map((s) => (
                  <div key={s.value}>
                    <div className="text-[32px] font-bold text-text stat-value mb-1">{s.value}</div>
                    <div className="text-[12px] text-text-muted whitespace-pre-line leading-relaxed">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative">
              <div className="rounded-2xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80" alt="HVAC technician checking phone on service call" className="w-full h-[400px] object-cover" />
              </div>
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="absolute -bottom-6 -left-6 bg-white rounded-xl border border-border shadow-lg p-4 max-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <PhoneMissed className="w-4 h-4 text-danger" />
                  <span className="text-[11px] font-semibold text-danger">Missed Call</span>
                </div>
                <p className="text-[12px] text-text-secondary leading-snug">AC repair inquiry — $6,800 install lost to competitor</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ ANIMATED STATS ═══════ */}
      <section className="py-20 px-5 bg-text">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
            {[
              { end: 97, suffix: "%", label: "Lead capture rate", sub: "from missed calls", icon: PhoneMissed },
              { end: 60, prefix: "<", suffix: "s", label: "Response time", sub: "average auto-text speed", icon: Timer },
              { end: 23, suffix: "+", label: "Extra jobs / month", sub: "average customer gain", icon: CalendarCheck },
              { end: 5, suffix: "×", label: "Return on investment", sub: "average across plans", icon: TrendingUp },
            ].map((stat) => {
              const { count, ref } = useCountUp(stat.end);
              return (
                <motion.div key={stat.label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div ref={ref}>
                    <div className="text-[48px] md:text-[56px] font-bold text-white stat-value leading-none mb-2">
                      {stat.prefix}{count}{stat.suffix}
                    </div>
                    <div className="text-[14px] font-medium text-white/70 mb-0.5">{stat.label}</div>
                    <div className="text-[12px] text-white/40">{stat.sub}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCT / FEATURES ═══════ */}
      <section id="product" className="section-spacing px-5 bg-bg-section scroll-mt-20">
        <div className="max-w-[1160px] mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <SectionLabel>The solution</SectionLabel>
            <h2 className="heading-section text-text mb-4 max-w-[560px] mx-auto">Recover every missed call. Automatically.</h2>
            <p className="body-lg max-w-[460px] mx-auto">Responds in under 60 seconds, qualifies leads through conversation, and books the appointment.</p>
          </motion.div>

          {/* Feature 1 — Large split with conversation */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid lg:grid-cols-2 gap-0 mb-5">
            <div className="card !rounded-r-none lg:!rounded-r-none !rounded-b-none lg:!rounded-bl-[20px] p-8 md:p-10 flex flex-col justify-center">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-4">
                <Timer className="w-5 h-5 text-accent" />
              </div>
              <h3 className="heading-card text-text mb-2 !text-[22px]">60-second response</h3>
              <p className="body-md mb-6">Every missed call triggers an automatic text within 60 seconds. The caller gets a response before they finish searching for your competitor.</p>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[13px] text-success font-medium"><CheckCircle2 className="w-4 h-4" /> Under 60s</span>
                <span className="flex items-center gap-1.5 text-[13px] text-success font-medium"><CheckCircle2 className="w-4 h-4" /> 24/7 coverage</span>
              </div>
            </div>
            <div className="card-static !rounded-l-none lg:!rounded-l-none !rounded-t-none lg:!rounded-tr-[20px] p-6 flex items-center justify-center bg-bg-section border-l-0 lg:border-l border-t lg:border-t-0 border-border">
              <div className="w-full max-w-[280px] space-y-2.5">
                <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" /> Live conversation
                </div>
                {[
                  { side: "right", msg: "Hi! This is Comfort First HVAC. We missed your call — how can we help today?" },
                  { side: "left", msg: "My AC is blowing warm air. It's 108° today, we need someone ASAP." },
                  { side: "right", msg: "I understand — that sounds urgent. What's your ZIP code so I can check availability?" },
                  { side: "left", msg: "85028" },
                  { side: "right", msg: "Great — you're in our area! A tech can come today between 2–4pm. Does that work?" },
                  { side: "left", msg: "Yes! That's perfect. Thank you." },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 * i, duration: 0.4 }}
                    className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}>
                    <div className={`text-[12px] px-3.5 py-2.5 max-w-[220px] leading-relaxed ${
                      m.side === "right"
                        ? "bg-accent text-white rounded-2xl rounded-br-md"
                        : "bg-white text-text border border-border rounded-2xl rounded-bl-md"
                    }`}>{m.msg}</div>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
                  className="flex justify-end">
                  <div className="bg-success-light text-success text-[11px] font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Appointment booked — Today 2–4pm
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: MessageSquare, title: "Finds out what they need", desc: "AC repair or new install? Emergency or routine? The AI figures it out through a normal text conversation — no scripts, no hold music.", color: "bg-violet-light text-violet" },
              { icon: CalendarCheck, title: "Books the appointment", desc: "Checks availability, picks a time, sends confirmation. By the time you check your phone, the job is on your calendar.", color: "bg-accent-light text-accent" },
              { icon: Clock, title: "Works when you don't", desc: "Nights, weekends, holidays. While your competitors send callers to voicemail, you're booking their jobs.", color: "bg-warning-light text-warning" },
              { icon: BarChart3, title: "See every lead", desc: "One screen. Every missed call recovered, every lead qualified, every appointment booked. Know exactly what Revorax is doing for you.", color: "bg-success-light text-success" },
              { icon: Bell, title: "Text the moment it happens", desc: "New lead comes in? You get a text instantly — name, what they need, how urgent. No logging in required.", color: "bg-danger-light text-danger" },
              { icon: Send, title: "Follows up automatically", desc: "Customer didn't reply? We follow up. Lead went cold? We re-engage. No one falls through the cracks.", color: "bg-accent-light text-accent" },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 3} className="card p-7">
                <div className={`w-10 h-10 rounded-xl ${f.color.split(" ")[0]} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color.split(" ")[1]}`} />
                </div>
                <h3 className="heading-card text-text mb-2">{f.title}</h3>
                <p className="body-md">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="section-spacing px-5 scroll-mt-20">
        <div className="max-w-[800px] mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="heading-section text-text mb-4">From missed call to booked job in under 5 minutes.</h2>
            <p className="body-lg">No apps to install. No manual work. Just results.</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-5">
              {[
                { num: "01", icon: PhoneMissed, title: "Missed call detected", desc: "A customer calls while you're on a job. The call goes unanswered.", color: "bg-danger-light text-danger border-danger/15" },
                { num: "02", icon: Send, title: "Auto-text in under 60 seconds", desc: "\"Hi, this is [Company]. We missed your call — how can we help?\"", color: "bg-accent-light text-accent border-accent/15" },
                { num: "03", icon: MessageSquare, title: "AI qualifies the lead", desc: "Collects service needed, urgency, preferred time, and confirms location.", color: "bg-violet-light text-violet border-violet/15" },
                { num: "04", icon: CalendarCheck, title: "Appointment booked", desc: "The job is on your calendar. Customer gets confirmation. You just show up.", color: "bg-success-light text-success border-success/15" },
                { num: "05", icon: DollarSign, title: "Revenue recovered", desc: "A job that would have gone to your competitor is now yours.", color: "bg-warning-light text-warning border-warning/15" },
              ].map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.3} className="flex items-start gap-5 md:gap-7 relative">
                  <div className={`relative z-10 w-14 h-14 rounded-2xl ${step.color.split(" ")[0]} border ${step.color.split(" ")[2]} flex items-center justify-center shrink-0`}>
                    <step.icon className={`w-5 h-5 ${step.color.split(" ")[1]}`} />
                  </div>
                  <div className="card-static p-6 flex-1">
                    <span className="label-caps text-text-faint mb-1 block">Step {step.num}</span>
                    <h3 className="heading-card text-text mb-1">{step.title}</h3>
                    <p className="body-md">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOUNDING CUSTOMER OFFER ═══════ */}
      <section className="section-spacing px-5 bg-bg-section">
        <motion.div variants={scaleUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-[780px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-warning-light text-warning px-4 py-1.5 rounded-full text-[13px] font-semibold mb-6">
            <Star className="w-4 h-4 fill-warning" /> Limited — Founding Member Program
          </div>
          <h2 className="heading-section text-text mb-6 !text-[24px] md:!text-[28px] leading-[1.4]">
            Be one of our first 10 customers.<br />Get 50% off for life.
          </h2>
          <p className="body-lg max-w-[500px] mx-auto mb-8">
            We&apos;re launching Revorax and looking for 10 HVAC companies to join as founding members. You get the lowest price we&apos;ll ever offer, direct access to the founder, and a product shaped around your needs.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-[520px] mx-auto">
            {[
              { label: "$0 setup", sub: "(normally $299)" },
              { label: "50% off", sub: "for life" },
              { label: "Direct line", sub: "to the founder" },
            ].map((b) => (
              <div key={b.label} className="card-static p-4 text-center">
                <div className="text-[20px] font-bold text-text">{b.label}</div>
                <div className="text-[12px] text-text-muted">{b.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="section-spacing px-5 scroll-mt-20">
        <div className="max-w-[1160px] mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="heading-section text-text mb-4">Pays for itself with one recovered job.</h2>
            <p className="body-lg max-w-[440px] mx-auto">No contracts. Month-to-month. 30-day money-back guarantee.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-[840px] mx-auto">
            {[
              { name: "Starter", price: "199", desc: "For HVAC shops getting started with call recovery.", features: ["Missed call auto-text recovery", "AI voicemail transcription", "Lead capture & qualification", "100 calls / month", "200 SMS / month", "Owner dashboard", "SMS & email notifications"], cta: "Get started", highlighted: false },
              { name: "Pro", price: "349", desc: "For companies that can't afford to miss a single call.", features: ["Everything in Starter", "Appointment booking & confirmations", "SMS appointment reminders", "300 calls / month", "500 SMS / month", "Custom greeting & branding", "Priority support", "Weekly performance reports"], cta: "Start with Pro", highlighted: true },
            ].map((plan) => (
              <motion.div key={plan.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className={`${plan.highlighted ? "card-highlight" : "card-static"} p-8 relative`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6">
                    <span className="badge bg-accent text-white text-[11px] shadow-md">Most popular</span>
                  </div>
                )}
                <h3 className="text-[20px] font-bold text-text mb-1">{plan.name}</h3>
                <p className="text-[13px] text-text-faint mb-6">{plan.desc}</p>
                <div className="flex items-baseline mb-1">
                  <span className="text-[48px] font-bold text-text stat-value leading-none">${plan.price}</span>
                  <span className="text-text-muted text-[15px] ml-1">/mo</span>
                </div>
                <div className="text-[13px] text-text-faint mb-8"><span className="line-through">$299 setup</span> <span className="text-success font-semibold">Free setup for founding members</span></div>
                <ul className="space-y-3 mb-8 pt-6 border-t border-border">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-[14px] text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#cta" className={`w-full ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8 text-[13px] text-text-faint">
            <Shield className="w-4 h-4 text-success" /> 30-day money-back guarantee · No contracts · Cancel anytime
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" className="section-spacing px-5 bg-bg-section scroll-mt-20">
        <div className="max-w-[700px] mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-12">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="heading-section text-text">Frequently asked questions</h2>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { q: "How fast does the auto-text go out?", a: "Under 60 seconds from the missed call. The first business to respond gets the job 78% of the time." },
              { q: "How is this different from an answering service?", a: "Answering services take messages. We book jobs. Our system texts back instantly, qualifies leads through conversation, and books the appointment — no hold music, no human error." },
              { q: "What happens to my existing phone number?", a: "We give you a dedicated local number. Forward your existing line to it, or use it as your after-hours backup. Setup takes about 30 minutes." },
              { q: "Do I need to install any software?", a: "No. Notifications arrive via SMS and email. The dashboard works in any browser. Nothing to install." },
              { q: "What about emergencies?", a: "Our AI detects emergencies — no AC in summer, no heat in winter, gas leaks — and flags them with a priority notification." },
              { q: "Is there a contract?", a: "No contracts. Month-to-month. 30-day money-back guarantee. If you don't book at least 5 extra jobs in your first month, we refund everything." },
              { q: "Will this work with ServiceTitan or Housecall Pro?", a: "Revorax works alongside your existing tools. We capture the leads your current system misses — calls that go to voicemail or ring out." },
            ].map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section id="cta" className="section-spacing px-5 scroll-mt-20">
        <div className="max-w-[520px] mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="heading-section text-text mb-4">Stop losing revenue to missed calls.</h2>
            <p className="body-lg mb-10">Book a free 10-minute walkthrough. See exactly how Revorax recovers your missed leads.</p>
          </motion.div>
          <motion.div variants={scaleUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card-static p-8 text-left">
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); window.location.href = `mailto:hello@revorax.com?subject=Demo — ${fd.get("company")}&body=Name: ${fd.get("name")}%0ACompany: ${fd.get("company")}%0APhone: ${fd.get("phone")}%0AEmail: ${fd.get("email")}`; }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[{ id: "name", label: "Name", ph: "John Smith", type: "text" }, { id: "company", label: "Company", ph: "Smith HVAC", type: "text" }].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={`f-${f.id}`} className="label-caps block mb-1.5">{f.label}</label>
                    <input id={`f-${f.id}`} name={f.id} type={f.type} required placeholder={f.ph} className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-[14px] text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all" />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[{ id: "phone", label: "Phone", ph: "(555) 123-4567", type: "tel" }, { id: "email", label: "Email", ph: "john@smithhvac.com", type: "email" }].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={`f-${f.id}`} className="label-caps block mb-1.5">{f.label}</label>
                    <input id={`f-${f.id}`} name={f.id} type={f.type} required placeholder={f.ph} className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-[14px] text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all" />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary w-full !py-3.5 mt-2">
                <PhoneCall className="w-[18px] h-[18px]" /> Book a free demo
              </button>
              <p className="text-[12px] text-text-faint text-center">10-minute walkthrough · No credit card required</p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border py-14 px-5 bg-white">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid md:grid-cols-[1.5fr,1fr,1fr,1fr] gap-10 mb-14">
            <div>
              <div className="text-[16px] font-bold text-text mb-3">Revorax</div>
              <p className="body-md max-w-[260px] !text-[13px]">Missed call recovery and appointment booking for HVAC companies. Built to recover revenue.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "How It Works", "FAQ"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="label-caps mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (<li key={l}><a href="#" className="text-[13.5px] text-text-muted hover:text-text transition-colors">{l}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[12px] text-text-faint">© {new Date().getFullYear()} Revorax Inc. All rights reserved.</span>
            <a href="mailto:hello@revorax.com" className="text-[13px] text-text-muted hover:text-text transition-colors flex items-center gap-1.5">hello@revorax.com <ArrowUpRight className="w-3 h-3" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
