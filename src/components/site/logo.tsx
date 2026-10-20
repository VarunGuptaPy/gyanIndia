import Image from "next/image";
import { cn } from "@/lib/utils";

/** The GYAN emblem (graduation cap, laurels and open book). Source: public/brand/gyan-emblem.png */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/gyan-emblem.png"
      alt=""
      width={900}
      height={858}
      className={cn("h-12 w-auto", className)}
    />
  );
}

/**
 * The "Gyan India" wordmark used in navigation. Source: public/brand/gyan-india-logo.png
 * On dark backgrounds (tone="light") it sits on a white chip, since the artwork uses navy text.
 */
export function Logo({
  className,
  tone = "dark",
  priority = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center", tone === "light" && "rounded-xl bg-white px-3 py-2", className)}>
      <Image
        src="/brand/gyan-india-logo.png"
        alt="Gyan India"
        width={900}
        height={249}
        priority={priority}
        className={cn("w-auto", tone === "light" ? "h-8" : "h-10 sm:h-11 lg:h-12")}
      />
    </span>
  );
}
