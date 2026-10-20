import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AnnouncementBar({ text, registrationOpen }: { text: string; registrationOpen: boolean }) {
  return (
    <div className="relative z-50 bg-navy-950 text-white">
      <div className="container-page flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center text-[0.8rem] sm:text-sm">
        <p className="font-medium tracking-wide">
          <span className="mr-2 inline-block size-1.5 -translate-y-px rounded-full bg-gold align-middle" aria-hidden />
          {text}
        </p>
        <Link
          href={registrationOpen ? "/register" : "/nthe-2026"}
          className="inline-flex items-center gap-1 font-semibold text-gold underline-offset-4 hover:underline"
        >
          {registrationOpen ? "Registrations open — Register" : "Registration opening soon"}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
