"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { formatPaise } from "@/lib/fees";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "./motion";
import { SubjectIcon } from "./subject-icon";

export type CalculatorSubject = { id: string; name: string; icon: string; feePaise: number };

export function FeeCalculator({
  subjects,
  registrationFeePaise,
  registrationOpen,
}: {
  subjects: CalculatorSubject[];
  registrationFeePaise: number;
  registrationOpen: boolean;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const chosen = subjects.filter((s) => selected.includes(s.id));
  const subjectTotal = chosen.reduce((sum, s) => sum + s.feePaise, 0);
  const total = chosen.length ? registrationFeePaise + subjectTotal : 0;

  return (
    <div className="grid overflow-hidden rounded-[var(--radius-2xl)] border border-line bg-white shadow-lift lg:grid-cols-[1.35fr_1fr]">
      <fieldset className="p-6 sm:p-8">
        <legend className="sr-only">Choose subjects</legend>
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-lg font-bold text-navy">Choose subjects</p>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setSelected(subjects.map((s) => s.id))}
              className="rounded-full px-3 py-1.5 font-medium text-royal hover:bg-royal-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={!selected.length}
              className="rounded-full px-3 py-1.5 font-medium text-muted hover:bg-paper disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {subjects.map((s) => {
            const on = selected.includes(s.id);
            return (
              <li key={s.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all",
                    on ? "border-royal bg-royal-50 shadow-[0_0_0_3px_rgb(23_78_166/0.1)]" : "border-line hover:border-navy/30",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(s.id)} />
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                      on ? "bg-royal text-white" : "bg-paper text-navy",
                    )}
                  >
                    <SubjectIcon icon={s.icon} className="size-[18px]" />
                  </span>
                  <span className="flex-1 text-[0.92rem] leading-tight font-semibold text-navy">
                    {s.name}
                    <span className="block text-xs font-normal text-muted">{formatPaise(s.feePaise)}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 place-items-center rounded-full border transition-all",
                      on ? "border-royal bg-royal text-white" : "border-line-strong",
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="relative flex flex-col justify-between bg-navy p-6 text-white sm:p-8">
        <div aria-hidden className="grid-texture pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Fee summary</p>
          <dl className="mt-6 space-y-3 text-[0.95rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">Registration fee (one-time)</dt>
              <dd className="font-semibold tabular-nums">{chosen.length ? formatPaise(registrationFeePaise) : <Minus className="size-4 text-white/40" />}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/70">
                Subjects × {chosen.length}
              </dt>
              <dd className="font-semibold tabular-nums">{formatPaise(subjectTotal)}</dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-dashed border-white/20 pt-6" aria-live="polite">
            <p className="text-sm text-white/70">Total payable</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums text-white">
              <AnimatedNumber value={total} format={formatPaise} />
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              ₹50 one-time registration + ₹250 per subject. Any applicable taxes or gateway charges will be shown before payment.
            </p>
          </div>
        </div>
        <div className="relative mt-8">
          {registrationOpen ? (
            <Button asChild variant="gold" size="lg" className="w-full">
              <Link href={selected.length ? `/register?subjects=${selected.join(",")}` : "/register"}>
                {selected.length ? "Continue to Registration" : "Start Registration"} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm text-white/80">
              Registration will open soon. This calculator is for planning only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
