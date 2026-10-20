import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SUBJECT_CONTENT } from "@/content/subjects";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "/about", "/nthe-2026", "/subjects", "/syllabus", "/awards", "/how-to-register", "/schools", "/schools/register",
    "/register", "/results", "/certificate/verify", "/faq", "/contact", "/hi", "/privacy-policy", "/terms-and-conditions",
    "/refund-policy", "/child-data-protection",
    ...SUBJECT_CONTENT.map((s) => `/subjects/${s.slug}`),
  ];
  return paths.map((p) => ({
    url: `${SITE.url}${p}`,
    changeFrequency: p === "" || p === "/nthe-2026" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/nthe-2026" || p === "/register" ? 0.9 : 0.6,
  }));
}
