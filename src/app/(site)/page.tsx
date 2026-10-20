import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Download,
  Languages,
  Layers,
  ListChecks,
  MapPin,
  Medal,
  PenLine,
  School,
  Trophy,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroArt } from "@/components/site/hero-art";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import { Section, SectionHeading } from "@/components/site/section";
import { SubjectIcon } from "@/components/site/subject-icon";
import { FeeCalculator } from "@/components/site/fee-calculator";
import { FaqList } from "@/components/site/faq-list";
import { CtaBand } from "@/components/site/cta-band";
import { AwardCards } from "@/components/site/award-cards";
import { HOME_FAQS } from "@/content/faq";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  {
    icon: Award,
    title: "National Talent Recognition",
    body: "A national platform where students are recognised for what they know and how they think.",
  },
  {
    icon: Layers,
    title: "Multiple Academic Subjects",
    body: "Seven proposed subjects — from Mathematics and Science to Logical Reasoning and Artificial Intelligence.",
  },
  {
    icon: Trophy,
    title: "Subject-Wise National Rankings",
    body: "Each subject is assessed and ranked on its own, so every strength can be recognised.",
  },
  {
    icon: PenLine,
    title: "Offline Examination",
    body: "A supervised, pen-and-paper examination at designated centres for a fair, focused experience.",
  },
];

const STEPS = [
  { icon: UserPlus, title: "Register", body: "A parent or guardian creates an account and adds the student's details." },
  { icon: ListChecks, title: "Select subjects", body: "Choose one or more subjects. The fee updates instantly." },
  { icon: CreditCard, title: "Pay examination fees", body: "Pay securely online. Registration is confirmed once payment is verified." },
  { icon: Download, title: "Download admit card", body: "Admit cards are released on the dashboard once centres are finalised." },
  { icon: ClipboardCheck, title: "Attend the examination", body: "Report to the allotted centre on 12 December 2026 with the admit card." },
  { icon: Medal, title: "Check results and rankings", body: "View results privately and see subject-wise national rankings when published." },
];

