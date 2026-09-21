"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Phone, MessageSquare, UserCheck, Users } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Phone,
    title: "Patient Calls or Becomes Due",
    desc: "An inbound call comes in, or a patient is flagged as due for a follow-up.",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "REvorax Handles the Conversation",
    desc: "The system manages the scheduling conversation with the patient.",
  },
  {
    num: "03",
    icon: UserCheck,
    title: "The Patient Chooses a Next Step",
    desc: "The patient selects their preferred outcome from the conversation.",
  },
  {
    num: "04",
    icon: Users,
    title: "Your Team Gets the Outcome",
    desc: "The result is delivered to your team for action.",
  },
];

const outcomes = [
  "Appointment booked",
  "Callback requested",
  "Not interested",
  "Follow-up needed",
  "Human escalation",
];

export default function HowItWorks() {
  const { ref, isInView } = useInView();

  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[600px] mx-auto text-center mb-16 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            From patient conversation to appointment.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={cn(
                  "relative transition-all duration-500",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isInView ? `${i * 120}ms` : "0ms" }}
              >
                {/* Step Number */}
                <div className="text-[48px] font-[800] leading-none text-surface-raised tracking-[-0.04em] select-none">
                  {step.num}
                </div>

                <div className="mt-3 flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-pale flex items-center justify-center">
                    <Icon size={16} className="text-blue" />
                  </div>
                </div>

                <h3 className="text-[15px] font-semibold text-navy mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-[1.6] text-charcoal">
                  {step.desc}
                </p>

                {/* Connector line - desktop only */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-3 w-6 border-t border-dashed border-border" />
                )}
              </div>
            );
          })}
        </div>

        {/* Outcomes */}
        <div
          className={cn(
            "mt-14 text-center transition-all duration-700 delay-500",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-slate mb-4">
            Example outcomes
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {outcomes.map((outcome) => (
              <span
                key={outcome}
                className="inline-flex items-center text-[13px] font-medium text-navy bg-surface-alt border border-border px-4 py-2 rounded-full"
              >
                {outcome}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
