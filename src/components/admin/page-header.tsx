import * as React from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "default" | "gold" | "navy" }) {
  return (
    <div className={cn("rounded-[var(--radius-xl)] border p-5", tone === "navy" ? "border-navy bg-navy text-white" : tone === "gold" ? "border-gold/40 bg-gold-50" : "border-line bg-white")}>
      <p className={cn("text-xs font-semibold tracking-wider uppercase", tone === "navy" ? "text-white/60" : "text-muted")}>{label}</p>
      <p className={cn("mt-2 font-display text-3xl font-extrabold tabular-nums", tone === "navy" ? "text-white" : "text-navy")}>{value}</p>
      {hint && <p className={cn("mt-1 text-xs", tone === "navy" ? "text-white/60" : "text-muted")}>{hint}</p>}
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">{children}</form>;
}

export function Pagination({ page, pageSize, total, params }: { page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const link = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    sp.set("page", String(p));
    return `?${sp}`;
  };
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-muted">
      <span>{total} record{total === 1 ? "" : "s"} · page {page} of {pages}</span>
      <span className="flex gap-2">
        {page > 1 && <a className="rounded-full border border-line px-3 py-1 hover:bg-paper" href={link(page - 1)}>Previous</a>}
        {page < pages && <a className="rounded-full border border-line px-3 py-1 hover:bg-paper" href={link(page + 1)}>Next</a>}
      </span>
    </div>
  );
}
