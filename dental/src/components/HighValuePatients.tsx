"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { User, Stethoscope, Phone, CalendarCheck, MessageCircle, CheckCircle2, ArrowDown } from "lucide-react";


const workflowSteps = [
  { icon: Phone, label: "Contact Rahul", color: "bg-blue-pale text-blue" },
  { icon: CalendarCheck, label: "Offer available slots", color: "bg-blue-pale text-blue" },
  { icon: CheckCircle2, label: "Book the next session", color: "bg-blue-pale text-blue" },
  { icon: CalendarCheck, label: "Confirm the appointment", color: "bg-emerald-50 text-emerald-600" },
  { icon: MessageCircle, label: "Send details through WhatsApp", color: "bg-emerald-50 text-emerald-600" },
];

export default function HighValuePatients() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-dark-bg text-white">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left - Copy + Photo */}
        <div
          className={cn(
            "transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-block text-[12px] font-semibold tracking-[0.12em] uppercase text-blue-light mb-4">
            High-Value Patients
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-white">
            Protect the Patients Who Matter Most
          </h2>

          <div className="mt-6 space-y-4 text-[15px] leading-[1.7] text-slate-light">
            <p>
              Not every patient relationship has the same value to a practice.
            </p>
            <p>
              For patients with ongoing or high-value treatment plans, missed follow-ups can mean missed revenue and interrupted care.
            </p>
            <p>
              The system can help your team stay on top of scheduled sessions.
            </p>
          </div>

          {/* Small real photo */}
          <div className="mt-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src="/dental/images/highvalue.jpg"
              alt="Dentist discussing an ongoing treatment plan with a patient"
             
             
              className="w-full h-[180px] lg:h-[200px] object-cover"
            />
          </div>
        </div>

        {/* Right - Workflow Visualization */}
        <div
          className={cn(
            "transition-all duration-700 delay-200",
            isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}
        >
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-6">
            <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-slate mb-4">
              Example
            </div>
            <p className="text-[14px] text-slate-light mb-5">
              A patient has a multi-session treatment plan.
            </p>

            {/* Patient Info Card */}
            <div className="bg-dark-bg rounded-xl border border-dark-border p-4 mb-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center">
                <User size={18} className="text-blue-light" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">Rahul</div>
                <div className="flex items-center gap-2 text-[12px] text-slate-light">
                  <Stethoscope size={12} />
                  Multi-session treatment
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {workflowSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label}>
                    <div
                      className={cn(
                        "flex items-center gap-3 py-2.5 transition-all duration-500",
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                      )}
                      style={{ transitionDelay: isInView ? `${300 + i * 150}ms` : "0ms" }}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", step.color)}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[13px] font-medium text-white/90">{step.label}</span>
                    </div>
                    {i < workflowSteps.length - 1 && (
                      <div className="ml-4 flex items-center py-1">
                        <ArrowDown size={12} className="text-slate" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* End state */}
            <div
              className={cn(
                "mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-center transition-all duration-500",
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              )}
              style={{ transitionDelay: isInView ? "1100ms" : "0ms" }}
            >
              <div className="text-[13px] font-semibold text-emerald-400">
                Treatment plan keeps moving.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
