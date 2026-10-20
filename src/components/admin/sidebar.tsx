"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Award, BadgeIndianRupee, BookOpen, Building2, ClipboardList, FileBadge, FileClock, GraduationCap, LayoutDashboard,
  LogOut, Mail, MapPinned, Medal, Menu, School, ScrollText, Settings, Trophy, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/logo";
import type { AdminNavItem } from "./nav-items";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, students: GraduationCap, registrations: ClipboardList, payments: BadgeIndianRupee,
  schools: School, exam: Building2, subjects: BookOpen, centres: MapPinned, admit: FileBadge, results: Award,
  rankings: Trophy, awards: Medal, certificates: ScrollText, enquiries: Mail, settings: Settings, audit: FileClock,
};

function NavList({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 text-[0.68rem] font-semibold tracking-[0.16em] text-white/40 uppercase">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {items.filter((i) => i.group === g).map((i) => {
              const Icon = ICONS[i.icon] ?? LayoutDashboard;
              const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className={cn("size-4", active && "text-gold")} aria-hidden />
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ items, user }: { items: AdminNavItem[]; user: { name: string; roleLabel: string } }) {
  const [open, setOpen] = React.useState(false);
  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
      <p className="truncate text-xs text-white/50">{user.roleLabel}</p>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-3 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </div>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-navy lg:flex">
        <div className="flex h-16 items-center px-5"><Link href="/admin"><Logo tone="light" /></Link><span className="ml-2 rounded bg-gold px-1.5 py-0.5 text-[0.62rem] font-bold text-navy">ADMIN</span></div>
        <div className="flex-1 overflow-y-auto px-3 py-4"><NavList items={items} /></div>
        {footer}
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-navy px-4 lg:hidden">
        <Link href="/admin"><Logo tone="light" /></Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="grid size-10 place-items-center rounded-lg text-white" aria-label="Open admin menu"><Menu className="size-5" /></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy">
              <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
              <Dialog.Description className="sr-only">Admin navigation</Dialog.Description>
              <div className="flex h-14 items-center justify-between px-4">
                <Logo tone="light" />
                <Dialog.Close className="grid size-10 place-items-center text-white" aria-label="Close menu"><X className="size-5" /></Dialog.Close>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4"><NavList items={items} onNavigate={() => setOpen(false)} /></div>
              {footer}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
