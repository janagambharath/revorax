"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { UserPlus, UserCheck, ListChecks, CalendarX2, RotateCcw } from "lucide-react";

const useCases = [
  {
    icon: UserPlus,
    title: "New Patient Enquiries",
    desc: "Turn incoming appointment requests into scheduled visits.",
  },
  {
    icon: UserCheck,
    title: "Follow-Up Patients",
    desc: "Reach patients who are due for another visit.",
  },
  {
    icon: ListChecks,
    title: "Treatment Plans",
    desc: "Keep patients moving through multi-session care.",
  },
  {
    icon: CalendarX2,
    title: "Cancellations",
    desc: "Help recover appointments that would otherwise become empty slots.",
  },
  {
    icon: RotateCcw,
    title: "Recall / Routine Visits",
    desc: "Stay connected with patients who are due for another visit.",
  },
];

export default function UseCases() {
  const { ref, isInView } = useInView();

  return (
    <section id="use-cases" className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[600px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Built around the moments that affect your schedule.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[900px] mx-auto">
          {useCases.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "group bg-white rounded-xl border border-border p-6 hover:border-blue/20 hover:shadow-[0_4px_20px_rgba(37,99,235,0.05)] transition-all duration-300",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isInView ? `${i * 80}ms` : "0ms" }}
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
