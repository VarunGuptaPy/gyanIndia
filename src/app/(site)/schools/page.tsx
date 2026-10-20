import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck, HandHeart, Megaphone, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "For Schools — Partner With GYAN",
  description: "Partner with GYAN to give your students a national platform through the National Talent Hunt Examination 2026.",
  path: "/schools",
});

const BENEFITS = [
  { icon: Users, title: "Coordinated participation", body: "A dedicated GYAN contact helps your coordinator inform parents and manage participation smoothly." },
  { icon: BarChart3, title: "Subject-wise insight", body: "Understand how your students perform in each subject compared with peers nationally." },
  { icon: Megaphone, title: "Information sessions", body: "Request a school visit or session to explain the examination to students and parents." },
  { icon: HandHeart, title: "Celebrate achievers", body: "Recognise students from your school who achieve national rankings and certificates." },
  { icon: CalendarCheck, title: "Clear timelines", body: "Receive schedules, instructions and updates well ahead of key dates." },
  { icon: School, title: "Every board welcome", body: "The examination is proposed for CBSE, ICSE and UP Board students, in English and Hindi." },
];

export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="For schools"
        title="Partner With GYAN. Inspire Young Achievers."
        lede="Schools are at the heart of every child's growth. Partner with GYAN to give your students a well-organised national platform to test and celebrate their abilities."
        crumbs={[{ label: "Schools" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/schools/register">Register Your School <ArrowRight aria-hidden /></Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/schools/register?visit=1">Request a School Visit</Link></Button>
        </div>
      </PageHero>
      <Section tone="white">
        <div className="container-page">
          <SectionHeading eyebrow="Why partner" title="What partnership means for your school." />
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title} className="rounded-[var(--radius-xl)] border border-line bg-paper p-7">
                <b.icon className="size-7 text-royal" aria-hidden />
                <h3 className="mt-5 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{b.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>
      <Section>
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">The process</p>
            <h2 className="display-md mt-4">From enquiry to examination day</h2>
            <ol className="mt-8 space-y-6">
              {[
                ["Submit an enquiry", "Share your school's details using the partnership form."],
                ["We get in touch", "Our team contacts your principal or coordinator to understand your needs."],
                ["Review and approval", "Partnerships are reviewed by GYAN. Approved schools are confirmed in writing."],
                ["Participation", "We support your school through registrations, admit cards and examination day."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-display text-2xl font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-muted">{b}</p></div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-navy p-8 text-white sm:p-10">
            <div aria-hidden className="grid-texture absolute inset-0" />
            <div className="relative">
              <h2 className="display-md text-white">Ready to bring NTHE 2026 to your students?</h2>
              <p className="mt-4 text-white/70">
                Tell us about your school. There is no obligation — we will answer your questions and share everything you need to decide.
              </p>
              <p className="mt-4 text-sm text-white/55">
                Note: a school is described as an official GYAN partner only after its partnership has been approved.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="gold" size="lg"><Link href="/schools/register">Register Your School</Link></Button>
                <Button asChild variant="outline-light" size="lg"><Link href="/schools/register?visit=1">Request a Visit</Link></Button>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
