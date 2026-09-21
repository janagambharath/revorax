"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

type Lang = "en" | "te" | "hi";

const langLabels: Record<Lang, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

const conversations: Record<Lang, { role: "patient" | "system"; text: string }[]> = {
  en: [
    { role: "patient", text: "Hi, I'd like to book a dental check-up." },
    { role: "system", text: "Of course. What day works best for you?" },
    { role: "patient", text: "Saturday." },
    { role: "system", text: "We have 10:30 AM or 1:00 PM." },
    { role: "patient", text: "10:30 works." },
    { role: "system", text: "Perfect. Your appointment request is confirmed." },
  ],
  te: [
    { role: "patient", text: "Hi, నాకు dental check-up book చేసుకోవాలి." },
    { role: "system", text: "తప్పకుండా. మీకు ఏ రోజు convenient గా ఉంటుంది?" },
    { role: "patient", text: "Saturday." },
    { role: "system", text: "10:30 AM లేదా 1:00 PM available గా ఉంది." },
    { role: "patient", text: "10:30 okay." },
    { role: "system", text: "Done. మీ appointment request confirm అయింది." },
  ],
  hi: [
    { role: "patient", text: "Hi, मुझे dental check-up book करना है।" },
    { role: "system", text: "बिल्कुल। आपके लिए कौन सा दिन ठीक रहेगा?" },
    { role: "patient", text: "Saturday." },
    { role: "system", text: "10:30 AM या 1:00 PM available है।" },
    { role: "patient", text: "10:30 ठीक है।" },
    { role: "system", text: "Done. आपकी appointment request confirm हो गई है।" },
  ],
};

export default function ConversationPreview() {
  const { ref, isInView } = useInView();
  const [activeLang, setActiveLang] = useState<Lang>("en");
  const convo = conversations[activeLang];

  return (
    <section className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "max-w-[720px] mx-auto transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Call UI */}
          <div className="bg-white rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-alt">
              <div className="w-8 h-8 rounded-full bg-blue-pale flex items-center justify-center">
                <Phone size={14} className="text-blue" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-navy">Voice Conversation</div>
                <div className="text-[11px] text-slate">Check-up booking</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate">Active</span>
              </div>
            </div>

            {/* Language Toggle - inside the product UI */}
            <div className="px-5 pt-4 pb-2">
              <div className="inline-flex items-center bg-surface-alt rounded-lg p-0.5 border border-border-light">
                {(Object.keys(langLabels) as Lang[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={cn(
                      "px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200",
                      activeLang === lang
                        ? "bg-white text-navy shadow-sm border border-border-light"
                        : "text-slate hover:text-navy"
                    )}
                  >
                    {langLabels[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="p-5 pt-3 space-y-3">
              {convo.map((msg, i) => (
                <div
                  key={`${activeLang}-${i}`}
                  className={cn(
                    "flex gap-2 transition-all duration-500",
                    msg.role === "system" ? "justify-end" : "justify-start",
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                  style={{ transitionDelay: isInView ? `${200 + i * 100}ms` : "0ms" }}
                >
                  {msg.role === "patient" && (
                    <div className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center text-[10px] font-bold text-slate shrink-0 mt-0.5">
                      P
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3.5 py-2.5 text-[13px] max-w-[75%]",
                      msg.role === "patient"
                        ? "bg-surface-alt text-navy rounded-tl-sm"
                        : "bg-navy text-white rounded-tr-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                  {msg.role === "system" && (
                    <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-bold text-navy shrink-0 mt-0.5">
                      R
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <div
            className={cn(
              "text-center mt-8 transition-all duration-700",
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: isInView ? "1000ms" : "0ms" }}
          >
            <p className="text-[17px] font-semibold text-navy">
              Natural conversations. Clear outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
