"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, MessageSquare, CalendarCheck, Clock, CheckCircle2, Wrench, Menu, X } from "lucide-react";
import { HeroTicket } from "@/components/hero-ticket";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-rvx-bone text-rvx-ink selection:bg-rvx-signal selection:text-white">
      {/* 1. NAV */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 border-b ${
          scrolled ? "bg-rvx-bone/95 backdrop-blur-sm border-rvx-hairline" : "bg-rvx-bone border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-wide uppercase">
            <div className="relative w-6 h-6 flex items-center justify-center text-rvx-ink">
              <Phone className="w-5 h-5 absolute" strokeWidth={2} />
              <Wrench className="w-4 h-4 absolute rotate-45 text-rvx-bone bg-rvx-ink rounded-full p-[2px]" strokeWidth={2.5} />
            </div>
            Revorax
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-rvx-ink/80">
            <a href="#product" className="hover:text-rvx-signal transition-colors">Product</a>
            <a href="#pricing" className="hover:text-rvx-signal transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-rvx-signal transition-colors">How it Works</a>
            <a href="#customers" className="hover:text-rvx-signal transition-colors">Customers</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {scrolled && (
              <div className="hidden lg:flex items-center gap-2 border border-rvx-hairline px-3 py-1 bg-rvx-bone">
                <span className="w-2 h-2 rounded-full bg-rvx-signal animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-rvx-ink">
                  Tracking Live Leaks
                </span>
              </div>
            )}
            <a href="/login" className="text-sm font-semibold hover:text-rvx-signal transition-colors">
              Log in
            </a>
            <a
              href="/book-a-demo"
              className="bg-rvx-signal text-rvx-bone text-sm font-semibold px-4 py-2 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_theme(colors.rvx-ink)] transition-all"
            >
              Book a Demo
            </a>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="pt-16">
        {/* 2. HERO TICKET */}
        <HeroTicket />

        {/* 3. HOW IT WORKS */}
        <section id="how-it-works" className="py-24 px-6 border-b border-rvx-hairline overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold uppercase mb-16 text-center">
              How Revorax recovers your revenue
            </h2>
            <div className="grid md:grid-cols-4 gap-4 md:gap-0 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-rvx-hairline border-t border-dashed border-rvx-hairline-dark/20 -z-10" />
              
              {[
                {
                  num: "01",
                  title: "Call Comes In",
                  desc: "Phone rings after hours, during a job, or while you're at lunch.",
                  icon: Phone,
                },
                {
                  num: "02",
                  title: "Revorax Answers",
                  desc: "AI picks up in under 2 rings, sounding like your best dispatcher.",
                  icon: MessageSquare,
                },
                {
                  num: "03",
                  title: "Job Gets Booked",
                  desc: "Checks real availability, books the calendar, and texts a confirmation.",
                  icon: CalendarCheck,
                },
                {
                  num: "04",
                  title: "Follow-Up Sent",
                  desc: "Reminders before the job, review requests after.",
                  icon: Clock,
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="bg-rvx-bone border border-rvx-hairline p-6 relative group hover:-translate-y-1 transition-transform"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-rvx-bone border border-rvx-hairline rounded-full flex items-center justify-center text-rvx-ink md:group-hover:bg-rvx-signal md:group-hover:text-rvx-bone transition-colors">
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-rvx-slate text-sm font-semibold mb-4 mt-2">STEP {step.num}</div>
                  <h3 className="font-display text-xl font-bold uppercase mb-2 leading-tight">{step.title}</h3>
                  <p className="font-body text-sm text-rvx-ink/80">{step.desc}</p>
                  
                  {/* Decorative stub edge */}
                  <div className="absolute -left-1.5 top-1/2 w-3 h-3 bg-rvx-bone border-r border-rvx-hairline rounded-full md:hidden" />
                  <div className="absolute -right-1.5 top-1/2 w-3 h-3 bg-rvx-bone border-l border-rvx-hairline rounded-full md:hidden" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE DEMO (MOCKUP) & 5. STATS */}
        <section id="demo" className="bg-rvx-ink text-rvx-bone py-24 px-6 border-b-8 border-rvx-signal">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold uppercase mb-6 leading-tight text-white">
                See it in action.
              </h2>
              <p className="font-body text-lg text-rvx-bone/70 mb-10 max-w-md">
                This isn't a generic chatbot. Watch how Revorax handles an urgent NO-HEAT call while your team is tied up.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="font-mono text-3xl font-bold text-rvx-signal mb-1 tabular-nums tracking-tighter">
                    $4,200
                  </div>
                  <div className="font-body text-xs text-rvx-bone/50 uppercase tracking-widest font-semibold">
                    Avg Mo. Recovered
                  </div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-rvx-recovered mb-1 tabular-nums tracking-tighter">
                    94%
                  </div>
                  <div className="font-body text-xs text-rvx-bone/50 uppercase tracking-widest font-semibold">
                    Same-Day Response
                  </div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-white mb-1 tabular-nums tracking-tighter">
                    &lt; 2
                  </div>
                  <div className="font-body text-xs text-rvx-bone/50 uppercase tracking-widest font-semibold">
                    Avg Rings to Answer
                  </div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-white mb-1 tabular-nums tracking-tighter">
                    3.2x
                  </div>
                  <div className="font-body text-xs text-rvx-bone/50 uppercase tracking-widest font-semibold">
                    90-Day ROI
                  </div>
                </div>
              </div>

              <a
                href="/book-a-demo"
                className="inline-flex items-center bg-rvx-signal text-white font-body font-bold px-6 py-4 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.rvx-bone)] transition-all uppercase tracking-wide text-sm"
              >
                Simulate a missed call →
              </a>
            </div>

            {/* Mock SMS Frame */}
            <div className="relative mx-auto w-full max-w-sm bg-[#1A1A1A] rounded-[40px] border-[8px] border-[#2C2C2C] p-4 shadow-2xl h-[600px] flex flex-col">
              <div className="w-32 h-6 bg-[#2C2C2C] rounded-full mx-auto mb-6" />
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4 px-2 no-scrollbar">
                <div className="bg-[#2A2A2A] text-white p-3 rounded-2xl rounded-tl-sm text-sm self-start max-w-[85%] font-body">
                  Hi! This is Revorax HVAC. We noticed we just missed your call. How can we help you today?
                </div>
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm self-end max-w-[85%] font-body">
                  My furnace is blowing cold air and it's 40 degrees outside. Need someone ASAP.
                </div>
                <div className="bg-[#2A2A2A] text-white p-3 rounded-2xl rounded-tl-sm text-sm self-start max-w-[85%] font-body">
                  I'm sorry to hear that. I can get a tech out to you today between 2 PM and 4 PM for a diagnostic. Does that time work?
                </div>
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm self-end max-w-[85%] font-body">
                  Yes, that works perfectly. Address is 123 Main St.
                </div>
                <div className="bg-[#2A2A2A] text-white p-3 rounded-2xl rounded-tl-sm text-sm self-start max-w-[85%] font-body flex flex-col gap-2">
                  <span>Great, you're all set for 2-4 PM today at 123 Main St. Our tech will text you when they are on the way.</span>
                  <div className="bg-[#3A3A3A] p-2 rounded flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-rvx-recovered" />
                    <span className="font-mono text-[10px] text-rvx-bone uppercase">Job Booked into Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS */}
        <section id="customers" className="py-24 px-6 border-b border-rvx-hairline bg-rvx-bone">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase mb-16 text-center text-rvx-ink">
              Shops that stopped the bleeding
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { q: "We were losing 3-4 jobs a week because our office manager was on the other line. Revorax paid for itself on day two.", author: "J. MARTINEZ · MARTINEZ HEATING & AIR · DALLAS, TX" },
                { q: "[PLACEHOLDER — replace with real customer quote before launch. Example: Our call volume doubled during the heatwave and Revorax booked them all.]", author: "C. WILLIAMS · WILLIAMS HVAC · PHOENIX, AZ" },
                { q: "[PLACEHOLDER — replace with real customer quote before launch. Example: Customers love getting an immediate text back. It makes us look incredibly professional.]", author: "T. SMITH · SMITH BROS COOLING · TAMPA, FL" }
              ].map((t, i) => (
                <div key={i} className="bg-white border border-rvx-hairline p-8 relative flex flex-col">
                  {/* Torn edge top */}
                  <div className="absolute top-0 left-0 right-0 h-2 -mt-[1px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsNCA4LDAiIGZpbGw9IiNGNUYyRUEiLz48L3N2Zz4=')] bg-repeat-x" />
                  <p className="font-body text-rvx-ink/90 text-lg mb-8 leading-relaxed flex-1 mt-4">"{t.q}"</p>
                  <div className="pt-4 border-t border-dashed border-rvx-hairline mt-auto">
                    <p className="font-mono text-[10px] text-rvx-slate tracking-widest uppercase">{t.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. PRICING */}
        <section id="pricing" className="py-24 px-6 border-b border-rvx-hairline bg-[#FAF9F5]">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase mb-16 text-center text-rvx-ink">
              Simple pricing. Infinite ROI.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { name: "STARTER", trucks: "For shops running 1–3 trucks", features: ["Missed-call answering", "Automated text booking", "Up to 150 calls/mo"], price: "Talk to us" },
                { name: "GROWTH", trucks: "For shops running 4–10 trucks", pop: true, features: ["Everything in Starter", "Automated follow-up", "Review requests", "No-show recovery texts", "Up to 600 calls/mo"], price: "Talk to us" },
                { name: "FLEET", trucks: "For shops running 10+ trucks", features: ["Everything in Growth", "Multi-location routing", "Dedicated onboarding", "Priority support", "Custom volume"], price: "Custom pricing" }
              ].map((tier) => (
                <div key={tier.name} className={`bg-white border ${tier.pop ? 'border-rvx-signal shadow-[4px_4px_0_0_theme(colors.rvx-signal)]' : 'border-rvx-hairline'} p-8 relative flex flex-col`}>
                  {tier.pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rvx-signal text-white font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1">★ Most Popular</div>}
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide mb-2 text-rvx-ink">{tier.name}</h3>
                  <p className="font-mono text-xs text-rvx-slate uppercase tracking-wider mb-6 pb-6 border-b border-dashed border-rvx-hairline">{tier.trucks}</p>
                  <ul className="flex-1 space-y-4 mb-8">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-rvx-recovered shrink-0 mt-0.5" strokeWidth={3} />
                        <span className="font-body text-sm text-rvx-ink/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="/book-a-demo" className={`text-center font-mono font-bold uppercase tracking-widest py-3 border transition-colors ${tier.pop ? 'bg-rvx-signal text-white border-rvx-signal hover:bg-rvx-ink hover:border-rvx-ink' : 'bg-rvx-bone text-rvx-ink border-rvx-hairline hover:border-rvx-ink hover:bg-white'}`}>
                    {tier.price}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FINAL CTA BAND */}
        <section className="bg-rvx-ink text-center py-32 px-6 relative overflow-hidden border-t-4 border-rvx-signal">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#182B1B,_transparent_50%)] opacity-30" />
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="font-display text-4xl md:text-6xl font-extrabold uppercase mb-10 text-white leading-[1.1]">
              Stop losing jobs to a phone that doesn't answer.
            </h2>
            <a
              href="/book-a-demo"
              className="inline-flex items-center bg-rvx-signal text-white font-body font-bold text-lg px-10 py-5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.rvx-bone)] transition-all uppercase tracking-wider"
            >
              Book a Demo
            </a>
          </div>
        </section>
      </main>

      {/* 9. FOOTER */}
      <footer className="bg-rvx-ink border-t border-rvx-hairline-dark text-rvx-bone py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl tracking-wide uppercase mb-4 text-white">
              <div className="relative w-6 h-6 flex items-center justify-center text-white">
                <Phone className="w-5 h-5 absolute" strokeWidth={2} />
                <Wrench className="w-4 h-4 absolute rotate-45 text-rvx-ink bg-white rounded-full p-[2px]" strokeWidth={2.5} />
              </div>
              Revorax
            </div>
            <p className="font-mono text-xs text-rvx-slate uppercase tracking-wider leading-relaxed">
              Revenue recovery for service businesses.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[10px] font-bold text-white uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-3 font-body text-sm text-rvx-slate">
              <li><a href="#how-it-works" className="hover:text-rvx-signal">How it Works</a></li>
              <li><a href="#pricing" className="hover:text-rvx-signal">Pricing</a></li>
              <li><a href="#customers" className="hover:text-rvx-signal">Customers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] font-bold text-white uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-3 font-body text-sm text-rvx-slate">
              <li><a href="/about" className="hover:text-rvx-signal">About Us</a></li>
              <li><a href="/contact" className="hover:text-rvx-signal">Contact</a></li>
              <li><a href="/login" className="hover:text-rvx-signal">Partner Login</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[10px] font-bold text-white uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-3 font-body text-sm text-rvx-slate">
              <li><a href="/privacy" className="hover:text-rvx-signal">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-rvx-signal">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-rvx-hairline-dark font-mono text-[10px] text-rvx-slate text-center uppercase tracking-widest">
          © {new Date().getFullYear()} Revorax Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
