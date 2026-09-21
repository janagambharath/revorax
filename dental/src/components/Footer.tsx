export default function Footer() {
  const links = {
    Product: [
      { label: "Dental", href: "#top" },
      { label: "Product", href: "#product" },
      { label: "How It Works", href: "#how-it-works" },
    ],
    Company: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16">
        <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-10 lg:gap-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[20px] font-[800] tracking-[-0.03em] text-navy">
                REvorax
              </span>
            </div>
            <p className="text-[14px] leading-[1.7] text-charcoal max-w-[300px]">
              Revenue automation for modern businesses.
            </p>
          </div>

          {/* Link Groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-[12px] font-semibold tracking-[0.08em] uppercase text-slate mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[14px] text-charcoal hover:text-navy transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate">
            © 2026 REvorax. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
