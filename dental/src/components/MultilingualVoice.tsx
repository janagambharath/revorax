"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Globe, MessageCircle } from "lucide-react";

type Lang = "en" | "te" | "hi";

const languages: { key: Lang; label: string; nativeLabel: string }[] = [
  { key: "en", label: "English", nativeLabel: "English" },
  { key: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { key: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

const conversations: Record<Lang, { patient: string; system: string }> = {
  en: {
    patient: "I'd like to book my next check-up.",
    system: "Of course. What day works best for you?",
  },
  te: {
    patient: "నాకు next check-up book చేసుకోవాలి.",
    system: "తప్పకుండా. మీకు ఏ రోజు convenient గా ఉంటుంది?",
  },
  hi: {
    patient: "मुझे अपना अगला check-up book करना है।",
    system: "बिल्कुल। आपके लिए कौन सा दिन convenient रहेगा?",
  },
};

export default function MultilingualVoice() {
  const { ref, isInView } = useInView();
  const [activeLang, setActiveLang] = useState<Lang>("en");

  return (
    <section className="py-20 lg:py-28 bg-surface-alt">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div
          className={cn(
            "max-w-[640px] mx-auto text-center mb-14 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-block text-[12px] font-semibold tracking-[0.12em] uppercase text-blue mb-4">
            Built for Real Conversations
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-navy">
            Speak to Patients in the Language They Prefer
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-charcoal">
            REvorax can support patient conversations in English, Telugu and Hindi, helping dental practices communicate naturally with more patients.
          </p>
        </div>

        {/* Language Cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-[900px] mx-auto mb-10">
          {languages.map((lang, i) => {
            const convo = conversations[lang.key];
            const isActive = activeLang === lang.key;
            return (
              <button
                key={lang.key}
                onClick={() => setActiveLang(lang.key)}
                className={cn(
                  "text-left bg-white rounded-xl border p-5 transition-all duration-300 cursor-pointer",
                  isActive
                    ? "border-blue shadow-[0_4px_20px_rgba(37,99,235,0.1)] ring-1 ring-blue/20"
                    : "border-border hover:border-blue/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: isInView ? `${i * 100}ms` : "0ms" }}
              >
                {/* Language Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-blue text-white" : "bg-surface-alt text-navy"
                  )}>
                    <Globe size={14} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-navy">{lang.label}</div>
                    {lang.key !== "en" && (
                      <div className="text-[12px] text-slate">{lang.nativeLabel}</div>
                    )}
                  </div>
                </div>

                {/* Conversation Preview */}
                <div className="space-y-2.5">
                  {/* Patient */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center text-[8px] font-bold text-slate shrink-0 mt-0.5">
                      P
                    </div>
                    <div className="bg-surface-alt rounded-lg rounded-tl-sm px-3 py-2 text-[12px] text-navy leading-relaxed">
                      {convo.patient}
                    </div>
                  </div>

                  {/* System */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className={cn(
                      "rounded-lg rounded-tr-sm px-3 py-2 text-[12px] leading-relaxed max-w-[90%]",
                      isActive ? "bg-navy text-white" : "bg-navy/5 text-navy"
                    )}>
                      {convo.system}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center text-[8px] font-bold text-navy shrink-0 mt-0.5">
                      R
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {activeLang === "te" && (
          <div
            className={cn(
              "max-w-[560px] mx-auto mb-10 rounded-xl border border-blue/20 bg-blue-pale/40 px-5 py-4 transition-all duration-300",
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="mb-3">
              <p className="text-[14px] font-semibold text-navy">Listen to the Telugu voice demo</p>
              <p className="mt-0.5 text-[12px] text-slate">A sample patient conversation in Telugu.</p>
            </div>
            <audio
              controls
              preload="metadata"
              className="w-full h-10"
              aria-label="Telugu voice demo"
            >
              <source src="/dental/audio/telugu-demo.mp3" type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Supporting Line */}
        <div
          className={cn(
            "text-center transition-all duration-700 delay-300",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="inline-flex items-center gap-2 text-[14px] font-medium text-charcoal bg-white border border-border rounded-full px-5 py-2.5">
            <MessageCircle size={14} className="text-blue" />
            One workflow. Multiple patient languages.
          </div>
        </div>
      </div>
    </section>
  );
}
