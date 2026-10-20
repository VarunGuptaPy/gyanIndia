import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/section";
import { Reveal } from "@/components/site/motion";
import { FaqList } from "@/components/site/faq-list";
import { FAQ_GROUPS } from "@/content/faq";
import { getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How to Register",
  description: "A step-by-step guide for parents and guardians to register a student for NTHE 2026.",
  path: "/how-to-register",
});

const STEPS = [
  { title: "Student details", body: "Enter the student's full name (as it should appear on the admit card and certificate), class, board, school, city, state and preferred examination language." },
  { title: "Parent / guardian details", body: "Enter your name, mobile number and email address. This creates your GYAN guardian account, which you will use to manage the registration." },
  { title: "Select subjects", body: "Choose one or more subjects. The fee updates instantly: ₹50 registration plus ₹250 per subject." },
  { title: "Review and consent", body: "Check every detail carefully. As the parent or guardian, give consent for GYAN to process your child's data for the examination." },
  { title: "Pay securely", body: "Complete payment through our secure payment gateway. Your registration is confirmed only after GYAN verifies the payment with the gateway." },
  { title: "Confirmation", body: "You will receive a unique registration number. Your dashboard shows the registration, payment receipt and — when released — the admit card." },
];

export default async function HowToRegisterPage() {
  const open = isRegistrationOpen(await getCurrentExam());
  return (
    <>
      <PageHero
        eyebrow="Registration guide"
        title="How to register for NTHE 2026"
        lede="Registration takes about ten minutes. Because participants are minors, it must be completed by a parent or legal guardian."
        crumbs={[{ label: "How to Register" }]}
      >
        <Button asChild size="lg">
          <Link href={open ? "/register" : "/nthe-2026"}>{open ? "Start registration" : "Registration opening soon"} <ArrowRight aria-hidden /></Link>
        </Button>
      </PageHero>
      <Section tone="white">
        <div className="container-page grid gap-14 lg:grid-cols-[1.4fr_1fr]">
          <ol className="relative space-y-10 border-l border-line pl-8 sm:pl-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <Reveal delay={i * 0.04}>
                  <span className="absolute top-0 -left-[3.05rem] grid size-9 place-items-center rounded-full border-2 border-white bg-navy text-sm font-bold text-gold shadow-card sm:-left-[3.55rem]">
                    {i + 1}
                  </span>
                  <h2 className="text-xl font-bold">{s.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
          <aside className="space-y-5">
            <div className="rounded-[var(--radius-xl)] border border-line bg-paper p-6">
              <FileCheck2 className="size-6 text-royal" aria-hidden />
              <h2 className="mt-4 text-lg font-bold">Keep ready</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/80 marker:text-gold">
                <li>Student&apos;s full name, class and school name</li>
                <li>Your mobile number and email address</li>
                <li>A payment method (UPI, card or net banking)</li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-line bg-paper p-6">
              <ShieldCheck className="size-6 text-success" aria-hidden />
              <h2 className="mt-4 text-lg font-bold">Your child&apos;s data is protected</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                We collect only what is needed to run the examination and never publish a child&apos;s full name or school without consent.{" "}
                <Link href="/child-data-protection" className="font-medium text-royal underline">Learn more</Link>
              </p>
            </div>
          </aside>
        </div>
      </Section>
      <Section>
        <div className="container-page max-w-4xl">
          <h2 className="display-md mb-8">Registration questions</h2>
          <FaqList items={FAQ_GROUPS[1].items} idPrefix="reg" />
        </div>
      </Section>
    </>
  );
}
