"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  const { ref, isInView } = useInView();

  return (
    <section id="book-demo" className="py-20 lg:py-28">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6">
        <div
          className={cn(
            "relative bg-navy rounded-3xl px-8 py-16 lg:px-16 lg:py-20 text-center overflow-hidden transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue/10 via-transparent to-mint/5 pointer-events-none" />

          <div className="relative z-10 max-w-[560px] mx-auto">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-white">
              Your next appointment may already be in the conversation.
            </h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-white/70">
              See how REvorax can fit into your dental practice workflow.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#book-demo"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 text-[15px] font-semibold text-navy bg-white rounded-lg hover:bg-white/90 transition-all duration-200 hover:shadow-lg"
              >
                Book a Demo
                <ArrowRight size={16} />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 text-[15px] font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                Talk to REvorax
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
