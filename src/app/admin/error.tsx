"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="py-24">
      <div className="container-page max-w-xl text-center">
        <AlertTriangle className="mx-auto size-12 text-warning" aria-hidden />
        <h1 className="mt-6 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-muted">We couldn&apos;t load this page. Please try again — if the problem continues, contact admin@gyanindia.com.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}><RotateCcw aria-hidden /> Try again</Button>
          <Button asChild variant="outline"><Link href="/">Homepage</Link></Button>
        </div>
      </div>
    </section>
  );
}
