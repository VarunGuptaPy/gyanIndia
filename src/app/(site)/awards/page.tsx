import { Medal, ScrollText, ShieldCheck, Trophy } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { AwardCards } from "@/components/site/award-cards";
import { Reveal } from "@/components/site/motion";
import { CtaBand } from "@/components/site/cta-band";
import { getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const metadata = pageMetadata({
  title: "Awards & Recognition",
  description: "Subject-wise national rankings and recognition for top performers in GYAN's National Talent Hunt Examination 2026.",
  path: "/awards",
});

export default async function AwardsPage() {
  const exam = await getCurrentExam();
  if (!exam) notFound();
  const anyConfirmed = exam.awardCategories.some((c) => c.isConfirmed);
  return (
    <>
      <PageHero
        eyebrow="Awards & recognition"
        title="Your Talent. Your Achievement. Your National Recognition."
        lede="NTHE 2026 recognises excellence subject by subject, so every student has the chance to be celebrated for the subject they do best."
        crumbs={[{ label: "Awards" }]}
      />
      <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0" />
        <div className="relative container-page">
          <SectionHeading
            tone="light"
            eyebrow="Award categories"
            title="Recognition at every level of excellence."
            lede={
              anyConfirmed
                ? "Confirmed award details are shown below. Categories marked “to be announced” are still being finalised."
                : "The award structure for NTHE 2026 is being finalised. Prize details will be published here once confirmed by GYAN — we will never display unconfirmed prizes."
            }
          />
          <AwardCards categories={exam.awardCategories} className="mt-12" />
        </div>
      </section>
      <Section tone="white">
        <div className="container-page grid gap-10 md:grid-cols-3">
          {[
            { icon: Trophy, title: "Subject-wise national rankings", body: "Each subject has its own ranking, so a student can be recognised in every subject they excel in." },
            { icon: ScrollText, title: "Verifiable certificates", body: "Certificates carry a unique number and QR code that anyone can verify on our website." },
            { icon: ShieldCheck, title: "Fair and transparent", body: "Ranking rules — including how equal scores are treated — will be published before results are announced." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className="border-t-2 border-gold pt-6">
              <f.icon className="size-7 text-navy" aria-hidden />
              <h2 className="mt-5 text-xl font-bold">{f.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
            </Reveal>
          ))}
        </div>
        <div className="container-page mt-16">
          <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line bg-paper p-6 sm:flex-row sm:items-center sm:p-8">
            <Medal className="size-10 shrink-0 text-gold-600" aria-hidden />
            <p className="text-ink/80">
              <strong className="text-navy">Ranking scope:</strong> whether rankings are calculated within each class or
              across classes for a subject will be confirmed and announced with the official rules. Results are shared
              privately with families; we do not publish children&apos;s full names or schools without consent.
            </p>
          </div>
        </div>
      </Section>
      <CtaBand registrationOpen={isRegistrationOpen(exam)} />
    </>
  );
}
