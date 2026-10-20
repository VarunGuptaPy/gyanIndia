import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { Reveal } from "@/components/site/motion";
import { SubjectIcon } from "@/components/site/subject-icon";
import { FeeCalculator } from "@/components/site/fee-calculator";
import { FaqList } from "@/components/site/faq-list";
import { CtaBand } from "@/components/site/cta-band";
import { AwardCards } from "@/components/site/award-cards";
import { FAQ_GROUPS } from "@/content/faq";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { formatDate, orTBA, TBA } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const metadata = pageMetadata({
  title: "NTHE 2026 — National Talent Hunt Examination",
  description:
    "Everything about GYAN's National Talent Hunt Examination 2026: date, eligibility, subjects, languages, offline mode, fees, registration and examination-day guidance.",
  path: "/nthe-2026",
});

export default async function Nthe2026Page() {
  const exam = await getCurrentExam();
  if (!exam) notFound();
  const open = isRegistrationOpen(exam);
  const subjects = availableSubjects(exam);
  const subjectFee = subjects[0]?.feePaise ?? 25000;
  const proposed = (approved: boolean) =>
    approved ? null : <Badge tone="warning" className="ml-2 align-middle">Proposed</Badge>;

  const keyFacts: [string, React.ReactNode][] = [
    ["Examination", exam.name],
    ["Organiser", "GYAN — Global Young Achievers Network"],
    ["Date", formatDate(exam.examDate)],
    ["Mode", `${exam.mode} (pen and paper at examination centres)`],
    ["Languages", exam.languages.join(" and ")],
    ["Eligibility", <>Classes {exam.eligibleClassMin}–{exam.eligibleClassMax}{proposed(exam.eligibilityApproved)}</>],
    ["Boards", <>{exam.boards.join(", ")}{proposed(exam.boardsApproved)}</>],
    ["Registration fee", `${formatPaise(exam.registrationFeePaise)} (one-time)`],
    ["Subject fee", `${formatPaise(subjectFee)} per subject`],
    ["Awards", "Subject-wise national rankings"],
  ];

  const pending: [string, string][] = [
    ["Duration", orTBA(exam.durationMinutes, (m) => `${m} minutes`)],
    ["Number of questions", orTBA(exam.questionCount)],
    ["Marking scheme", orTBA(exam.markingScheme)],
    ["Negative marking", orTBA(exam.negativeMarking)],
    ["Registration deadline", formatDate(exam.registrationDeadline)],
    ["Examination centres", "Shown on the admit card"],
    ["Reporting time", orTBA(exam.defaultReportingTime)],
    ["Result date", formatDate(exam.resultDate)],
  ];

  return (
    <>
      <PageHero
        eyebrow="Flagship examination"
        title="National Talent Hunt Examination 2026"
        lede="A national-level, offline examination for school students — designed to identify talent, encourage excellence and recognise achievement subject by subject."
        crumbs={[{ label: "NTHE 2026" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={open ? "/register" : "#fees"}>
              {open ? "Register for NTHE 2026" : "Registration opening soon"} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/syllabus">View syllabus overview</Link>
          </Button>
        </div>
      </PageHero>

      <Section tone="white">
        <div className="container-page grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Reveal className="prose-gyan">
              <p className="eyebrow">Overview</p>
              <h2 className="!mt-4">An examination that celebrates ability</h2>
              <p>
                The National Talent Hunt Examination (NTHE) 2026 is organised by GYAN — Global Young Achievers Network.
                Students choose one or more subjects and sit a supervised, offline examination on{" "}
                <strong>{formatDate(exam.examDate)}</strong> in English or Hindi.
              </p>
              <p>
                Every subject is assessed on its own merit. This means a student who excels in Logical Reasoning can be
                recognised for it, even if Science isn&apos;t their strongest subject.
              </p>
              <h3>Objectives</h3>
              <ul>
                <li>Identify and encourage academic talent among school students across India.</li>
                <li>Help students discover their strengths, subject by subject.</li>
                <li>Recognise excellence through subject-wise national rankings.</li>
                <li>Give students the confidence that comes from taking part in a national examination.</li>
                <li>Introduce future-ready subjects such as Computer Applications and Artificial Intelligence.</li>
              </ul>
              <h3>Eligibility</h3>
              <p>
                The examination is proposed for students of <strong>Classes {exam.eligibleClassMin} to {exam.eligibleClassMax}</strong>{" "}
                studying in <strong>{exam.boards.join(", ")}</strong> schools.
                {!exam.eligibilityApproved || !exam.boardsApproved
                  ? " Final eligibility and board coverage will be confirmed by GYAN and updated on this page."
                  : ""}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-[var(--radius-2xl)] border border-line bg-paper p-7 sm:p-8 lg:sticky lg:top-28">
              <h2 className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">Key facts</h2>
              <dl className="mt-4 divide-y divide-line">
                {keyFacts.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3 text-[0.95rem]">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <div className="container-page">
          <SectionHeading eyebrow="Subjects" title={`${subjects.length} subjects to choose from.`} lede="Students may take any number of subjects. Each subject has its own paper and its own national ranking." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((s) => (
              <Link key={s.id} href={`/subjects/${s.subject.slug}`} className="group flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition-all hover:border-royal/40 hover:shadow-card">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-royal-50 text-royal group-hover:bg-navy group-hover:text-gold">
                  <SubjectIcon icon={s.subject.icon} className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-navy">{s.subject.name}</span>
                  <span className="text-sm text-muted">{formatPaise(s.feePaise)}{s.isApproved ? "" : " · proposed"}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="white">
        <div className="container-page">
          <SectionHeading
            eyebrow="Examination pattern"
            title="Details being finalised."
            lede="The following details have not yet been confirmed. They will be published here as soon as they are approved — we will not change them without notice."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {pending.map(([k, v]) => (
              <div key={k} className="bg-white p-6">
                <p className="text-sm text-muted">{k}</p>
                <p className={`mt-2 font-display text-lg font-bold ${v === TBA ? "text-gold-700" : "text-navy"}`}>
                  {v === TBA ? (
                    <span className="inline-flex items-center gap-2"><Clock className="size-4" aria-hidden /> {TBA}</span>
                  ) : (
                    v
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="fees">
        <div className="container-page">
          <SectionHeading
            eyebrow="Fee structure"
            title="₹50 to register. ₹250 per subject."
            lede="Total = ₹50 + (₹250 × number of subjects). For example: 1 subject ₹300 · 2 subjects ₹550 · 3 subjects ₹800 · all 7 subjects ₹1,800."
          />
          <Reveal className="mt-12">
            <FeeCalculator
              registrationOpen={open}
              registrationFeePaise={exam.registrationFeePaise}
              subjects={subjects.map((s) => ({ id: s.id, name: s.subject.name, icon: s.subject.icon, feePaise: s.feePaise }))}
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Registration</p>
            <h2 className="display-md mt-4">How to register</h2>
            <ol className="mt-8 space-y-5">
              {[
                "A parent or guardian creates a GYAN account during registration.",
                "Enter the student's details — class, board, school, city, state and examination language.",
                "Select one or more subjects and review the fee breakdown.",
                "Give consent for processing your child's data for the examination.",
                "Pay securely online. Your registration is confirmed only after the payment is verified.",
                "Note your registration number. Admit cards will be released on your dashboard.",
              ].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-gold">{i + 1}</span>
                  <span className="pt-1 leading-relaxed text-ink/85">{t}</span>
                </li>
              ))}
            </ol>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/how-to-register">Full registration guide <ArrowRight aria-hidden /></Link>
            </Button>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Examination day</p>
            <h2 className="display-md mt-4">Instructions</h2>
            {exam.examDayInstructions ? (
              <div className="prose-gyan mt-8 whitespace-pre-line">{exam.examDayInstructions}</div>
            ) : (
              <>
                <p className="mt-6 rounded-xl border border-gold/30 bg-gold-50 px-4 py-3 text-sm text-navy">
                  Official examination-day instructions will be published here and printed on the admit card. Until then,
                  please keep the following general guidance in mind.
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "Carry a printed copy of the admit card once it is released.",
                    "Arrive at the centre by the reporting time printed on the admit card.",
                    "Bring the stationery permitted in the official instructions.",
                    "Follow the directions of the invigilators at all times.",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-ink/85">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Reveal>
        </div>
      </Section>

      <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0" />
        <div className="relative container-page">
          <SectionHeading tone="light" eyebrow="Awards" title="Subject-wise national recognition." lede="The final award structure will be announced by GYAN. Prize details appear here only once they are confirmed." />
          <AwardCards categories={exam.awardCategories} className="mt-12" />
        </div>
      </section>

      <Section tone="white">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading eyebrow="FAQs" title="About the examination" />
          <FaqList items={[...FAQ_GROUPS[0].items, ...FAQ_GROUPS[1].items.slice(0, 3)]} idPrefix="nthe" />
        </div>
      </Section>

      <CtaBand registrationOpen={open} />
    </>
  );
}
