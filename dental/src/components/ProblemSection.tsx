"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { PhoneOff, UserX, ListRestart, CalendarX } from "lucide-react";


const problems = [
  {
    icon: PhoneOff,
    title: "Missed Calls",
    desc: "Patients can't always reach your front desk when they call.",
  },
  {
    icon: UserX,
    title: "Patients Who Don't Return",
    desc: "Existing patients may need another visit but never schedule it.",
  },
  {
    icon: ListRestart,
    title: "Treatment Drop-Off",
    desc: "Multi-session treatment plans depend on patients returning on time.",
  },
  {
    icon: CalendarX,
    title: "Last-Minute Cancellations",
    desc: "Open slots can stay empty when cancellations aren't filled quickly.",
  },
];

export default function ProblemSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="product" className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        {/* Photo + Heading */}
        <div
          className={cn(
            "max-w-[800px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Reception desk photo */}
          <div className="relative rounded-2xl overflow-hidden mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <img
              src="/dental/images/problem.jpg"
              alt="Dental clinic reception desk with staff managing patient appointments"
             
             
              className="w-full h-[240px] lg:h-[320px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-[14px] font-medium text-white/80">
                Your front desk is busy. Patients don&apos;t always wait.
              </p>
            </div>
          </div>

          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Every missed conversation can become a missed appointment.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-charcoal">
            Patients call, postpone, forget, and need follow-ups. Your team shouldn&apos;t have to manually remember every conversation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "group bg-white rounded-xl border border-border p-6 hover:border-blue/20 hover:shadow-[0_4px_24px_rgba(37,99,235,0.06)] transition-all duration-300",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isInView ? `${i * 100}ms` : "0ms" }}
              >
                <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center mb-4 group-hover:bg-blue-pale transition-colors duration-300">
                  <Icon size={20} className="text-navy group-hover:text-blue transition-colors duration-300" />
                </div>
                <h3 className="text-[15px] font-semibold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-[13px] leading-[1.6] text-charcoal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