export default async function HomePage() {
  const exam = await getCurrentExam();
  if (!exam) notFound();
  const open = isRegistrationOpen(exam);
  const subjects = availableSubjects(exam);
  const subjectFee = subjects[0]?.feePaise ?? 25000;

  const facts = [
    { icon: CalendarDays, label: "Date", value: formatDate(exam.examDate) },
    { icon: MapPin, label: "Mode", value: exam.mode },
    { icon: Languages, label: "Languages", value: exam.languages.join(" & ") },
    {
      icon: CreditCard,
      label: "Registration",
      value: `${formatPaise(exam.registrationFeePaise)} + ${formatPaise(subjectFee)} per subject`,
    },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_75%)]" />
        <div className="relative container-page grid items-center gap-10 pt-14 pb-36 sm:pt-20 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:pt-24 lg:pb-44">
          <Reveal>
            <p className="eyebrow eyebrow-light">National Talent Hunt Examination 2026</p>
            <h1 className="display-xl mt-6 text-white">
              Every Child Has a Talent.{" "}
              <span className="relative whitespace-nowrap text-gold">
                Every Talent
                <svg aria-hidden viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full text-gold/60">
                  <path d="M2 9 C 80 2, 220 2, 298 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              Deserves a Chance.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">
              Discover your potential with GYAN&apos;s National Talent Hunt Examination 2026. Challenge your knowledge,
              explore your strengths, and take a step towards national recognition.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href={open ? "/register" : "/nthe-2026"}>
                  {open ? "Register for NTHE 2026" : "Registration Opening Soon"} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline-light" size="lg">
                <Link href="/nthe-2026">Explore the Examination</Link>
              </Button>
            </div>
            <p lang="hi" className="mt-8 text-[0.95rem] text-gold-200/90">
              {SITE.hindiTagline}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="relative mx-auto w-full max-w-[520px]">
            <HeroArt className="w-full" />
          </Reveal>
        </div>
      </section>

      {/* Exam pass strip */}
      <div className="relative z-10 container-page -mt-24 lg:-mt-28">
        <Reveal>
          <div className="grid overflow-hidden rounded-[var(--radius-2xl)] bg-white shadow-lift sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_1.25fr]">
            <div className="flex items-center gap-3 bg-gold px-6 py-5 text-navy sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-start lg:justify-center lg:px-7">
              <span className="text-[0.7rem] font-bold tracking-[0.2em] uppercase">Exam pass</span>
              <span className="font-display text-xl font-extrabold">NTHE 2026</span>
            </div>
            {facts.map((f, i) => (
              <div
                key={f.label}
                className={`flex items-start gap-3.5 px-6 py-5 lg:py-6 ${i > 0 ? "border-t border-dashed border-line-strong sm:border-t-0 lg:border-l" : ""} ${i === 1 ? "sm:border-l" : ""} ${i === 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 3 ? "sm:border-t sm:border-l lg:border-t-0" : ""}`}
              >
                <f.icon className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">{f.label}</p>
                  <p className="mt-1 font-display text-[1.02rem] leading-snug font-bold text-navy">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── Highlights ───────────────────────────────────── */}
      <Section className="pt-24 sm:pt-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why NTHE 2026"
            title="A national stage for young minds."
            lede="NTHE 2026 is built around one idea: that talent shows up in many forms, and every form deserves to be seen."
          />
          <Stagger className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-2xl)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h, i) => (
              <StaggerItem key={h.title} className="group relative bg-white p-7 transition-colors hover:bg-gold-50/60">
                <span className="absolute top-7 right-7 font-display text-sm font-bold text-line-strong">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid size-12 place-items-center rounded-xl bg-navy text-gold transition-transform duration-300 group-hover:-translate-y-1">
                  <h.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-lg font-bold">{h.title}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{h.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── About ────────────────────────────────────────── */}
      <Section tone="white">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">About GYAN</p>
            <h2 className="display-lg mt-4">Empowering Young Minds to Achieve More.</h2>
            <figure className="mt-10 border-l-[3px] border-gold pl-6">
              <blockquote className="font-display text-xl leading-snug font-semibold text-navy sm:text-2xl">
                “{SITE.tagline}”
              </blockquote>
              <figcaption lang="hi" className="mt-3 text-muted">
                {SITE.hindiTagline}
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5 text-[1.05rem] leading-relaxed text-ink/80">
            <p>
              <strong className="font-semibold text-navy">GYAN — Global Young Achievers Network</strong> is an
              education-focused initiative committed to identifying young talent, encouraging academic excellence, and
              creating opportunities for students to demonstrate their abilities.
            </p>
            <p>
              We believe ability is not limited to marksheets. Through structured, fair and well-run assessments, GYAN
              helps students understand where their strengths lie — and gives parents, teachers and schools a clearer
              picture of how to nurture them.
            </p>
            <ul className="grid gap-3 pt-2 sm:grid-cols-2">
              {["Identify talent early", "Encourage curiosity", "Recognise achievement", "Partner with schools"].map((v) => (
                <li key={v} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-[0.95rem] font-medium text-navy">
                  <span aria-hidden className="size-2 rounded-full bg-gold" />
                  {v}
                </li>
              ))}
            </ul>
            <div className="pt-3">
              <Button asChild variant="navy">
                <Link href="/about">
                  Discover GYAN <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── NTHE 2026 ────────────────────────────────────── */}
      <Section>
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="The flagship examination"
              title="National Talent Hunt Examination 2026"
              lede="NTHE 2026 invites students to test their understanding in the subjects they love, measure themselves against peers across the country, and earn recognition for genuine ability."
            />
            <Reveal delay={0.1}>
              <h3 className="mt-10 text-sm font-semibold tracking-[0.16em] text-muted uppercase">Objectives</h3>
              <ul className="mt-4 space-y-3.5">
                {[
                  "Identify and encourage academic talent among school students.",
                  "Help students discover their strengths subject by subject.",
                  "Recognise excellence through fair, subject-wise national rankings.",
                  "Build confidence through the experience of a national-level examination.",
                ].map((o) => (
                  <li key={o} className="flex gap-3 text-ink/85">
                    <BookOpenCheck className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-9">
                <Link href="/nthe-2026">
                  Full examination details <ArrowRight aria-hidden />
                </Link>
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="relative rounded-[var(--radius-2xl)] border border-line bg-white p-7 shadow-card sm:p-9">
              <div className="flex items-center justify-between border-b border-line pb-5">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">At a glance</p>
                  <p className="mt-1 font-display text-xl font-bold text-navy">{exam.shortName}</p>
                </div>
                <span className="rounded-full bg-royal-50 px-3 py-1 text-xs font-semibold text-royal">
                  {exam.mode}
                </span>
              </div>
              <dl className="divide-y divide-dashed divide-line-strong">
                {[
                  ["Examination date", formatDate(exam.examDate)],
                  [
                    "Eligibility",
                    `Classes ${exam.eligibleClassMin}–${exam.eligibleClassMax}${exam.eligibilityApproved ? "" : " (proposed)"}`,
                  ],
                  ["Boards", `${exam.boards.join(", ")}${exam.boardsApproved ? "" : " (proposed)"}`],
                  ["Subjects", `${subjects.length} subjects${subjects.every((s) => s.isApproved) ? "" : " (proposed)"}`],
                  ["Mode", exam.mode],
                  ["Languages", exam.languages.join(" & ")],
                  ["Registration fee", `${formatPaise(exam.registrationFeePaise)} (one-time)`],
                  ["Subject fee", `${formatPaise(subjectFee)} per subject`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="font-semibold text-navy sm:text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Subjects ─────────────────────────────────────── */}
      <Section tone="white" id="subjects">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Subjects"
              title="Seven subjects. One chance to shine in each."
              lede="Choose the subjects that excite you. Each one is examined and ranked separately."
            />
            <Button asChild variant="outline">
              <Link href="/syllabus">
                View syllabus overview <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((s, i) => (
              <StaggerItem key={s.id} className={i === 0 ? "lg:col-span-2 lg:row-span-1" : ""}>
                <Link
                  href={`/subjects/${s.subject.slug}`}
                  className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-royal-50 text-royal transition-colors group-hover:bg-navy group-hover:text-gold">
                      <SubjectIcon icon={s.subject.icon} className="size-6" />
                    </span>
                    <span className="font-display text-sm font-bold text-line-strong">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{s.subject.name}</h3>
                  <p lang="hi" className="mt-0.5 text-sm text-muted">{s.subject.nameHi}</p>
                  <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.subject.shortDescription}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-royal">
                    Explore syllabus
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── Fee calculator ───────────────────────────────── */}
      <Section id="fees">
        <div className="container-page">
          <SectionHeading
            eyebrow="Fee calculator"
            title="Simple, transparent fees."
            lede={`A one-time registration fee of ${formatPaise(exam.registrationFeePaise)}, plus ${formatPaise(subjectFee)} for each subject. Select subjects to see the total.`}
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

      {/* ── Awards ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-70" />
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="relative container-page">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              tone="light"
              eyebrow="Awards & recognition"
              title="Excellence Deserves Recognition."
              lede="Top performers in each subject will be recognised with subject-wise national rankings. The final award structure will be announced by GYAN."
            />
            <Button asChild variant="outline-light">
              <Link href="/awards">
                About the awards <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <AwardCards categories={exam.awardCategories} className="mt-14" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <Section tone="white">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="How it works" title="Six steps from registration to recognition." />
          <ol className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-6 lg:gap-5">
            <span aria-hidden className="absolute top-7 right-[8%] left-[8%] hidden h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 lg:block" />
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 0.06} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center">
                  <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full border border-gold/50 bg-white text-navy shadow-card">
                    <s.icon className="size-6" aria-hidden />
                    <span className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-navy text-[0.7rem] font-bold text-gold">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <h3 className="text-base font-bold lg:mt-5">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <div className="mt-14 text-center">
            <Button asChild variant="outline">
              <Link href="/how-to-register">
                Detailed registration guide <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Schools ──────────────────────────────────────── */}
      <Section>
        <div className="container-page">
          <div className="grid overflow-hidden rounded-[var(--radius-2xl)] border border-line bg-white shadow-card lg:grid-cols-[1.1fr_1fr]">
            <Reveal className="p-8 sm:p-12">
              <p className="eyebrow">For schools</p>
              <h2 className="display-lg mt-4">Partner With GYAN. Inspire Young Achievers.</h2>
              <p className="lede mt-5 text-lg">
                Schools play the most important role in a child&apos;s growth. Partnering with GYAN gives your students
                a well-organised national platform to test and celebrate their abilities.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/schools/register">
                    <School aria-hidden /> Register Your School
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/schools/register?visit=1">Request a School Visit</Link>
                </Button>
              </div>
            </Reveal>
            <div className="relative bg-paper p-8 sm:p-12">
              <div aria-hidden className="grid-texture-light pointer-events-none absolute inset-0" />
              <ul className="relative space-y-6">
                {[
                  ["Coordinated registration", "A single point of contact to help your students register and stay informed."],
                  ["Benchmarking insights", "Understand how your students perform subject by subject at a national level."],
                  ["Recognition for your students", "Celebrate achievers from your school with national rankings and certificates."],
                  ["Simple, supported process", "Our team helps with information sessions, schedules and examination-day logistics."],
                ].map(([t, b], i) => (
                  <Reveal key={t} delay={i * 0.06} className="flex gap-4">
                    <span className="font-display text-2xl font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-bold">{t}</h3>
                      <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{b}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <Section tone="white" className="pt-4 sm:pt-6">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="FAQs" title="Questions parents often ask." />
            <Reveal delay={0.1}>
              <p className="mt-5 text-muted">
                Can&apos;t find what you need? Our team is happy to help on{" "}
                <a className="font-semibold text-royal" href={SITE.phoneHref}>{SITE.phone}</a>.
              </p>
              <Button asChild variant="outline" className="mt-7">
                <Link href="/faq">
                  See all FAQs <ArrowRight aria-hidden />
                </Link>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <FaqList items={HOME_FAQS} idPrefix="home" />
          </Reveal>
        </div>
      </Section>

      <CtaBand registrationOpen={open} />
    </>
  );
}
