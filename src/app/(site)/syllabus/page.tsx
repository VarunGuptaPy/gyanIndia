import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHero, Section } from "@/components/site/section";
import { SubjectIcon } from "@/components/site/subject-icon";
import { SUBJECT_CONTENT, CLASS_BANDS } from "@/content/subjects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Syllabus Overview",
  description: "Indicative focus areas for each NTHE 2026 subject by class band, pending publication of the official syllabus.",
  path: "/syllabus",
});

export default function SyllabusPage() {
  return (
    <>
      <PageHero
        eyebrow="Syllabus"
        title="Syllabus overview"
        lede="An indicative guide to the areas each subject is likely to cover at each class level, to help students begin preparing."
        crumbs={[{ label: "Syllabus" }]}
      />
      <Section tone="white">
        <div className="container-page">
          <Alert tone="warning" title="The official syllabus has not yet been published">
            This overview is indicative only. GYAN will publish the official syllabus and question pattern on this page
            once approved. Where they differ, the official syllabus applies.
          </Alert>

          <nav aria-label="Jump to subject" className="mt-10 flex flex-wrap gap-2">
            {SUBJECT_CONTENT.map((s) => (
              <a key={s.slug} href={`#${s.slug}`} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-navy hover:border-royal hover:text-royal">
                {s.name}
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-16">
            {SUBJECT_CONTENT.map((s) => (
              <section key={s.slug} id={s.slug} className="scroll-mt-28">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-navy text-gold">
                    <SubjectIcon icon={s.icon} className="size-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">{s.name}</h2>
                    <Link href={`/subjects/${s.slug}`} className="text-sm font-medium text-royal hover:underline">Subject details</Link>
                  </div>
                </div>
                <div className="mt-6 grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                  {CLASS_BANDS.map((band) => {
                    const b = s.bands.find((x) => x.label === band);
                    return (
                      <div key={band} className="bg-white p-5">
                        <h3 className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">{band}</h3>
                        <ul className="mt-3 space-y-2 text-sm text-ink/85">
                          {b?.topics.map((t) => <li key={t}>{t}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
