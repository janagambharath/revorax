"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature element: the live Revenue Leak Counter.
 * Represents money lost to missed HVAC calls, ticking up ambiently,
 * paired with a recovered-percentage fill bar. This IS the pitch,
 * rendered as UI — not decorative chrome.
 */
function LeakCounter() {
  const [leaked, setLeaked] = useState(14822);
  const recoveredPct = 62;
  const prefersReducedMotion = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(
      () => {
        setLeaked((prev) => prev + Math.floor(Math.random() * 40) + 10);
      },
      prefersReducedMotion ? 2500 : 800
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [prefersReducedMotion]);

  const formatted = leaked.toLocaleString("en-US");

  return (
    <div
      className="relative w-full max-w-md bg-rvx-ink text-rvx-bone p-6 shadow-[6px_6px_0_0_var(--tw-shadow-color)] shadow-rvx-signal/40"
      role="status"
      aria-live="polite"
    >
      <p className="font-mono text-[11px] tracking-[0.15em] text-rvx-slate uppercase mb-2">
        Live · Industry-wide today
      </p>
      <p className="font-mono text-[11px] tracking-[0.1em] text-rvx-signal uppercase mb-1">
        Revenue leaking to missed calls
      </p>
      <p className="font-mono text-4xl sm:text-5xl font-medium tabular-nums leading-none mb-4">
        ${formatted}
      </p>
      <div className="h-2 w-full bg-rvx-hairline-dark overflow-hidden">
        <motion.div
          className="h-full bg-rvx-recovered"
          initial={{ width: 0 }}
          animate={{ width: `${recoveredPct}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: "easeOut" }}
        />
      </div>
      <p className="font-mono text-xs text-rvx-recovered mt-2">
        {recoveredPct}% recovered by shops on Revorax
      </p>
    </div>
  );
}

export function HeroTicket() {
  return (
    <section className="relative bg-rvx-bone overflow-hidden border-b border-rvx-hairline">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#182B1B,_#0F1B12)] opacity-0" />
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="relative border border-rvx-hairline bg-rvx-bone">
          {/* Ticket top strip */}
          <div className="flex items-center justify-between border-b border-dashed border-rvx-hairline px-6 py-3">
            <span className="font-mono text-xs tracking-[0.1em] text-rvx-slate uppercase">
              Work Order #04471
            </span>
            <motion.span
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: -4, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="font-mono text-xs font-semibold tracking-[0.1em] uppercase border-2 border-rvx-signal text-rvx-signal px-2 py-0.5"
            >
              Status: Missed Call
            </motion.span>
          </div>

          <div className="grid gap-10 px-6 py-12 md:grid-cols-2 md:items-center md:px-10 md:py-16">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase leading-[1.05] text-rvx-ink">
                Every missed call is a job you paid to lose.
              </h1>
              <p className="mt-5 max-w-md font-body text-lg text-rvx-ink/80">
                Revorax answers, books, and follows up automatically — so your
                phone never costs you money again.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#demo"
                  className="inline-flex items-center bg-rvx-signal text-rvx-bone font-body font-semibold px-6 py-3 transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.rvx-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
                >
                  See it recover a call →
                </a>
                <a
                  href="/book-a-demo"
                  className="inline-flex items-center border border-rvx-ink text-rvx-ink font-body font-semibold px-6 py-3 transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.rvx-signal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rvx-signal"
                >
                  Talk to a human
                </a>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <LeakCounter />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
