import { AnnouncementBar } from "@/components/site/announcement-bar";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getCurrentExam, getSetting, isRegistrationOpen } from "@/lib/exam";
import { currentUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { SITE } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [exam, user, announcement] = await Promise.all([
    getCurrentExam(),
    currentUser(),
    getSetting("announcement", { text: "NTHE 2026 | Offline Examination | 12 December 2026", enabled: true }),
  ]);
  const open = isRegistrationOpen(exam);
  const account = user
    ? isAdminRole(user.role)
      ? { href: "/admin", label: "Admin" }
      : { href: "/student/dashboard", label: "Dashboard" }
    : null;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE.name,
    alternateName: "GYAN",
    url: SITE.url,
    email: SITE.email,
    telephone: "+91-7348004848",
    address: {
      "@type": "PostalAddress",
      streetAddress: "5th Floor, AIPL Business Park, Sector 62",
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
  };

  return (
    <>
      {announcement.enabled && <AnnouncementBar text={announcement.text} registrationOpen={open} />}
      <Header registrationOpen={open} account={account} />
      <main id="main">{children}</main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    </>
  );
}
