"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { MessageSquare, Search, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";

const workflowSteps = [
  { icon: MessageSquare, label: "Patient Conversation", color: "text-blue" },
  { icon: Search, label: "Intent Detected", color: "text-mint" },
  { icon: CalendarCheck, label: "Appointment Opportunity", color: "text-blue-light" },
  { icon: Clock, label: "Available Slot", color: "text-charcoal" },
  { icon: CheckCircle2, label: "Appointment Confirmed", color: "text-emerald-600" },
];

export default function ProductPreview() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <div ref={ref} className="relative">
      {/* Main Dashboard Card */}
      <div className="bg-white rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-surface-alt border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[11px] font-medium text-slate bg-white px-4 py-1 rounded-md border border-border-light">
              revorax.online/dashboard
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Workflow Pipeline */}
          <div className="space-y-0">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className={cn(
                    "flex items-center gap-3 py-2.5 transition-all duration-500",
                    isInView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  )}
                  style={{ transitionDelay: isInView ? `${i * 120}ms` : "0ms" }}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-surface-alt", step.color)}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[13px] font-medium text-navy">{step.label}</span>
                  {i < workflowSteps.length - 1 && (
                    <div className="ml-auto text-slate-light text-[11px]">→</div>
                  )}
                  {i === workflowSteps.length - 1 && (
                    <div className="ml-auto">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Confirmed
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-border-light" />

          {/* Conversation Card */}
          <div className="bg-surface-alt rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-soft flex items-center justify-center">
                <MessageSquare size={12} className="text-blue" />
              </div>
              <span className="text-[12px] font-semibold text-navy">Patient Conversation</span>
            </div>

            {/* Patient message */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-light/30 flex items-center justify-center text-[10px] font-bold text-slate shrink-0">
                P
              </div>
              <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 text-[12px] text-navy border border-border-light max-w-[85%]">
                Hi, I&apos;d like to book a check-up.
              </div>
            </div>

            {/* System response */}
            <div className="flex gap-2 justify-end">
              <div className="bg-navy rounded-lg rounded-tr-sm px-3 py-2 text-[12px] text-white max-w-[85%]">
                Of course. We have availability Thursday at 4:30 PM or Friday at 11:00 AM.
              </div>
              <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-bold text-navy shrink-0">
                R
              </div>
            </div>

            {/* Confirmation */}
            <div
              className={cn(
                "mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 flex items-center gap-2 transition-all duration-500",
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
              style={{ transitionDelay: isInView ? "700ms" : "0ms" }}
            >
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-emerald-700">Appointment Confirmed</div>
                <div className="text-[10px] text-emerald-600">Thursday · 4:30 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
