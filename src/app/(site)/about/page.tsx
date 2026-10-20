import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, Lightbulb, Scale, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import { CtaBand } from "@/components/site/cta-band";
import { getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About GYAN",
  description:
    "GYAN — Global Young Achievers Network is an education-focused initiative committed to identifying young talent, encouraging academic excellence and recognising achievement.",
  path: "/about",
});

const VALUES = [
  { icon: Scale, title: "Integrity", body: "Fair assessments, transparent processes and honest communication with every family and school." },
  { icon: Users, title: "Inclusivity", body: "Opportunities designed for students from different boards, regions and languages." },
  { icon: Star, title: "Excellence", body: "High standards in everything we do — from question design to examination-day conduct." },
  { icon: Lightbulb, title: "Innovation", body: "Subjects and formats that reflect how the world is changing, including computing and AI." },
  { icon: Sparkles, title: "Recognition", body: "Meaningful acknowledgement of achievement, subject by subject." },
  { icon: ShieldCheck, title: "Responsibility", body: "Careful protection of children's personal data and a duty of care to every participant." },
];

export default async function AboutPage() {
  const open = isRegistrationOpen(await getCurrentExam());
  return (
    <>
      <PageHero
        eyebrow="About GYAN"
        title="Every child has a talent. We help it be seen."
        lede="GYAN — Global Young Achievers Network — is an education-focused initiative committed to identifying young talent, encouraging academic excellence, and creating opportunities for students to demonstrate their abilities."
        crumbs={[{ label: "About GYAN" }]}
      />

      <Section tone="white">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">Who we are</p>
            <h2 className="display-md mt-4">An initiative built around students.</h2>
          </Reveal>
          <Reveal delay={0.1} className="prose-gyan">
            <p>
              Talent in young people is everywhere — in the child who solves puzzles before anyone else, the one who reads
              everything in sight, and the one who keeps asking how things work. Too often, that talent goes unnoticed
              because there are few structured opportunities to show it.
            </p>
            <p>
              GYAN exists to create those opportunities. We design and conduct assessments that let students demonstrate
              what they know and how they think, subject by subject, and we recognise achievement in a way that encourages
              them to keep learning.
            </p>
            <p>
              Our work is guided by a simple belief, expressed in our motto:{" "}
              <strong>{SITE.tagline}</strong>
            </p>
          </Reveal>
        </div>
      </Section>

      <Section>
        <div className="container-page grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Compass,
              label: "Our mission",
              text: "To encourage student potential through structured assessments, academic opportunities, and meaningful recognition.",
            },
            {
              icon: HeartHandshake,
              label: "Our vision",
              text: "To create a future where every young learner has an opportunity to discover their strengths and pursue excellence.",
            },
          ].map((m, i) => (
            <Reveal key={m.label} delay={i * 0.1}>
              <div className={`relative h-full overflow-hidden rounded-[var(--radius-2xl)] p-8 sm:p-10 ${i === 0 ? "bg-navy text-white" : "border border-line bg-white"}`}>
                {i === 0 && <div aria-hidden className="grid-texture absolute inset-0" />}
                <m.icon className={`relative size-8 ${i === 0 ? "text-gold" : "text-royal"}`} aria-hidden />
                <p className={`relative mt-8 text-xs font-semibold tracking-[0.2em] uppercase ${i === 0 ? "text-gold-200" : "text-muted"}`}>
                  {m.label}
                </p>
                <p className={`relative mt-3 font-display text-2xl leading-snug font-bold sm:text-[1.75rem] ${i === 0 ? "text-white" : "text-navy"}`}>
                  {m.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="container-page">
          <SectionHeading eyebrow="Core values" title="What we stand for." />
          <Stagger className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <StaggerItem key={v.title} className="border-t-2 border-navy pt-6">
                <v.icon className="size-6 text-gold-600" aria-hidden />
                <h3 className="mt-4 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{v.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section>
        <div className="container-page grid gap-14 lg:grid-cols-2">
          <Reveal className="prose-gyan">
            <p className="eyebrow">Educational objectives</p>
            <h2 className="!mt-4">What we aim to achieve</h2>
            <ul>
              <li>Provide students with fair, well-designed assessments that go beyond rote learning.</li>
              <li>Help students and parents understand individual strengths and areas for growth.</li>
              <li>Encourage curiosity in emerging fields such as computing and artificial intelligence.</li>
              <li>Recognise excellence at a national level, subject by subject.</li>
              <li>Work with schools to make participation simple, supported and meaningful.</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="prose-gyan">
            <p className="eyebrow">Student development philosophy</p>
            <h2 className="!mt-4">Growth before competition</h2>
            <p>
              A good examination is not only a test — it is a learning experience. We want every student who takes part
              to leave with more confidence than they came with, whatever their score.
            </p>
            <p>
              That is why our papers reward understanding and reasoning, why each subject is assessed separately, and why
              results are shared privately with families first. Competition is a motivator; growth is the goal.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <div className="container-page grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Talent recognition",
              body: "Subject-wise national rankings let a student shine in the subject they love — not only on an aggregate score.",
              href: "/awards",
              cta: "About the awards",
            },
            {
              title: "School partnerships",
              body: "We work alongside schools to inform students, coordinate participation and celebrate achievers together.",
              href: "/schools",
              cta: "Partner with GYAN",
            },
            {
              title: "Flagship examination",
              body: "The National Talent Hunt Examination 2026 is GYAN's flagship programme, held offline on 12 December 2026.",
              href: "/nthe-2026",
              cta: "Explore NTHE 2026",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <Link href={c.href} className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-line bg-paper p-7 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-lift">
                <h3 className="text-xl font-bold">{c.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted">{c.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-royal">
                  {c.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="container-page mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/contact">Get in touch with GYAN</Link>
          </Button>
        </div>
      </Section>

      <CtaBand registrationOpen={open} />
    </>
  );
}
