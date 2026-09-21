"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";


export default function FinalCTA() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-surface-alt border-t border-border-light">
      <div
        ref={ref}
        className={cn(
          "max-w-[1200px] mx-auto px-6 transition-all duration-700",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
      >
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background photo */}
          <img
            src="/dental/images/team.jpg"
            alt="Modern dental clinic team in a professional setting"
           
           
            className="w-full h-[400px] lg:h-[440px] object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/75 to-navy/60" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-[560px] px-8 lg:px-14">
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-[700] leading-[1.2] tracking-[-0.02em] text-white">
                Make every patient conversation count.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-white/70">
                Turn missed calls, follow-ups, cancellations and due visits into more opportunities for your practice.
              </p>

              <div className="mt-8">
                <a
                  href="#book-demo"
                  className="inline-flex items-center gap-2 h-12 px-8 text-[15px] font-semibold text-navy bg-white rounded-lg hover:bg-white/90 transition-all duration-200 hover:shadow-lg"
                >
                  Book a Demo
                  <ArrowRight size={16} />
                </a>
                <p className="mt-4 text-[13px] text-white/50">
                  See the workflow in action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
