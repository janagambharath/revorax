"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Headphones,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  Menu,
  MessageSquare,
  Phone,
  PhoneCall,
  Sparkles,
  UserRoundCheck,
  Volume2,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#workflow" },
  { label: "Plans", href: "#plans" },
  { label: "FAQ", href: "#faq" },
];

const capabilities = [
  {
    icon: PhoneCall,
    eyebrow: "Missed call recovery",
    title: "Reply while the phone is still top of mind.",
    description:
      "Revorax sends a thoughtful text back when your team cannot answer, so the conversation has somewhere to go.",
    tint: "bg-rvx-mint",
    iconTint: "bg-rvx-ink text-white",
  },
  {
    icon: Volume2,
    eyebrow: "Voicemail intelligence",
    title: "Hear the whole story without replaying it.",
    description:
      "Voicemails become readable transcripts and clear summaries your office can act on without the back-and-forth.",
    tint: "bg-rvx-peach",
    iconTint: "bg-rvx-signal text-white",
  },
  {
    icon: Sparkles,
    eyebrow: "AI qualification",
    title: "Know what the caller needs next.",
    description:
      "Capture the service request, urgency, preferred timing, and service area in a lead your team can understand at a glance.",
    tint: "bg-rvx-lilac-soft",
    iconTint: "bg-rvx-violet text-white",
  },
  {
    icon: BellRing,
    eyebrow: "Team visibility",
    title: "Keep the right person in the loop.",
    description:
      "New leads, call history, messages, and appointments live in one focused workspace instead of a scattered inbox.",
    tint: "bg-rvx-sky",
    iconTint: "bg-rvx-recovered text-white",
  },
];

const workflowSteps = [
  {
    title: "A call is missed",
    label: "Incoming call",
    description:
      "Revorax records the first touch, so a busy field day does not turn into an invisible opportunity.",
    detail: "Caller, time, voicemail, and source are captured in one place.",
    icon: Phone,
  },
  {
    title: "A helpful text goes out",
    label: "Immediate outreach",
    description:
      "The caller receives a professional path forward instead of waiting for a return call with no context.",
    detail: "The conversation can collect the essentials your office needs to respond.",
    icon: MessageSquare,
  },
  {
    title: "Intent becomes a lead",
    label: "AI qualification",
    description:
      "Revorax turns voicemail and SMS details into a useful summary, with the service need and urgency made clear.",
    detail: "Your team sees what happened and what needs attention next.",
    icon: Sparkles,
  },
  {
    title: "Your team takes the next step",
    label: "Ready for follow-up",
    description:
      "A clean lead record gives dispatch a fast, informed handoff when it is time to call, schedule, or escalate.",
    detail: "Nothing critical is left buried in a voicemail inbox.",
    icon: UserRoundCheck,
  },
];

const planCards = [
  {
    name: "Start",
    description: "For a single office ready to stop losing the first conversation.",
    features: ["Missed-call text recovery", "Voicemail transcription", "Lead workspace"],
  },
  {
    name: "Grow",
    description: "For busy HVAC teams that need more clarity across every incoming lead.",
    features: ["Everything in Start", "AI lead qualification", "Lead alerts and activity visibility"],
    featured: true,
  },
  {
    name: "Tailored",
    description: "For teams planning a deliberate rollout around their call volume and process.",
    features: ["Everything in Grow", "Guided onboarding", "A rollout plan for your operation"],
  },
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Revorax home">
      <div
        className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl ${
          inverse ? "bg-white" : "bg-rvx-ink"
        }`}
      >
        <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rvx-signal" />
        <PhoneCall className={`relative h-[18px] w-[18px] ${inverse ? "text-rvx-ink" : "text-white"}`} strokeWidth={2.4} />
      </div>
      <span className={`text-[1.12rem] font-bold tracking-[-0.055em] ${inverse ? "text-white" : "text-rvx-ink"}`}>
        revorax
      </span>
    </div>
  );
}

function SectionEyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] ${light ? "text-rvx-mint" : "text-rvx-slate"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-rvx-recovered" : "bg-rvx-signal"}`} />
      {children}
    </div>
  );
}

