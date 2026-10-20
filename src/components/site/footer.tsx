import Link from "next/link";
import { Mail, MapPin, Phone, Globe } from "lucide-react";
import { SITE } from "@/lib/site";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Examination",
    links: [
      { href: "/nthe-2026", label: "NTHE 2026" },
      { href: "/subjects", label: "Subjects" },
      { href: "/syllabus", label: "Syllabus" },
      { href: "/awards", label: "Awards" },
      { href: "/how-to-register", label: "How to Register" },
      { href: "/results", label: "Results" },
    ],
  },
  {
    title: "GYAN",
    links: [
      { href: "/about", label: "About GYAN" },
      { href: "/schools", label: "For Schools" },
      { href: "/faq", label: "FAQs" },
      { href: "/contact", label: "Contact" },
      { href: "/certificate/verify", label: "Verify a Certificate" },
      { href: "/hi", label: "हिंदी में जानकारी" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-and-conditions", label: "Terms & Conditions" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/child-data-protection", label: "Child Data Protection" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative container-page pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-6 font-display text-xl leading-snug font-semibold text-white">{SITE.tagline}</p>
            <p lang="hi" className="mt-3 text-[0.95rem] text-gold-200">
              {SITE.hindiTagline}
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/75">
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <a href={SITE.phoneHref} className="hover:text-white">{SITE.phone}</a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <span className="flex flex-col">
                  <a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a>
                  <a href={`mailto:${SITE.enquiryEmail}`} className="hover:text-white">{SITE.enquiryEmail}</a>
                </span>
              </li>
              <li className="flex gap-3">
                <Globe className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <span>{SITE.displayUrl}</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{col.title}</h2>
                <ul className="mt-5 space-y-3 text-[0.92rem]">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/75 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-2">
          {SITE.offices.map((o) => (
            <address key={o.label} className="flex gap-3 text-sm text-white/70 not-italic">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <span>
                <span className="block font-semibold text-white">{o.label}</span>
                {o.lines.join(", ")}
              </span>
            </address>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GYAN — Global Young Achievers Network. All rights reserved.</p>
          <p>Every child has a talent. Every talent deserves a chance.</p>
        </div>
      </div>
    </footer>
  );
}
