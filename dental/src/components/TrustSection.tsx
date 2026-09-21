"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Shield, Users, HeartHandshake, Lock } from "lucide-react";

const principles = [
  {
    icon: Shield,
    title: "Honest identity",
    desc: "Patients are never misled about who they're speaking with.",
  },
  {
    icon: Users,
    title: "Human handoff",
    desc: "Patients can request your team when they need a person.",
  },
  {
    icon: HeartHandshake,
    title: "No medical advice",
    desc: "The system does not diagnose or prescribe.",
  },
  {
    icon: Lock,
    title: "Privacy-conscious",
    desc: "Patient information is handled within your configured practice workflows.",
  },
];

export default function TrustSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[600px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Built for real patient conversations.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1000px] mx-auto">
          {principles.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "text-center transition-all duration-500",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isInView ? `${i * 100}ms` : "0ms" }}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-navy" />
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
