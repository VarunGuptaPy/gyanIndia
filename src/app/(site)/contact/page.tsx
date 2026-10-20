import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { PageHero, Section } from "@/components/site/section";
import { ContactForm } from "@/components/forms/contact-form";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact GYAN",
  description: "Contact GYAN — Global Young Achievers Network. Phone +91-73 4800 4848, email admin@gyanindia.com. Offices in Gurugram and Lucknow.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's Connect and Inspire Young Achievers."
        lede="Questions about NTHE 2026, registration, school partnerships or results? We're here to help."
        crumbs={[{ label: "Contact" }]}
      />
      <Section>
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
          <div className="space-y-4">
            {[
              { icon: Phone, label: "Phone", value: SITE.phone, href: SITE.phoneHref },
              { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, extra: { value: SITE.enquiryEmail, href: `mailto:${SITE.enquiryEmail}` } },
              { icon: Globe, label: "Website", value: SITE.displayUrl, href: SITE.url },
            ].map((c) => (
              <div key={c.label} className="flex gap-4 rounded-[var(--radius-xl)] border border-line bg-white p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-gold"><c.icon className="size-5" aria-hidden /></span>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">{c.label}</p>
                  <a href={c.href} className="mt-0.5 block font-semibold text-navy hover:text-royal">{c.value}</a>
                  {c.extra && <a href={c.extra.href} className="block font-semibold text-navy hover:text-royal">{c.extra.value}</a>}
                </div>
              </div>
            ))}
            {SITE.offices.map((o) => (
              <address key={o.label} className="flex gap-4 rounded-[var(--radius-xl)] border border-line bg-white p-5 not-italic">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper text-royal"><MapPin className="size-5" aria-hidden /></span>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">{o.label}</p>
                  <p className="mt-0.5 leading-relaxed text-navy">{o.lines.map((l) => <span key={l} className="block">{l}</span>)}</p>
                </div>
              </address>
            ))}
          </div>
          <div>
            <h2 className="display-md mb-6">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