function CommandCenter() {
  const [isFlowActive, setIsFlowActive] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[720px] pt-8 lg:pt-3">
      <div className="pointer-events-none absolute -right-14 top-1 h-44 w-44 rounded-full bg-rvx-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-9 h-36 w-36 rounded-full bg-rvx-signal/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[28px] border border-rvx-border bg-white shadow-[0_28px_80px_rgba(24,44,35,0.14)]"
      >
        <div className="flex items-center justify-between border-b border-rvx-border px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-rvx-signal/75" />
              <span className="h-2 w-2 rounded-full bg-rvx-border" />
              <span className="h-2 w-2 rounded-full bg-rvx-border" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.08em] text-rvx-slate">REVORAX / LEAD DESK</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-rvx-mint px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-rvx-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-rvx-recovered" />
            Live workspace
          </div>
        </div>

        <div className="grid min-h-[470px] grid-cols-1 sm:grid-cols-[54px_minmax(0,1fr)]">
          <aside className="hidden border-r border-rvx-border bg-[#F8FAF7] py-4 sm:flex sm:flex-col sm:items-center sm:gap-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-rvx-ink text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-lg text-rvx-slate">
              <Inbox className="h-4 w-4" />
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-lg text-rvx-slate">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="mt-auto grid h-8 w-8 place-items-center rounded-lg bg-rvx-lilac-soft text-rvx-violet">
              <Sparkles className="h-4 w-4" />
            </div>
          </aside>

          <div className="p-3.5 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate">Missed call recovery</p>
                <p className="mt-1 text-sm font-bold tracking-[-0.025em] text-rvx-ink">A clear next step for every caller</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFlowActive((active) => !active)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rvx-border bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.09em] text-rvx-ink transition hover:border-rvx-ink hover:bg-rvx-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
                aria-pressed={isFlowActive}
              >
                {isFlowActive ? <Activity className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                {isFlowActive ? "Flow active" : "Preview flow"}
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.8fr)]">
              <div className="rounded-2xl bg-rvx-ink p-4 text-white shadow-[0_12px_24px_rgba(15,40,30,0.15)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative grid h-9 w-9 place-items-center rounded-full bg-rvx-signal text-sm font-bold">LC</div>
                    <div>
                      <p className="text-xs font-bold">Lena Carter</p>
                      <p className="mt-0.5 text-[10px] text-white/55">Missed call - 1:42 PM</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-mint">New lead</span>
                </div>

                <div className="mt-5 rounded-xl bg-white/[0.08] p-3">
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>{isFlowActive ? "Sending thoughtful reply" : "Voicemail ready"}</span>
                    <span>{isFlowActive ? "Now" : "0:27"}</span>
                  </div>
                  <div className="mt-3 flex h-7 items-end gap-1" aria-hidden="true">
                    {[12, 24, 17, 27, 14, 23, 30, 18, 26, 13, 20, 28, 16, 25, 12, 21, 29, 15, 19, 11].map((height, index) => (
                      <motion.span
                        key={index}
                        className="w-full rounded-full bg-rvx-mint"
                        animate={isFlowActive && !reducedMotion ? { height: [`${height - 6}%`, `${height + 14}%`, `${height}%`] } : { height: `${height}%` }}
                        transition={{ duration: 0.8, repeat: isFlowActive ? Infinity : 0, delay: index * 0.025 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-rvx-mint">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI lead summary
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/75">
                    No cooling upstairs. Wants service today if possible. ZIP and preferred time captured by text.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-rvx-border bg-rvx-mint p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-rvx-recovered shadow-sm">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-recovered">Text thread</span>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold leading-relaxed text-rvx-ink">Thanks for calling. Tell us a little about what is happening...</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-rvx-slate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rvx-recovered" />
                    Reply sent
                  </div>
                </div>

                <div className="rounded-2xl border border-rvx-border bg-rvx-lilac-soft p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-rvx-violet shadow-sm">
                      <UserRoundCheck className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-violet">Handoff</span>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold leading-relaxed text-rvx-ink">Urgency, service need, and contact details are ready for the office.</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-rvx-slate">
                    <BellRing className="h-3.5 w-3.5 text-rvx-violet" />
                    Team alerted
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Service", "AC repair"],
                ["Urgency", "Today"],
                ["Preferred time", "After 3 PM"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-rvx-border bg-[#FBFCFA] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-rvx-slate">{label}</p>
                  <p className="mt-1 text-[11px] font-bold text-rvx-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -15, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.35 }}
        className="absolute -left-3 top-14 hidden w-48 rounded-2xl border border-rvx-border bg-white p-3 shadow-[0_18px_42px_rgba(24,44,35,0.14)] sm:block lg:-left-12"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-rvx-peach text-rvx-signal">
            <span className="absolute h-8 w-8 animate-ping rounded-full bg-rvx-signal/15" />
            <Phone className="relative h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-rvx-ink">Missed call caught</p>
            <p className="text-[9px] text-rvx-slate">Recovery sequence started</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleEscape);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  async function handleDemoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("loading");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          company: formData.get("company"),
          phone: formData.get("phone"),
          email: formData.get("email"),
        }),
      });

      if (!response.ok) throw new Error("Unable to send demo request");
      form.reset();
      setFormStatus("success");
    } catch {
      setFormStatus("error");
    }
  }

  const currentStep = workflowSteps[activeWorkflow];
  const CurrentStepIcon = currentStep.icon;

  return (
    <div className="min-h-screen overflow-x-clip bg-rvx-canvas text-rvx-ink selection:bg-rvx-signal selection:text-white">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-rvx-border bg-rvx-canvas/88 shadow-[0_4px_18px_rgba(24,44,35,0.03)] backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-7 lg:px-8">
          <a href="#top" aria-label="Revorax home" onClick={closeMobileMenu}>
            <BrandMark />
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-[13px] font-semibold text-rvx-slate transition-colors hover:text-rvx-ink">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a href="#workflow" className="px-3 py-2 text-[13px] font-semibold text-rvx-ink transition-colors hover:text-rvx-signal">
              See the workflow
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full bg-rvx-ink px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(16,40,30,0.15)] transition hover:-translate-y-0.5 hover:bg-rvx-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
            >
              Book a demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-rvx-border bg-white text-rvx-ink lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-rvx-border bg-rvx-canvas px-5 pb-5 shadow-[0_14px_32px_rgba(24,44,35,0.08)] lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-rvx-ink hover:bg-white"
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-rvx-slate" />
                </a>
              ))}
              <a
                href="#demo"
                onClick={closeMobileMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-rvx-ink px-4 py-3 text-sm font-bold text-white"
              >
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section id="product" className="relative isolate overflow-hidden pb-14 pt-[132px] sm:pb-20 sm:pt-[150px] lg:pb-28">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[10%] top-0 h-[460px] w-[460px] rounded-full bg-rvx-mint/80 blur-[110px]" />
            <div className="absolute right-[-6%] top-20 h-[420px] w-[420px] rounded-full bg-rvx-lilac-soft/80 blur-[105px]" />
            <div className="absolute bottom-0 left-1/2 h-48 w-[72%] -translate-x-1/2 rounded-full bg-rvx-peach/60 blur-[100px]" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 lg:px-8">
            <div className="max-w-xl lg:pr-6">
              <SectionEyebrow>AI-assisted missed-call recovery for HVAC</SectionEyebrow>
              <h1 className="max-w-[620px] text-[3.1rem] font-bold leading-[0.97] tracking-[-0.066em] text-rvx-ink sm:text-6xl lg:text-[4.7rem]">
                Every missed call can still become a <span className="bg-gradient-to-r from-rvx-signal via-rvx-signal to-rvx-violet bg-clip-text text-transparent">clear next step.</span>
              </h1>
              <p className="mt-6 max-w-[540px] text-[17px] leading-8 text-rvx-slate sm:text-lg">
                Revorax turns missed HVAC calls into qualified leads. It reaches back by text, understands the service request, flags urgency, and gives your team the context to follow up with confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-full bg-rvx-ink px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_14px_24px_rgba(16,40,30,0.16)] transition hover:-translate-y-0.5 hover:bg-rvx-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
                >
                  Book a demo
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 rounded-full border border-rvx-border bg-white/80 px-5 py-3.5 text-[13px] font-bold text-rvx-ink transition hover:-translate-y-0.5 hover:border-rvx-ink hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
                >
                  Explore the workflow
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] font-semibold text-rvx-slate">
                {[
                  "Built for high-urgency service calls",
                  "Made for a busy office and field team",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-rvx-recovered" strokeWidth={2.5} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <CommandCenter />
          </div>
        </section>

        <section className="border-y border-rvx-border bg-white/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-rvx-border px-5 sm:grid-cols-4 sm:divide-y-0 sm:px-7 lg:px-8">
            {[
              [PhoneCall, "Capture the call"],
              [MessageSquare, "Start the conversation"],
              [Sparkles, "Understand the urgency"],
              [UserRoundCheck, "Give dispatch context"],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof PhoneCall;
              return (
                <div key={label as string} className="flex min-h-[92px] items-center gap-3 px-3 py-5 sm:justify-center sm:px-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rvx-canvas text-rvx-signal">
                    <FeatureIcon className="h-4 w-4" />
                  </div>
                  <span className="max-w-[112px] text-xs font-bold leading-4 text-rvx-ink">{label as string}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-5 py-20 sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Designed for the moment after the ring</SectionEyebrow>
              <h2 className="text-4xl font-bold leading-[1.03] tracking-[-0.056em] text-rvx-ink sm:text-5xl">A calmer front door for your service business.</h2>
              <p className="mt-5 text-[16px] leading-7 text-rvx-slate">
                The work is already urgent. Your lead follow-up should feel organized, timely, and unmistakably human to the caller.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <motion.article
                    key={capability.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.07 }}
                    className={`group min-h-[286px] rounded-[22px] border border-rvx-border p-6 shadow-[0_10px_28px_rgba(24,44,35,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(24,44,35,0.08)] ${capability.tint}`}
                  >
                    <div className={`grid h-11 w-11 place-items-center rounded-xl shadow-sm ${capability.iconTint}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate">{capability.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-bold leading-[1.05] tracking-[-0.045em] text-rvx-ink">{capability.title}</h3>
                    <p className="mt-4 text-[13px] leading-6 text-rvx-slate">{capability.description}</p>
                    <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-rvx-ink opacity-0 transition-opacity group-hover:opacity-100">
                      Built into the lead desk <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-y border-rvx-border bg-[#F2F5F0] px-5 py-20 sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-20">
            <div>
              <SectionEyebrow>From a missed ring to a ready lead</SectionEyebrow>
              <h2 className="max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.058em] text-rvx-ink sm:text-5xl">Your team gets the whole story, not just a notification.</h2>
              <p className="mt-5 max-w-lg text-[16px] leading-7 text-rvx-slate">
                Revorax is built around a practical handoff: collect the signal, make it readable, then put it in front of the person who can move it forward.
              </p>

              <div className="mt-9 overflow-hidden rounded-[24px] border border-rvx-border bg-white shadow-[0_18px_40px_rgba(24,44,35,0.07)]">
                <div className="flex items-center justify-between border-b border-rvx-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-rvx-ink text-white"><PhoneCall className="h-4 w-4" /></span>
                    <div>
                      <p className="text-xs font-bold">Lead journey</p>
                      <p className="text-[10px] text-rvx-slate">Example workflow</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rvx-peach px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rvx-signal">Missed call</span>
                </div>
                <div className="p-5">
                  {workflowSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === workflowSteps.length - 1;
                    return (
                      <div key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                        {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%-18px)] w-px bg-rvx-border" />}
                        <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${index === activeWorkflow ? "border-rvx-ink bg-rvx-ink text-white" : "border-rvx-border bg-white text-rvx-slate"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-slate">{step.label}</p>
                          <p className="mt-1 text-[13px] font-bold text-rvx-ink">{step.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-rvx-ink p-4 shadow-[0_24px_60px_rgba(15,40,30,0.18)] sm:p-6">
              <div className="rounded-[21px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-mint">The Revorax recovery path</p>
                    <p className="mt-1 text-sm font-semibold text-white/65">Select a step to explore the handoff.</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-rvx-signal text-white"><Zap className="h-4 w-4" /></span>
                </div>

                <div className="mt-6 grid gap-2">
                  {workflowSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = activeWorkflow === index;
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => setActiveWorkflow(index)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isActive ? "border-rvx-mint/30 bg-white/[0.11]" : "border-transparent bg-white/[0.035] hover:bg-white/[0.07]"
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isActive ? "bg-rvx-mint text-rvx-ink" : "bg-white/[0.09] text-white/65"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-[12px] font-bold text-white">{step.title}</span>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition ${isActive ? "text-rvx-mint" : "text-white/35"}`} />
                      </button>
                    );
                  })}
                </div>

                <motion.div
                  key={currentStep.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 rounded-2xl bg-white p-5 text-rvx-ink"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rvx-lilac-soft text-rvx-violet"><CurrentStepIcon className="h-5 w-5" /></span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-rvx-slate">{currentStep.label}</p>
                      <h3 className="mt-1 text-lg font-bold tracking-[-0.035em]">{currentStep.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] leading-6 text-rvx-slate">{currentStep.description}</p>
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-rvx-mint px-3 py-2.5 text-[11px] font-semibold leading-5 text-rvx-ink">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rvx-recovered" strokeWidth={3} />
                    {currentStep.detail}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-rvx-ink px-5 py-20 text-white sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <div>
                <SectionEyebrow light>Made for the work between calls</SectionEyebrow>
                <h2 className="max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.058em] text-white sm:text-5xl">Your office should not have to piece a lead together from memory.</h2>
              </div>
              <p className="max-w-xl text-[16px] leading-7 text-white/60">
                A focused lead desk turns raw calls, voicemails, and SMS exchanges into context your team can scan quickly. It is designed to make follow-up feel intentional even when the day is not.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-rvx-mint text-rvx-ink"><Inbox className="h-4 w-4" /></span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-rvx-mint">Lead desk</p>
                      <p className="mt-0.5 text-sm font-bold text-white">The important parts, surfaced.</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.09em] text-white/65">Example view</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl bg-white p-4 text-rvx-ink">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-slate">Lead details</p>
                      <span className="rounded-full bg-rvx-peach px-2 py-1 text-[9px] font-bold text-rvx-signal">Needs follow-up</span>
                    </div>
                    <p className="mt-4 text-lg font-bold tracking-[-0.04em]">Lena Carter</p>
                    <p className="mt-1 text-[11px] text-rvx-slate">AC repair - preferred time after 3 PM</p>
                    <div className="mt-5 space-y-2.5 border-t border-rvx-border pt-4">
                      {[
                        ["Service request", "No cooling upstairs"],
                        ["Urgency", "Wants service today"],
                        ["Service area", "ZIP captured"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 text-[10px]">
                          <span className="text-rvx-slate">{label}</span>
                          <span className="text-right font-bold text-rvx-ink">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-rvx-mint">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Conversation context
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/[0.09] px-3 py-2.5 text-[11px] leading-5 text-white/70">Hi Lena, thanks for calling. Tell us a little about what you need help with and a member of the team will follow up.</div>
                      <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-rvx-mint px-3 py-2.5 text-[11px] leading-5 text-rvx-ink">Our upstairs AC is not cooling. I am home after 3 PM today.</div>
                      <div className="flex items-center gap-2 text-[10px] text-white/45"><Sparkles className="h-3.5 w-3.5 text-rvx-mint" /> Details summarized for your team</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  [LockKeyhole, "Built around your business", "Configure your services, hours, greeting, and timezone for a more relevant first response."],
                  [Headphones, "Designed for a human handoff", "Revorax gives your team the detail to take over when the moment calls for it."],
                  [CalendarDays, "Appointments stay visible", "Keep manual appointments alongside the lead that started the conversation."],
                ].map(([Icon, title, description]) => {
                  const CardIcon = Icon as typeof LockKeyhole;
                  return (
                    <div key={title as string} className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.1] text-rvx-mint"><CardIcon className="h-4 w-4" /></span>
                      <h3 className="mt-4 text-sm font-bold text-white">{title as string}</h3>
                      <p className="mt-2 text-[12px] leading-5 text-white/55">{description as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="scroll-mt-24 px-5 py-20 sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Plans that meet your call volume</SectionEyebrow>
              <h2 className="text-4xl font-bold leading-[1.03] tracking-[-0.056em] text-rvx-ink sm:text-5xl">Start with the missed calls that matter most.</h2>
              <p className="mt-5 text-[16px] leading-7 text-rvx-slate">We will help you choose the right launch path for your team, call volume, and lead handoff process.</p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
              {planCards.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex min-h-[360px] flex-col rounded-[24px] border p-6 ${
                    plan.featured ? "border-rvx-ink bg-rvx-ink text-white shadow-[0_20px_45px_rgba(15,40,30,0.16)]" : "border-rvx-border bg-white text-rvx-ink shadow-[0_10px_25px_rgba(24,44,35,0.04)]"
                  }`}
                >
                  {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rvx-signal px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">Most common path</span>}
                  <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${plan.featured ? "text-rvx-mint" : "text-rvx-slate"}`}>Revorax {plan.name}</p>
                  <h3 className="mt-3 text-3xl font-bold tracking-[-0.055em]">{plan.name}</h3>
                  <p className={`mt-4 text-[13px] leading-6 ${plan.featured ? "text-white/65" : "text-rvx-slate"}`}>{plan.description}</p>
                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex gap-2 text-[12px] leading-5 ${plan.featured ? "text-white/80" : "text-rvx-slate"}`}>
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.featured ? "text-rvx-mint" : "text-rvx-recovered"}`} strokeWidth={3} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#demo"
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-bold transition hover:-translate-y-0.5 ${
                      plan.featured ? "bg-white text-rvx-ink hover:bg-rvx-mint" : "border border-rvx-border bg-rvx-canvas text-rvx-ink hover:border-rvx-ink hover:bg-white"
                    }`}
                  >
                    Talk through a plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-y border-rvx-border bg-[#F2F5F0] px-5 py-20 sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
            <div>
              <SectionEyebrow>Questions, answered</SectionEyebrow>
              <h2 className="max-w-md text-4xl font-bold leading-[1.03] tracking-[-0.055em] text-rvx-ink sm:text-5xl">A better first response starts with a clear plan.</h2>
              <p className="mt-5 max-w-md text-[16px] leading-7 text-rvx-slate">We will walk through your current call flow before recommending how Revorax should fit into it.</p>
              <a href="#demo" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-rvx-ink transition hover:text-rvx-signal">Still have a question? Talk with us <ArrowRight className="h-4 w-4" /></a>
            </div>

            <div className="divide-y divide-rvx-border rounded-[22px] border border-rvx-border bg-white px-5 sm:px-7">
              {[
                {
                  question: "What happens when we miss a call?",
                  answer: "Revorax captures the call and can start a text conversation that helps collect the core details your team needs to follow up. Voicemails are transcribed and summarized into a lead record.",
                },
                {
                  question: "Can Revorax identify urgent HVAC requests?",
                  answer: "Yes. The qualification flow is designed to surface the service request and urgency from voicemails or SMS exchanges so your team can prioritize the next response.",
                },
                {
                  question: "Does it replace our dispatcher?",
                  answer: "No. Revorax is built to give dispatchers a better starting point: structured caller context, a readable conversation, and a clear reason for the follow-up.",
                },
                {
                  question: "Can we set it up around our business?",
                  answer: "During onboarding, your team can configure business information including your services, hours, timezone, and greeting so the recovery experience feels appropriate to your operation.",
                },
                {
                  question: "How do we get started?",
                  answer: "Book a conversation below. We will review your current missed-call process and map the best rollout path for your team.",
                },
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-5 py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[14px] font-bold tracking-[-0.02em] text-rvx-ink sm:text-[15px]">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-rvx-slate transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <p className="max-w-2xl pb-5 text-[13px] leading-6 text-rvx-slate">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 bg-rvx-canvas px-5 py-20 sm:px-7 sm:py-28 lg:px-8 lg:py-32">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-rvx-ink px-6 py-10 text-white shadow-[0_24px_55px_rgba(15,40,30,0.2)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute -right-20 -top-28 h-[360px] w-[360px] rounded-full bg-rvx-violet/55 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-40 left-[24%] h-[330px] w-[330px] rounded-full bg-rvx-signal/35 blur-[90px]" />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.8fr)] lg:items-center lg:gap-16">
              <div>
                <SectionEyebrow light>See your missed-call flow clearly</SectionEyebrow>
                <h2 className="max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.058em] text-white sm:text-5xl">Give every caller a better way back to your team.</h2>
                <p className="mt-5 max-w-lg text-[16px] leading-7 text-white/65">Tell us a little about your HVAC business. We will show you how a more organized missed-call recovery flow could work for your team.</p>
                <div className="mt-8 flex flex-wrap gap-4 text-[11px] font-semibold text-white/60">
                  <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-rvx-mint" strokeWidth={3} /> No pressure, just a practical walkthrough</span>
                  <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-rvx-mint" strokeWidth={3} /> Built around your current process</span>
                </div>
              </div>

              <form onSubmit={handleDemoSubmit} className="rounded-[22px] border border-white/10 bg-white p-5 text-rvx-ink shadow-[0_18px_38px_rgba(0,0,0,0.16)] sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-rvx-mint text-rvx-ink"><Sparkles className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-bold">Book your walkthrough</p>
                    <p className="text-[11px] text-rvx-slate">We will follow up using the details below.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">
                    Your name
                    <input required name="name" autoComplete="name" placeholder="Alex Morgan" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" />
                  </label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">
                    Business name
                    <input required name="company" autoComplete="organization" placeholder="Morgan Heating" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" />
                  </label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">
                    Work email
                    <input required name="email" type="email" autoComplete="email" placeholder="alex@company.com" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" />
                  </label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">
                    Phone number
                    <input required name="phone" type="tel" autoComplete="tel" placeholder="(555) 000-0000" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={formStatus === "loading"}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rvx-signal px-4 text-[13px] font-bold text-white transition hover:bg-rvx-ink disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {formStatus === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {formStatus === "loading" ? "Sending request..." : "Request a demo"}
                </button>
                <p className={`mt-3 text-center text-[11px] leading-5 ${formStatus === "success" ? "text-rvx-recovered" : formStatus === "error" ? "text-rvx-signal" : "text-rvx-slate"}`} aria-live="polite">
                  {formStatus === "success" && "Thanks - your demo request is on its way to the Revorax team."}
                  {formStatus === "error" && "We could not send that right now. Please try again in a moment."}
                  {formStatus === "idle" && "By submitting, you are asking Revorax to contact you about a demo."}
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rvx-border bg-white px-5 py-12 sm:px-7 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_repeat(3,0.6fr)]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-rvx-slate">AI-assisted missed-call recovery for HVAC teams who want a clearer next step for every caller.</p>
            <a href="mailto:hello@revorax.com" className="mt-4 inline-flex text-[13px] font-bold text-rvx-ink transition hover:text-rvx-signal">hello@revorax.com</a>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate">Product</p>
            <div className="mt-4 grid gap-3 text-[13px] font-semibold text-rvx-ink">
              <a href="#product" className="hover:text-rvx-signal">Overview</a>
              <a href="#workflow" className="hover:text-rvx-signal">How it works</a>
              <a href="#plans" className="hover:text-rvx-signal">Plans</a>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate">Resources</p>
            <div className="mt-4 grid gap-3 text-[13px] font-semibold text-rvx-ink">
              <a href="#faq" className="hover:text-rvx-signal">FAQ</a>
              <a href="#demo" className="hover:text-rvx-signal">Book a demo</a>
              <a href="mailto:hello@revorax.com" className="hover:text-rvx-signal">Contact</a>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rvx-slate">Built for</p>
            <p className="mt-4 text-[13px] leading-6 text-rvx-slate">HVAC owners, office managers, and dispatch teams handling urgent service calls.</p>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-rvx-border pt-6 text-[11px] font-medium text-rvx-slate sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {new Date().getFullYear()} Revorax. All rights reserved.</span>
          <span>Built for the call you could not take.</span>
        </div>
      </footer>
    </div>
  );
}
