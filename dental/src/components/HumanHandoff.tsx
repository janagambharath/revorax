"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Bot, Users, Phone, RefreshCw, CalendarCheck, Bell, MessageCircle, Stethoscope, HelpCircle, Heart, MessagesSquare } from "lucide-react";


const automationItems = [
  { icon: Phone, label: "Calls" },
  { icon: RefreshCw, label: "Follow-ups" },
  { icon: CalendarCheck, label: "Scheduling" },
  { icon: Bell, label: "Reminders" },
  { icon: MessageCircle, label: "Appointment coordination" },
];

const teamItems = [
  { icon: Stethoscope, label: "Clinical decisions" },
  { icon: Heart, label: "Treatment" },
  { icon: HelpCircle, label: "Complex questions" },
  { icon: Users, label: "Patient care" },
  { icon: MessagesSquare, label: "Human conversations" },
];

export default function HumanHandoff() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[640px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Automation Handles the Conversation. Your Team Handles the Care.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-charcoal">
            REvorax is designed to support your front desk, not replace the clinical relationship.
          </p>
        </div>

        {/* Photo strip */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden mb-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] max-w-[800px] mx-auto transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <img
            src="/dental/images/dentist.jpg"
            alt="Dental team providing patient care in a modern clinic"
           
           
            className="w-full h-[200px] lg:h-[260px] object-cover"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          {/* Automation Column */}
          <div
            className={cn(
              "bg-blue-pale/50 rounded-2xl border border-blue-soft p-6 transition-all duration-700",
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: isInView ? "100ms" : "0ms" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center">
                <Bot size={18} className="text-blue" />
              </div>
              <span className="text-[14px] font-semibold text-navy">Automation</span>
            </div>

            <div className="space-y-3">
              {automationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-1.5">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                      <Icon size={14} className="text-blue" />
                    </div>
                    <span className="text-[14px] font-medium text-navy">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Column */}
          <div
            className={cn(
              "bg-surface-alt rounded-2xl border border-border p-6 transition-all duration-700",
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: isInView ? "200ms" : "0ms" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                <Users size={18} className="text-navy" />
              </div>
              <span className="text-[14px] font-semibold text-navy">Your Team</span>
            </div>

            <div className="space-y-3">
              {teamItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-1.5">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                      <Icon size={14} className="text-navy" />
                    </div>
                    <span className="text-[14px] font-medium text-navy">{item.label}</span>
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
