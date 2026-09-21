"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Phone, Brain, CalendarSearch, CalendarPlus, Send, ArrowDown, CheckCircle2 } from "lucide-react";


const steps = [
  { icon: Brain, label: "Understand request", color: "bg-blue-pale text-blue" },
  { icon: CalendarSearch, label: "Check available slots", color: "bg-blue-pale text-blue" },
  { icon: CalendarPlus, label: "Offer suitable times", color: "bg-blue-pale text-blue" },
  { icon: CheckCircle2, label: "Book appointment", color: "bg-emerald-50 text-emerald-600" },
  { icon: Send, label: "Send confirmation", color: "bg-emerald-50 text-emerald-600" },
];

export default function InboundCalls() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left - Call Interface + Photo */}
        <div
          className={cn(
            "order-2 lg:order-1 transition-all duration-700 delay-200",
            isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          )}
        >
          {/* Receptionist photo */}
          <div className="relative rounded-2xl overflow-hidden mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <img
              src="/dental/images/inbound.jpg"
              alt="Dental receptionist managing patient calls at the front desk"
             
             
              className="w-full h-[180px] lg:h-[200px] object-cover"
            />
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Call header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-navy text-white">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Phone size={14} />
              </div>
              <div>
                <div className="text-[13px] font-semibold">Incoming Call</div>
                <div className="text-[11px] text-white/60">Patient line</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-white/60">Connected</span>
              </div>
            </div>

            {/* Conversation */}
            <div className="p-5 space-y-3">
              {/* Patient message */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center text-[10px] font-bold text-slate shrink-0 mt-0.5">
                  P
                </div>
                <div className="bg-surface-alt rounded-lg rounded-tl-sm px-3.5 py-2.5 text-[13px] text-navy max-w-[80%]">
                  I&apos;d like to book an appointment with Dr. Sharma.
                </div>
              </div>

              {/* Workflow steps */}
              <div className="ml-9 py-2 space-y-0">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label}>
                      <div
                        className={cn(
                          "flex items-center gap-2 py-1.5 transition-all duration-500",
                          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        )}
                        style={{ transitionDelay: isInView ? `${300 + i * 120}ms` : "0ms" }}
                      >
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", step.color)}>
                          <Icon size={11} />
                        </div>
                        <span className="text-[11px] font-medium text-charcoal">{step.label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="ml-3 py-0.5">
                          <ArrowDown size={8} className="text-border" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Confirmation */}
              <div
                className={cn(
                  "bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2 transition-all duration-500",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
                style={{ transitionDelay: isInView ? "900ms" : "0ms" }}
              >
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-[13px] font-semibold text-emerald-700">Appointment confirmed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Copy */}
        <div
          className={cn(
            "order-1 lg:order-2 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-block text-[12px] font-semibold tracking-[0.12em] uppercase text-blue mb-4">
            Inbound Calls
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Every Patient Call Gets an Answer
          </h2>

          <div className="mt-5 space-y-4 text-[15px] leading-[1.7] text-charcoal">
            <p>
              When a patient calls your practice, the system can handle the initial conversation and help them book an appointment.
            </p>
            <p>
              Patients get a faster response without waiting for your receptionist to become available.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
