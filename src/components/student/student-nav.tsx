"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Award, FileBadge, LayoutDashboard, LogOut, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/admit-card", label: "Admit Card", icon: FileBadge },
  { href: "/student/results", label: "Results", icon: Award },
  { href: "/student/certificates", label: "Certificates", icon: ScrollText },
];

export function StudentNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between gap-4 overflow-x-auto">
      <nav aria-label="Student portal" className="flex gap-1">
        {LINKS.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                active ? "bg-navy text-white" : "text-navy/70 hover:bg-white hover:text-navy",
              )}
            >
              <l.icon className="size-4" aria-hidden /> {l.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-danger"
      >
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </div>
  );
}
