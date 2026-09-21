"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { PhoneIncoming, UserCheck, ListChecks, CalendarClock, BarChart3 } from "lucide-react";

const cards = [
  {
    icon: PhoneIncoming,
    title: "New Appointments",
    desc: "Capture inbound calls that might otherwise be missed.",
  },
  {
    icon: UserCheck,
    title: "Returned Patients",
    desc: "Follow up with existing patients who need another visit.",
  },
  {
    icon: ListChecks,
    title: "Treatment Completion",
    desc: "Keep multi-session treatments moving.",
  },
  {
    icon: CalendarClock,
    title: "Fewer Lost Appointments",
    desc: "Reschedule patients who can't make their original slot.",
  },
  {
    icon: BarChart3,
    title: "Higher Schedule Utilization",
    desc: "Help fill available appointment slots.",
  },
];

export default function RevenueImpact() {
  const { ref, isInView } = useInView();

  return (
    <section id="revenue-impact" className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[600px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-block text-[12px] font-semibold tracking-[0.12em] uppercase text-blue mb-4">
            Revenue Impact
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            More Appointments. More Revenue Opportunities.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-charcoal">
            The system can help create revenue opportunities in several ways.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[900px] mx-auto">
          {cards.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "group bg-white rounded-xl border border-border p-6 hover:border-blue/20 hover:shadow-[0_4px_20px_rgba(37,99,235,0.05)] transition-all duration-300",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                  i >= 3 && "sm:col-span-1"
                )}
                style={{ transitionDelay: isInView ? `${i * 80}ms` : "0ms" }}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-pale flex items-center justify-center mb-4 group-hover:bg-blue-soft transition-colors duration-300">
                  <Icon size={20} className="text-blue" />
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
