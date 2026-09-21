"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { UserCheck, MessageSquare, Clock, CalendarCheck, ArrowDown } from "lucide-react";

const outboundSteps = [
  { icon: UserCheck, label: "Patient due", color: "bg-blue-pale text-blue" },
  { icon: MessageSquare, label: "Follow-up conversation", color: "bg-blue-pale text-blue" },
  { icon: Clock, label: "Preferred appointment time", color: "bg-blue-pale text-blue" },
  { icon: CalendarCheck, label: "Appointment booked", color: "bg-emerald-50 text-emerald-600" },
];

const dueItems = ["Cleaning", "Follow-up", "Orthodontic adjustment", "Post-treatment review"];

export default function OutboundBooking() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left - Copy */}
        <div
          className={cn(
            "transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-block text-[12px] font-semibold tracking-[0.12em] uppercase text-blue mb-4">
            Outbound Appointment Booking
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Don&apos;t Wait for Patients to Call You
          </h2>

          <div className="mt-5 space-y-4 text-[15px] leading-[1.7] text-charcoal">
            <p>
              Some patients need another appointment but never schedule one.
            </p>
            <p>
              The system can contact them and help schedule the next visit.
            </p>
          </div>

          {/* Due list */}
          <div className="mt-6 bg-surface-alt rounded-xl border border-border p-5">
            <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-slate mb-3">
              A patient is due for:
            </div>
            <div className="flex flex-wrap gap-2">
              {dueItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center text-[12px] font-medium text-navy bg-white border border-border px-3 py-1.5 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[14px] text-charcoal">
            More patients return without your staff manually calling every patient.
          </p>
        </div>

        {/* Right - Workflow */}
        <div
          className={cn(
            "transition-all duration-700 delay-200",
            isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}
        >
          <div className="bg-white rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
            <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-slate mb-6">
              Outbound Workflow
            </div>

            <div className="space-y-0">
              {outboundSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label}>
                    <div
                      className={cn(
                        "flex items-center gap-3 py-3 transition-all duration-500",
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                      )}
                      style={{ transitionDelay: isInView ? `${200 + i * 150}ms` : "0ms" }}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-alt text-[13px] font-bold text-slate shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", step.color)}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[14px] font-medium text-navy">{step.label}</span>
                    </div>
                    {i < outboundSteps.length - 1 && (
                      <div className="ml-[18px] py-1">
                        <ArrowDown size={12} className="text-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
