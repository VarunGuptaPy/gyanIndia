import { PageHero, Section, DraftNotice } from "@/components/site/section";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({ title: "Privacy Policy", description: "How GYAN collects, uses and protects personal data.", path: "/privacy-policy" });

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Privacy Policy" crumbs={[{ label: "Privacy Policy" }]} />
      <Section tone="white">
        <article className="container-page prose-gyan max-w-3xl">
          <DraftNotice>
            This policy is a working draft prepared for the platform. It must be reviewed and approved by a qualified legal
            professional, including for compliance with the Digital Personal Data Protection Act, 2023 and applicable rules,
            before live registrations are accepted.
          </DraftNotice>
          <p>
            GYAN — Global Young Achievers Network (“GYAN”, “we”) respects your privacy. This policy explains what personal
            data we collect through {SITE.displayUrl}, why we collect it, and the choices you have.
          </p>
          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Guardian account data:</strong> name, mobile number, email address, an optional address, and a securely hashed password.</li>
            <li><strong>Student data:</strong> full name, class, board, school name, city, state and examination language.</li>
            <li><strong>Examination data:</strong> selected subjects, registration number, centre allocation, results, rankings and certificates.</li>
            <li><strong>Payment data:</strong> payment status, amounts and transaction references from our payment gateway. We do not receive or store card numbers, UPI PINs or bank credentials.</li>
            <li><strong>Enquiries:</strong> details you submit through contact or school partnership forms.</li>
            <li><strong>Technical data:</strong> limited security logs. IP addresses are stored only in a one-way hashed form for fraud prevention and rate limiting.</li>
          </ul>
          <h2>2. Why we use it</h2>
          <p>We use personal data only to register students, conduct the examination, issue admit cards, process payments and refunds, publish results to the student&apos;s guardian, calculate rankings, issue and verify certificates, respond to enquiries, and keep the platform secure.</p>
          <h2>3. Consent</h2>
          <p>Registration of a child is carried out by a parent or lawful guardian, whose consent is recorded with the date, time and version of the consent text. You may withdraw consent at any time by writing to us; this may prevent participation.</p>
          <h2>4. Sharing</h2>
          <p>We share data only with service providers who help us run the platform (for example, hosting, payment processing and email delivery), under appropriate safeguards, or where required by law. We do not sell personal data and do not use it for advertising.</p>
          <h2>5. Retention</h2>
          <p>We retain registration and result records for as long as needed to conduct the examination, verify certificates and meet legal and accounting obligations, after which they are deleted or anonymised. Retention periods will be specified in the final approved policy.</p>
          <h2>6. Your rights</h2>
          <p>You may request access to, correction of, or erasure of your personal data and your child&apos;s, and you may nominate another person to exercise these rights in certain circumstances. To make a request or raise a grievance, write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
          <h2>7. Security</h2>
          <p>We use encrypted connections, hashed passwords, role-based access for staff, audit logging of sensitive actions and verified payment processing. No system is perfectly secure; we will notify affected users and authorities of personal data breaches as required by law.</p>
          <h2>8. Contact</h2>
          <p>GYAN — Global Young Achievers Network, 5th Floor, AIPL Business Park, Sector 62, Gurugram, Haryana. Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Phone: {SITE.phone}.</p>
        </article>
      </Section>
    </>
  );
}
