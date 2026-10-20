"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Faq } from "@/content/faq";

export function FaqList({ items, idPrefix = "faq" }: { items: Faq[]; idPrefix?: string }) {
  return (
    <Accordion type="single" collapsible className="rounded-2xl border border-line bg-white px-5 shadow-card sm:px-8">
      {items.map((f, i) => (
        <AccordionItem key={f.q} value={`${idPrefix}-${i}`}>
          <AccordionTrigger>{f.q}</AccordionTrigger>
          <AccordionContent>{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
