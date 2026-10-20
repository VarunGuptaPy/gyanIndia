import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHero, Section } from "@/components/site/section";
import { RegistrationWizard } from "@/components/forms/registration-wizard";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/rbac";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const metadata = pageMetadata({
  title: "Register for NTHE 2026",
  description: "Register a student for GYAN's National Talent Hunt Examination 2026.",
  path: "/register",
});

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ subjects?: string }> }) {
  const { subjects: pre } = await searchParams;
  const [exam, user] = await Promise.all([getCurrentExam(), currentUser()]);
  if (!exam) notFound();
  const open = isRegistrationOpen(exam);

  const guardian =
    user?.role === "GUARDIAN" ? await db.guardian.findUnique({ where: { userId: user.id } }) : null;

  return (
    <>
      <PageHero
        eyebrow={exam.shortName}
        title="Student registration"
        lede="Complete each step to register. A parent or guardian must fill in this form."
        crumbs={[{ label: "Register" }]}
      />
      <Section className="pt-10 sm:pt-14">
        <div className="container-page">
          {!open ? (
            <div className="mx-auto max-w-xl rounded-[var(--radius-2xl)] border border-line bg-white p-10 text-center shadow-card">
              <CalendarClock className="mx-auto size-12 text-gold-600" aria-hidden />
              <h2 className="mt-6 text-2xl font-bold">Registrations are not open yet</h2>
              <p className="mt-3 text-muted">
                Registration for {exam.name} will open soon. Please check back, or contact us to be informed.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild><Link href="/nthe-2026">Examination details</Link></Button>
                <Button asChild variant="outline"><Link href="/contact">Contact us</Link></Button>
              </div>
            </div>
          ) : user && isAdminRole(user.role) ? (
            <Alert tone="warning" title="You are signed in as an administrator">
              Administrator accounts cannot register students. Please log out and register using a guardian account.
            </Alert>
          ) : (
            <RegistrationWizard
              examName={exam.name}
              subjects={availableSubjects(exam).map((s) => ({
                id: s.id,
                name: s.subject.name,
                nameHi: s.subject.nameHi,
                icon: s.subject.icon,
                feePaise: s.feePaise,
                short: s.subject.shortDescription,
              }))}
              registrationFeePaise={exam.registrationFeePaise}
              boards={exam.boards}
              classMin={exam.eligibleClassMin}
              classMax={exam.eligibleClassMax}
              languages={exam.languages.map((l) => (l === "Hindi" ? "HINDI" : "ENGLISH"))}
              guardian={guardian ? { fullName: guardian.fullName, mobile: guardian.mobile, email: guardian.email, address: guardian.address } : null}
              preselected={pre?.split(",").filter(Boolean).slice(0, 20) ?? []}
            />
          )}
        </div>
      </Section>
    </>
  );
}
