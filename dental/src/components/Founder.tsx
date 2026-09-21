import { Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";

const whatsappMessage = encodeURIComponent(
  "Hi Bharath, I'd like to know more about REvorax Dental."
);

export default function Founder() {
  return (
    <section className="border-t border-border-light bg-white py-16 lg:py-20">
      <div className="mx-auto grid max-w-[960px] items-center gap-8 px-6 md:grid-cols-[auto_1fr]">
        <Image
          src="/dental/images/founder-bharath.jpg"
          alt="Bharath Janagam, founder and builder of REvorax"
          width={96}
          height={96}
          className="h-24 w-24 rounded-full border-2 border-white object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.14)]"
        />
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-blue">
            Founder-led support
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,3vw,2rem)] font-bold tracking-[-0.02em] text-navy">
            Built by Bharath Janagam
          </h2>
          <p className="mt-3 max-w-[640px] text-[15px] leading-[1.7] text-charcoal">
            Bharath is the founder and builder behind REvorax, creating practical automation tools for businesses in Hyderabad and beyond.
          </p>
          <p className="mt-3 text-[13px] font-medium text-slate">
            Bharath Janagam · Founder &amp; Builder · Hyderabad, India
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/917995854994?text=${whatsappMessage}`}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-navy/90"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
            <a
              href="mailto:support@revorax.online"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <Mail size={15} />
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/janagam-bharath-9ab1b235b/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <Linkedin size={15} />
              LinkedIn
            </a>
            <a
              href="https://www.instagram.com/bharath._ai/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <Instagram size={15} />
              Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
