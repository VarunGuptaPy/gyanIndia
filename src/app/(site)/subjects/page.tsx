import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero, Section } from "@/components/site/section";
import { Stagger, StaggerItem } from "@/components/site/motion";
import { SubjectIcon } from "@/components/site/subject-icon";
import { CtaBand } from "@/components/site/cta-band";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { subjectContent } from "@/content/subjects";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const metadata = pageMetadata({
  title: "Subjects",
  description:
    "NTHE 2026 subjects: English, Mathematics, Science, General Knowledge, Logical Reasoning, Computer Applications and Artificial Intelligence.",
  path: "/subjects",
});

export default async function SubjectsPage() {
  const exam = await getCurrentExam();
  if (!exam) notFound();
  const subjects = availableSubjects(exam);
  return (
    <>
      <PageHero
        eyebrow="Subjects"
        title="Find the subject where you shine."
        lede="NTHE 2026 offers seven proposed subjects. Students may choose any combination — each is examined and ranked separately."
        crumbs={[{ label: "Subjects" }]}
      />
      <Section>
        <Stagger className="container-page grid gap-6 md:grid-cols-2">
          {subjects.map((s, i) => {
            const content = subjectContent(s.subject.slug);
            return (
              <StaggerItem key={s.id}>
                <Link
                  href={`/subjects/${s.subject.slug}`}
                  className="group grid h-full gap-6 rounded-[var(--radius-2xl)] border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:grid-cols-[auto_1fr] sm:p-8"
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-navy text-gold">
                    <SubjectIcon icon={s.subject.icon} className="size-7" />
                  </span>
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="text-2xl font-bold">{s.subject.name}</h2>
                      <span className="font-display text-sm font-bold text-line-strong">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p lang="hi" className="text-sm text-muted">{s.subject.nameHi}</p>
                    <p className="mt-4 leading-relaxed text-muted">{content?.intro ?? s.subject.shortDescription}</p>
                    {content && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {content.skills.map((sk) => (
                          <li key={sk} className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-navy">{sk}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm">
                      <span className="text-muted">Fee: <strong className="text-navy">{formatPaise(s.feePaise)}</strong></span>
                      <span className="inline-flex items-center gap-1 font-semibold text-royal">
                        Explore syllabus <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>
      <CtaBand registrationOpen={isRegistrationOpen(exam)} />
    </>
  );
}
