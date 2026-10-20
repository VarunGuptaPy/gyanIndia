import { PageHero, Section } from "@/components/site/section";
import { SchoolForm } from "@/components/forms/school-form";
import { getCurrentExam } from "@/lib/exam";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Register Your School",
  description: "Submit a partnership enquiry or request a school visit from GYAN for the National Talent Hunt Examination 2026.",
  path: "/schools/register",
});

export default async function SchoolRegisterPage({ searchParams }: { searchParams: Promise<{ visit?: string }> }) {
  const { visit } = await searchParams;
  const exam = await getCurrentExam();
  return (
    <>
      <PageHero
        eyebrow="School partnership"
        title={visit ? "Request a school visit" : "Register your school"}
        lede="Share a few details and our team will be in touch. Fields marked * are required."
        crumbs={[{ href: "/schools", label: "Schools" }, { label: "Register" }]}
      />
      <Section>
        <div className="container-page grid gap-10 lg:grid-cols-[1.8fr_1fr]">
          <SchoolForm boards={exam?.boards ?? ["CBSE", "ICSE", "UP Board"]} requestVisit={visit === "1"} />
          <aside className="space-y-4 text-sm text-ink/80 lg:pt-2">
            <div className="rounded-[var(--radius-xl)] border border-line bg-white p-6">
              <h2 className="font-bold text-navy">Prefer to talk?</h2>
              <p className="mt-2">Call <a className="font-semibold text-royal" href={SITE.phoneHref}>{SITE.phone}</a> or email <a className="font-semibold text-royal" href={`mailto:${SITE.enquiryEmail}`}>{SITE.enquiryEmail}</a>.</p>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-line bg-white p-6">
              <h2 className="font-bold text-navy">What happens next?</h2>
              <p className="mt-2">Your enquiry is reviewed by the GYAN schools team, who will contact the person named in the form.</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
