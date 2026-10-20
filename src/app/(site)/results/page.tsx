import Link from "next/link";
import { BadgeCheck, Clock, Lock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/section";
import { getCurrentExam } from "@/lib/exam";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Results", description: "How and when NTHE 2026 results and subject-wise national rankings will be available.", path: "/results" });

export default async function ResultsPage() {
  const exam = await getCurrentExam();
  const published = exam?.resultsPublished ?? false;
  return (
    <>
      <PageHero
        eyebrow="Results"
        title={published ? "NTHE 2026 results are available" : "NTHE 2026 results"}
        lede={
          published
            ? "Results have been published. Log in to your guardian account to view your child's marks and — where published — national rankings."
            : `Results will be published after the examination on ${formatDate(exam?.examDate)}. The result date is ${exam?.resultDate ? formatDate(exam.resultDate) : "to be announced"}.`
        }
        crumbs={[{ label: "Results" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/student/results">View my child&apos;s results</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/certificate/verify">Verify a certificate</Link></Button>
        </div>
      </PageHero>
      <Section>
        <div className="container-page grid gap-6 md:grid-cols-3">
          {[
            { icon: Lock, title: "Private by design", body: "Results are shown only to the guardian's account. We do not publish a public list of children's names, marks or schools." },
            { icon: Trophy, title: "Subject-wise rankings", body: exam?.rankingsPublished ? "National rankings have been published and appear alongside each subject's result." : "National rankings will appear alongside each subject's result once approved and published." },
            { icon: published ? BadgeCheck : Clock, title: published ? "Results published" : "Status: awaiting examination", body: published ? "Log in to view results and download certificates as they are issued." : "We will notify registered guardians when results are available." },
          ].map((c) => (
            <div key={c.title} className="rounded-[var(--radius-xl)] border border-line bg-white p-7">
              <c.icon className="size-7 text-royal" aria-hidden />
              <h2 className="mt-5 text-lg font-bold">{c.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
