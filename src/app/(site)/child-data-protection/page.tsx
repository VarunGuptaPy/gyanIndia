import { PageHero, Section, DraftNotice } from "@/components/site/section";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { CONSENT_TEXT } from "@/content/consent";
import { CONSENT_VERSION } from "@/lib/site";

export const metadata = pageMetadata({ title: "Child Data Protection", description: "How GYAN protects the personal data of children who take part in NTHE 2026.", path: "/child-data-protection" });

export default function ChildDataPage() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Child Data Protection" lede="Most participants in NTHE 2026 are children. Protecting their data is a responsibility we take seriously." crumbs={[{ label: "Child Data Protection" }]} />
      <Section tone="white">
        <article className="container-page prose-gyan max-w-3xl">
          <DraftNotice>This statement describes the safeguards built into the platform. It is a draft and must be reviewed by a qualified legal professional, including against the Digital Personal Data Protection Act, 2023 and its rules on verifiable parental consent, before live registration.</DraftNotice>
          <h2>Our commitments</h2>
          <ul>
            <li><strong>Guardian control:</strong> only a parent or lawful guardian can create an account, register a child and view the child&apos;s results.</li>
            <li><strong>Recorded consent:</strong> we record the guardian&apos;s consent, the version of the consent text and when it was given before any child&apos;s data is processed.</li>
            <li><strong>Data minimisation:</strong> we collect only what is needed to conduct the examination. We do not collect photographs, dates of birth, Aadhaar or other identity numbers at registration.</li>
            <li><strong>No tracking or advertising:</strong> we do not use children&apos;s data for behavioural monitoring, profiling or targeted advertising.</li>
            <li><strong>Private results:</strong> results are visible only to the guardian&apos;s account and authorised GYAN staff. We never publish a child&apos;s full name or school without separate consent.</li>
            <li><strong>Privacy-preserving verification:</strong> the public certificate verification page shows only initials.</li>
            <li><strong>Restricted staff access:</strong> staff access is role-based, and sensitive actions are recorded in audit logs.</li>
          </ul>
          <h2>Consent text (version {CONSENT_VERSION})</h2>
          <blockquote className="rounded-xl border border-line bg-paper p-5 text-[0.95rem] whitespace-pre-line text-ink/80">{CONSENT_TEXT}</blockquote>
          <h2>Your choices</h2>
          <p>To access, correct or erase your child&apos;s data, or to withdraw consent, write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> from the email address registered on your guardian account.</p>
        </article>
      </Section>
    </>
  );
}
