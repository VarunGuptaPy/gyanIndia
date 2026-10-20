import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./motion";

export function CtaBand({
  registrationOpen,
  title = "Your Journey Towards Excellence Starts Here.",
  lede = "Register for the National Talent Hunt Examination 2026 and give your child the chance to discover their strengths.",
}: {
  registrationOpen: boolean;
  title?: string;
  lede?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy py-20 text-white sm:py-24">
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0" />
      <svg aria-hidden viewBox="0 0 600 600" className="pointer-events-none absolute -right-40 -bottom-64 w-[720px] text-gold opacity-30">
        <circle cx="300" cy="300" r="298" fill="none" stroke="currentColor" />
        <circle cx="300" cy="300" r="220" fill="none" stroke="currentColor" />
        <circle cx="300" cy="300" r="142" fill="none" stroke="currentColor" />
      </svg>
      <Reveal className="relative container-page flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow eyebrow-light">NTHE 2026 · 12 December 2026</p>
          <h2 className="display-lg mt-4 text-white">{title}</h2>
          <p className="mt-5 text-lg text-white/70">{lede}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="gold" size="lg">
            <Link href={registrationOpen ? "/register" : "/nthe-2026"}>
              {registrationOpen ? "Register for NTHE 2026" : "View Examination Details"} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <Link href="/contact">Talk to Us</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
