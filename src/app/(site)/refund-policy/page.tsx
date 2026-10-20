import { PageHero, Section, DraftNotice } from "@/components/site/section";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({ title: "Refund Policy", description: "GYAN's refund policy for NTHE 2026 registration fees.", path: "/refund-policy" });

export default function RefundPage() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Refund Policy" crumbs={[{ label: "Refund Policy" }]} />
      <Section tone="white">
        <article className="container-page prose-gyan max-w-3xl">
          <DraftNotice>
            The refund conditions and timelines below are placeholders for GYAN&apos;s approved policy. They must be confirmed by GYAN management and reviewed by a legal professional before live payments are enabled.
          </DraftNotice>
          <h2>1. Duplicate or failed payments</h2>
          <p>If you are charged more than once for the same registration, or money is deducted but the payment fails, the excess or failed amount will be refunded to the original payment method after verification with the payment gateway.</p>
          <h2>2. Cancellation by the guardian</h2>
          <p>Whether, and until when, a confirmed registration can be cancelled for a refund will be stated in the approved policy. Unpaid registrations can be cancelled at any time from the dashboard at no cost.</p>
          <h2>3. Cancellation by GYAN</h2>
          <p>If GYAN cancels the examination or a subject and does not offer a rescheduled date, the relevant fees will be refunded in full.</p>
          <h2>4. How refunds are processed</h2>
          <p>Approved refunds are issued to the original payment method through our payment gateway. Processing times depend on your bank or payment provider.</p>
          <h2>5. Requesting a refund</h2>
          <p>Write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with the registration number and payment reference.</p>
        </article>
      </Section>
    </>
  );
}
