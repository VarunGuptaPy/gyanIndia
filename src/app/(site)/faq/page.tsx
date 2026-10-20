import { PageHero, Section } from "@/components/site/section";
import { FaqList } from "@/components/site/faq-list";
import { FAQ_GROUPS } from "@/content/faq";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description: "Answers to common questions about NTHE 2026 — eligibility, fees, registration, admit cards, results and certificates.",
  path: "/faq",
});

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <PageHero eyebrow="Help centre" title="Frequently asked questions" lede={`Can't find an answer? Write to ${SITE.enquiryEmail} or call ${SITE.phone}.`} crumbs={[{ label: "FAQs" }]} />
      <Section>
        <div className="container-page max-w-4xl space-y-14">
          {FAQ_GROUPS.map((g, i) => (
            <section key={g.title}>
              <h2 className="display-md mb-6">{g.title}</h2>
              <FaqList items={g.items} idPrefix={`g${i}`} />
            </section>
          ))}
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
