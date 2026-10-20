import { Award, Medal, ScrollText, Trophy } from "lucide-react";
import type { AwardCategory } from "@prisma/client";
import { formatPaise } from "@/lib/fees";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";

const RANK_STYLES = [
  { ring: "from-[#F3D88A] via-gold to-[#A87E22]", label: "text-gold", icon: Trophy },
  { ring: "from-[#E8EDF4] via-[#B9C4D3] to-[#7E8A9C]", label: "text-[#CBD5E1]", icon: Medal },
  { ring: "from-[#E8B98A] via-[#C08045] to-[#8A5527]", label: "text-[#E2A673]", icon: Medal },
  { ring: "from-royal-100 via-[#7FA1DA] to-royal", label: "text-[#9DB8E8]", icon: Award },
];

/**
 * Award categories are configurable by administrators. Prize details are shown only
 * when a category is marked confirmed — otherwise "To be announced".
 */
export function AwardCards({ categories, className }: { categories: AwardCategory[]; className?: string }) {
  return (
    <Stagger className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {categories.map((c, i) => {
        const style = RANK_STYLES[Math.min(i, RANK_STYLES.length - 1)];
        const items = [
          c.cashPrizePaise ? `Cash prize of ${formatPaise(c.cashPrizePaise)}` : null,
          c.includesTrophy ? "Trophy" : null,
          c.includesMedal ? "Medal" : null,
          c.includesCertificate ? "Certificate of achievement" : null,
        ].filter(Boolean) as string[];
        const rankText = c.rankFrom === c.rankTo ? `Rank ${c.rankFrom}` : `Ranks ${c.rankFrom}–${c.rankTo}`;
        return (
          <StaggerItem key={c.id}>
            <article className="group relative h-full overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-gold/40">
              <div className={cn("grid size-14 place-items-center rounded-full bg-gradient-to-br p-[2px]")}>
                <span className={cn("grid size-full place-items-center rounded-full bg-gradient-to-br", style.ring)}>
                  <style.icon className="size-6 text-navy" aria-hidden />
                </span>
              </div>
              <p className={cn("mt-6 text-xs font-semibold tracking-[0.18em] uppercase", style.label)}>{rankText}</p>
              <h3 className="mt-1.5 text-xl font-bold text-white">{c.title}</h3>
              {c.isConfirmed ? (
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {items.map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <ScrollText className="size-3.5 text-gold" aria-hidden /> {it}
                    </li>
                  ))}
                  {c.description && <li className="pt-1 text-white/60">{c.description}</li>}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  Subject-wise national recognition. Prize details to be announced.
                </p>
              )}
            </article>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
