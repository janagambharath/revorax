"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

export default function TrustStrip() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-12 border-t border-b border-border-light bg-surface-alt">
      <div
        ref={ref}
        className={cn(
          "max-w-[800px] mx-auto px-6 text-center transition-all duration-700",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <p className="text-[15px] leading-[1.7] text-charcoal">
          Built to help dental teams capture the appointment opportunities already coming through their practice.
        </p>
      </div>
    </section>
  );
}
