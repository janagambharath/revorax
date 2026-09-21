"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Can REvorax handle inbound calls?",
    a: "It can be configured to handle the initial conversation for appointment-related requests and pass the relevant outcome to your team.",
  },
  {
    q: "Can it follow up with existing patients?",
    a: "Yes. Follow-up workflows can be used for patients who are due for another visit, depending on your configured workflow.",
  },
  {
    q: "Can patients speak in Telugu?",
    a: "Yes. REvorax can support patient conversations in Telugu as part of the configured voice workflow.",
  },
  {
    q: "Can patients speak in Hindi?",
    a: "Yes. REvorax can support patient conversations in Hindi as part of the configured voice workflow.",
  },
  {
    q: "Can patients speak to a human?",
    a: "Yes. Human escalation can be part of the workflow.",
  },
  {
    q: "Can it book appointments?",
    a: "When connected to the practice's scheduling system, the workflow can check availability and support appointment booking.",
  },
  {
    q: "Can it send WhatsApp confirmations?",
    a: "WhatsApp messaging can be included when the relevant integration is connected and configured.",
  },
  {
    q: "Does it provide medical advice?",
    a: "No. It is designed for administrative and appointment workflows, not diagnosis or treatment.",
  },
];

export default function FAQ() {
  const { ref, isInView } = useInView();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[720px] mx-auto px-6">
        <div
          className={cn(
            "text-center mb-12 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={cn(
                  "border border-border rounded-xl overflow-hidden transition-all duration-500",
                  isOpen ? "bg-surface-alt" : "bg-white hover:bg-surface-alt/50",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: isInView ? `${i * 60}ms` : "0ms" }}
              >
                <button
                  className="w-full flex items-center justify-between text-left px-5 py-4 gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-semibold text-navy">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-slate shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-5 pb-4 text-[14px] leading-[1.7] text-charcoal">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
