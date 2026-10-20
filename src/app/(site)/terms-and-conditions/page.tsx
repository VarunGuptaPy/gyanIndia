import { PageHero, Section, DraftNotice } from "@/components/site/section";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({ title: "Terms & Conditions", description: "Terms governing use of the GYAN website and participation in NTHE 2026.", path: "/terms-and-conditions" });

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Terms & Conditions" crumbs={[{ label: "Terms & Conditions" }]} />
      <Section tone="white">
        <article className="container-page prose-gyan max-w-3xl">
          <DraftNotice>These terms are a draft and must be reviewed and approved by a qualified legal professional before live registration opens.</DraftNotice>
          <h2>1. About these terms</h2>
          <p>These terms govern your use of {SITE.displayUrl} and participation in examinations conducted by GYAN — Global Young Achievers Network, including the National Talent Hunt Examination (NTHE) 2026.</p>
          <h2>2. Registration</h2>
          <ul>
            <li>Registration for a student under 18 must be completed by a parent or lawful guardian.</li>
            <li>You must provide accurate information. The student&apos;s name will appear on the admit card and certificate as entered.</li>
            <li>A registration is confirmed only after payment has been verified by GYAN with the payment gateway.</li>
            <li>One registration is permitted per student per examination.</li>
          </ul>
          <h2>3. Examination rules</h2>
          <p>Examination rules, including duration, marking scheme and conduct requirements, will be published on the NTHE 2026 page and on the admit card. Candidates must follow those rules and the instructions of invigilators. GYAN may withhold results in cases of malpractice, following a fair review.</p>
          <h2>4. Results, rankings and awards</h2>
          <p>Results and rankings are calculated according to the officially published rules. Award categories and prizes apply only once confirmed and published by GYAN. Decisions on results are subject to the re-evaluation or correction process that GYAN publishes.</p>
          <h2>5. Fees</h2>
          <p>Fees are displayed before payment. Refunds are governed by the <a href="/refund-policy">Refund Policy</a>.</p>
          <h2>6. Accounts</h2>
          <p>Keep your password confidential. Notify us immediately of any unauthorised use of your account.</p>
          <h2>7. Intellectual property</h2>
          <p>Question papers, content and branding on this website belong to GYAN and may not be reproduced without permission.</p>
          <h2>8. Liability</h2>
          <p>GYAN will take reasonable care in conducting the examination. To the extent permitted by law, GYAN is not liable for indirect losses or for delays caused by events beyond its reasonable control.</p>
          <h2>9. Governing law</h2>
          <p>These terms are governed by the laws of India. Jurisdiction will be specified in the final approved terms.</p>
          <h2>10. Contact</h2>
          <p>Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        </article>
      </Section>
    </>
  );
}
