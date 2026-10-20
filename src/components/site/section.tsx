import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow", tone === "light" && "eyebrow-light", align === "center" && "justify-center")}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn("display-lg mt-4", tone === "light" && "text-white")}>{title}</h2>
      {lede && <p className={cn("lede mt-5", tone === "light" && "text-white/70")}>{lede}</p>}
    </Reveal>
  );
}

export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  crumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div aria-hidden className="grid-texture-light pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full border border-gold/25" />
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-[360px] rounded-full border border-gold/20" />
      <div className="relative container-page py-14 sm:py-20">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-navy">Home</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5" aria-hidden />
                  {c.href ? (
                    <Link href={c.href} className="hover:text-navy">{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-navy">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Reveal className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="display-lg mt-4 sm:text-5xl lg:text-[3.6rem]">{title}</h1>
          {lede && <p className="lede mt-6 max-w-2xl">{lede}</p>}
        </Reveal>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Section({
  className,
  children,
  id,
  tone = "paper",
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  tone?: "paper" | "white" | "navy";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 sm:py-28",
        tone === "white" && "bg-white",
        tone === "navy" && "bg-navy text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DraftNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 rounded-xl border border-warning/30 bg-warning-50 px-5 py-4 text-sm leading-relaxed text-navy">
      <p className="font-semibold text-warning">Draft — subject to professional legal review</p>
      <p className="mt-1 text-ink/80">{children}</p>
    </div>
  );
}
