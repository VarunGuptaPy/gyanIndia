import type { Metadata } from "next";
import { SITE } from "./site";

export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | GYAN`,
      description,
      url,
      siteName: SITE.name,
      locale: "en_IN",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${title} | GYAN`, description },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
