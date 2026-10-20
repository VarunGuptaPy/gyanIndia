import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-page max-w-xl text-center">
        <Compass className="mx-auto size-12 text-gold-600" aria-hidden />
        <p className="mt-6 font-display text-6xl font-extrabold text-navy">404</p>
        <h1 className="mt-3 text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-muted">The page may have moved, or the link may be incorrect.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/">Go to homepage</Link></Button>
          <Button asChild variant="outline"><Link href="/nthe-2026">NTHE 2026 details</Link></Button>
        </div>
      </div>
    </section>
  );
}
