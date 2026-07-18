"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleAlert, LoaderCircle, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
import { ApiError, login, signup, storeTokens } from "@/lib/revorax-api";

type AuthMode = "login" | "signup";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-rvx-ink text-white">
        <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rvx-signal" />
        <PhoneCall className="relative h-[18px] w-[18px]" strokeWidth={2.4} />
      </span>
      <span className="text-[1.12rem] font-bold tracking-[-0.055em] text-rvx-ink">revorax</span>
    </div>
  );
}

function safeNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/dashboard") ? requested : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reason") === "session"
      ? "Your session ended. Sign in to continue."
      : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setError(null);
    setSessionMessage(null);
    setSubmitting(true);

    try {
      const tokens = mode === "login"
        ? await login(email, password)
        : await signup(
          String(form.get("full_name") || "").trim(),
          email,
          password,
          String(form.get("phone") || "").trim() || undefined,
          String(form.get("invite_code") || "").trim() || undefined,
        );
      storeTokens(tokens);
      router.replace(safeNextPath());
    } catch (cause) {
      if (cause instanceof ApiError) setError(cause.message);
      else setError("We could not complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSessionMessage(null);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-rvx-canvas px-5 py-7 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="Revorax home"><BrandMark /></Link>
        <Link href="/" className="text-[12px] font-bold text-rvx-slate transition hover:text-rvx-ink">Back to site</Link>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl overflow-hidden rounded-[31px] border border-rvx-border bg-white shadow-[0_30px_80px_rgba(24,44,35,0.1)] lg:grid-cols-[0.98fr_1.02fr]">
        <section className="relative overflow-hidden bg-rvx-ink p-7 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rvx-violet/65 blur-[85px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-rvx-signal/38 blur-[80px]" />
          <div className="relative flex h-full flex-col">
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-rvx-mint"><span className="h-1.5 w-1.5 rounded-full bg-rvx-recovered" /> Revorax operations</p>
            <h1 className="mt-5 max-w-md text-4xl font-bold leading-[1.02] tracking-[-0.065em] sm:text-5xl">A more prepared response for every caller.</h1>
            <p className="mt-5 max-w-md text-[14px] leading-6 text-white/65">Your desk brings missed calls, AI qualification, SMS context, and booked work into a single focused place.</p>
            <div className="mt-10 space-y-4">
              {[
                [Sparkles, "AI qualification", "Clear service intent and urgency, ready for a human next step."],
                [PhoneCall, "Missed-call recovery", "Give callers a helpful path forward while your team is busy."],
                [ShieldCheck, "Business-owned workspace", "Every lead, call, and appointment stays organized by your business."],
              ].map(([Icon, title, description]) => {
                const BenefitIcon = Icon as typeof Sparkles;
                return <div key={title as string} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-rvx-mint"><BenefitIcon className="h-4 w-4" /></span><div><p className="text-[12px] font-bold">{title as string}</p><p className="mt-0.5 max-w-sm text-[11px] leading-5 text-white/55">{description as string}</p></div></div>;
              })}
            </div>
            <p className="mt-auto pt-12 text-[10px] font-medium text-white/45">Built for the call you could not take.</p>
          </div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="inline-flex rounded-xl border border-rvx-border bg-rvx-canvas p-1" aria-label="Sign-in options">
            <button type="button" onClick={() => switchMode("login")} className={`rounded-lg px-4 py-2 text-[11px] font-bold transition ${mode === "login" ? "bg-white text-rvx-ink shadow-sm" : "text-rvx-slate hover:text-rvx-ink"}`}>Sign in</button>
            <button type="button" onClick={() => switchMode("signup")} className={`rounded-lg px-4 py-2 text-[11px] font-bold transition ${mode === "signup" ? "bg-white text-rvx-ink shadow-sm" : "text-rvx-slate hover:text-rvx-ink"}`}>Join pilot</button>
          </div>
          <h2 className="mt-7 text-3xl font-bold tracking-[-0.055em] text-rvx-ink">{mode === "login" ? "Welcome back." : "Start your operations desk."}</h2>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-rvx-slate">{mode === "login" ? "Sign in to review customers, calls, and the work waiting for your team." : "Join an approved Revorax pilot. You will add your business details in the next step."}</p>

          {sessionMessage && <div className="mt-5 flex items-start gap-2 rounded-xl border border-rvx-recovered/20 bg-rvx-mint px-3 py-2.5 text-[12px] leading-5 text-rvx-recovered"><Check className="mt-0.5 h-4 w-4 shrink-0" />{sessionMessage}</div>}
          {error && <div className="mt-5 flex items-start gap-2 rounded-xl border border-rvx-signal/25 bg-rvx-peach px-3 py-2.5 text-[12px] leading-5 text-rvx-signal"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            {mode === "signup" && <><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Your name<input required name="full_name" autoComplete="name" placeholder="Alex Morgan" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Mobile phone <span className="font-medium text-rvx-slate">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="(555) 000-0000" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label><label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Pilot invitation code<input required name="invite_code" autoComplete="off" placeholder="Provided by Revorax" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label></>}
            <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Work email<input required name="email" type="email" autoComplete="email" placeholder="alex@company.com" className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
            <label className="grid gap-1.5 text-[11px] font-bold text-rvx-ink">Password<input required name="password" type="password" minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="h-11 rounded-xl border border-rvx-border bg-rvx-canvas px-3 text-[13px] font-medium outline-none transition placeholder:text-rvx-slate/65 focus:border-rvx-ink focus:ring-2 focus:ring-rvx-mint" /></label>
            {mode === "signup" && <p className="-mt-1 text-[10px] leading-5 text-rvx-slate">Use the invitation from Revorax. You will set business hours, services, and your greeting after signup.</p>}
            <button disabled={submitting} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rvx-ink px-4 text-[13px] font-bold text-white transition hover:bg-rvx-signal disabled:cursor-not-allowed disabled:opacity-65">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{submitting ? "Please wait…" : mode === "login" ? "Open my operations desk" : "Join the pilot"}</button>
          </form>
          <p className="mt-6 text-center text-[11px] text-rvx-slate">{mode === "login" ? <>Have a pilot invitation? <button type="button" onClick={() => switchMode("signup")} className="font-bold text-rvx-ink hover:text-rvx-signal">Join the pilot</button></> : <>Already have an account? <button type="button" onClick={() => switchMode("login")} className="font-bold text-rvx-ink hover:text-rvx-signal">Sign in</button></>}</p>
        </section>
      </div>
    </main>
  );
}
