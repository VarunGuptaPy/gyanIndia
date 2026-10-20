import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHero, Section } from "@/components/site/section";
import { Reveal } from "@/components/site/motion";
import { SubjectIcon } from "@/components/site/subject-icon";
import { CtaBand } from "@/components/site/cta-band";
import { SUBJECT_CONTENT, subjectContent } from "@/content/subjects";
import { getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject } = await params;
  const c = subjectContent(subject);
  if (!c) return {};
  return pageMetadata({ title: `${c.name} — NTHE 2026`, description: c.short, path: `/subjects/${c.slug}` });
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const content = subjectContent(subject);
  const exam = await getCurrentExam();
  const es = exam?.subjects.find((s) => s.subject.slug === subject);
  if (!content || !exam || !es) notFound();

  const idx = SUBJECT_CONTENT.findIndex((s) => s.slug === subject);
  const prev = SUBJECT_CONTENT[(idx - 1 + SUBJECT_CONTENT.length) % SUBJECT_CONTENT.length];
  const next = SUBJECT_CONTENT[(idx + 1) % SUBJECT_CONTENT.length];
  const open = isRegistrationOpen(exam);

  return (
    <>
      <PageHero
        eyebrow={`Subject ${String(idx + 1).padStart(2, "0")} of ${SUBJECT_CONTENT.length}`}
        title={content.name}
        lede={content.intro}
        crumbs={[{ href: "/subjects", label: "Subjects" }, { label: content.name }]}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-navy text-gold">
            <SubjectIcon icon={content.icon} className="size-7" />
          </span>
          <div className="text-sm">
            <p lang="hi" className="font-semibold text-navy">{content.nameHi}</p>
            <p className="text-muted">Subject fee: {formatPaise(es.feePaise)}{es.isAvailable ? "" : " · currently unavailable"}</p>
          </div>
        </div>
      </PageHero>

      <Section tone="white">
        <div className="container-page">
          <Alert tone="warning" title="Indicative focus areas">
            The official NTHE 2026 syllabus and question pattern have not yet been published. The areas below are
            indicative, based on what students commonly study at each level, and will be replaced by the official
            syllabus once it is approved.
          </Alert>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_2.2fr]">
            <Reveal>
              <h2 className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">Skills assessed</h2>
              <ul className="mt-5 space-y-3">
                {content.skills.map((s) => (
                  <li key={s} className="flex items-center gap-3 font-medium text-navy">
                    <span aria-hidden className="h-px w-5 bg-gold" /> {s}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {content.bands.map((b, i) => (
                <Reveal key={b.label} delay={i * 0.06}>
                  <div className="h-full rounded-[var(--radius-xl)] border border-line bg-paper p-6">
                    <h3 className="font-display text-lg font-bold text-navy">{b.label}</h3>
                    <ul className="mt-4 space-y-2.5 text-[0.95rem] text-ink/85">
                      {b.topics.map((t) => (
                        <li key={t} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-royal" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <nav aria-label="More subjects" className="mt-16 flex flex-col justify-between gap-4 border-t border-line pt-8 sm:flex-row">
            <Button asChild variant="ghost">
              <Link href={`/subjects/${prev.slug}`}><ArrowLeft aria-hidden /> {prev.name}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/subjects/${next.slug}`}>{next.name} <ArrowRight aria-hidden /></Link>
            </Button>
          </nav>
        </div>
      </Section>
      <CtaBand registrationOpen={open} title={`Ready to take ${content.name}?`} />
    </>
  );
}
