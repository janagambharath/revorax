"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Revenue Impact", href: "#revenue-impact" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-1.5 group" aria-label="REvorax home">
          <span className="text-[22px] font-[800] tracking-[-0.03em] text-navy">
            REvorax
          </span>
          <span className="text-[13px] font-medium text-blue bg-blue-pale px-2 py-0.5 rounded-full">
            Dental
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-charcoal hover:text-navy transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="#book-demo"
            className="inline-flex items-center h-9 px-5 text-[14px] font-semibold text-white bg-navy rounded-lg hover:bg-navy-light transition-colors duration-200"
          >
            Book a Demo
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden relative z-50 w-10 h-10 flex items-center justify-center text-navy"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-0 bg-white z-40 flex flex-col pt-20 px-8 transition-all duration-300 lg:hidden",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[17px] font-medium text-navy py-3 border-b border-border-light hover:text-blue transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#book-demo"
          className="mt-8 inline-flex items-center justify-center h-12 px-6 text-[15px] font-semibold text-white bg-navy rounded-lg hover:bg-navy-light transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          Book a Demo
        </a>
      </div>
    </header>
  );
}
