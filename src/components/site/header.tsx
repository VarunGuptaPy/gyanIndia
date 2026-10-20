"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { MAIN_NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

type HeaderProps = {
  registrationOpen: boolean;
  account: { href: string; label: string } | null;
};

export function Header({ registrationOpen, account }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cta = registrationOpen
    ? { href: "/register", label: "Register Now" }
    : { href: "/nthe-2026", label: "Exam Details" };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-line bg-white/90 shadow-[0_6px_24px_-16px_rgb(11_31_58/0.35)] backdrop-blur-md"
          : "border-transparent bg-white",
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label={`${SITE.shortName} home`} className="shrink-0 rounded-md">
          <Logo priority />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3 py-2 text-[0.9rem] font-medium whitespace-nowrap transition-colors xl:px-3.5",
                    isActive(item.href) ? "text-navy" : "text-ink/70 hover:text-navy",
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span aria-hidden className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gold" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {account ? (
            <Link
              href={account.href}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-ink/75 hover:text-navy sm:inline-flex lg:hidden xl:inline-flex"
            >
              <LayoutDashboard className="size-4" aria-hidden /> {account.label}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-ink/75 hover:text-navy sm:inline-flex lg:hidden xl:inline-flex"
            >
              <LogIn className="size-4" aria-hidden /> Log in
            </Link>
          )}
          <Button asChild size="sm" className="hidden h-10 px-5 sm:inline-flex">
            <Link href={cta.href}>
              {cta.label} <ArrowRight aria-hidden />
            </Link>
          </Button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full border border-line text-navy lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms]" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl data-[state=open]:animate-[slide-in_280ms_cubic-bezier(.22,1,.36,1)]">
                <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
                  <Dialog.Title asChild>
                    <span>
                      <Logo />
                    </span>
                  </Dialog.Title>
                  <Dialog.Close
                    className="grid size-11 place-items-center rounded-full border border-line text-navy"
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                  <ul className="space-y-1">
                    {MAIN_NAV.map((item, i) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive(item.href) ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-semibold",
                            isActive(item.href) ? "bg-gold-50 text-navy" : "text-navy/80 hover:bg-paper",
                          )}
                        >
                          {item.label}
                          <span className="text-xs font-medium text-muted">{String(i + 1).padStart(2, "0")}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-2.5 border-t border-line p-5">
                  <Button asChild className="w-full" size="lg">
                    <Link href={cta.href}>
                      {cta.label} <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href={account?.href ?? "/login"}>{account?.label ?? "Log in"}</Link>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
