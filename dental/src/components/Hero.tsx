"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, CheckCircle2, CalendarCheck } from "lucide-react";


export default function Hero() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="top" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-pale/40 via-white to-white pointer-events-none" />

      <div
        ref={ref}
        className="relative max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
      >
        {/* Left Column - Copy */}
        <div className={cn("transition-all duration-700", isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-[800] leading-[1.1] tracking-[-0.03em] text-navy max-w-[600px]">
            Turn More Patient Calls Into Booked Appointments
          </h1>

          <p className="mt-5 text-[17px] leading-[1.7] text-charcoal max-w-[520px]">
            From new appointment requests to existing-patient follow-ups, automate the conversations that keep your practice moving.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#book-demo"
              className="inline-flex items-center gap-2 h-12 px-7 text-[15px] font-semibold text-white bg-navy rounded-lg hover:bg-navy-light transition-all duration-200 hover:shadow-lg hover:shadow-navy/10"
            >
              Book a Demo
              <ArrowRight size={16} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 h-12 px-7 text-[15px] font-semibold text-navy bg-white border border-border rounded-lg hover:border-navy-muted hover:bg-surface-alt transition-all duration-200"
            >
              See How It Works
              <ChevronDown size={16} />
            </a>
          </div>

          <p className="mt-6 text-[13px] font-medium text-slate tracking-wide uppercase">
            Built for modern dental practices
          </p>
        </div>

        {/* Right Column - Photo + Product UI overlay */}
        <div
          className={cn(
            "relative transition-all duration-700 delay-200",
            isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}
        >
          {/* Photo Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.1)]">
            <img
              src="/dental/images/hero.jpg"
              alt="Dentist consulting with a patient in a modern dental clinic"
             
             
              className="w-full h-[360px] lg:h-[420px] object-cover"
             
            />

            {/* Gradient overlay for card legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Floating Appointment Card */}
            <div
              className={cn(
                "absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 transition-all duration-700 delay-500",
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-pale flex items-center justify-center">
                  <CalendarCheck size={16} className="text-blue" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-navy">Appointment Request</div>
                  <div className="text-[11px] text-slate">Just now</div>
                </div>
              </div>

              {/* Mini conversation */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center text-[8px] font-bold text-slate shrink-0 mt-0.5">P</div>
                  <div className="bg-surface-alt rounded-md px-2.5 py-1.5 text-[11px] text-navy">
                    I&apos;d like to book a check-up.
                  </div>
                </div>
                <div className="flex items-start gap-2 justify-end">
                  <div className="bg-navy rounded-md px-2.5 py-1.5 text-[11px] text-white">
                    Of course. What day works best?
                  </div>
                  <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center text-[8px] font-bold text-navy shrink-0 mt-0.5">R</div>
                </div>
              </div>

              {/* Confirmed state */}
              <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-[12px] font-semibold text-emerald-700">Saturday · 10:30 AM</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Confirmed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
