import { BadgeCheck, ShieldX } from "lucide-react";
import { PageHero, Section } from "@/components/site/section";
import { verifyAdmitCard } from "@/server/verification";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Verify an Admit Card", description: "Verify a GYAN admit card.", path: "/verify/admit-card", noIndex: true });

export default async function VerifyAdmitCardPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const allowed = code ? await rateLimit(`verify-ac:${hashIp(await clientIp())}`, 30, 60) : true;
  const result = code && allowed ? await verifyAdmitCard(code) : null;
  return (
    <>
      <PageHero eyebrow="Verification" title="Admit card verification" crumbs={[{ label: "Admit card verification" }]} />
      <Section>
        <div className="container-page max-w-2xl">
          {!code && <p className="text-muted">Scan the QR code printed on a GYAN admit card to verify it.</p>}
          {code && !allowed && <p className="text-warning">Too many attempts. Please wait a minute.</p>}
          {result && result.status === "valid" ? (
            <div className="rounded-[var(--radius-xl)] border border-success/30 bg-success-50 p-6">
              <p className="flex items-center gap-3 text-xl font-bold text-navy"><BadgeCheck className="size-7 text-success" /> Valid admit card</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Admit card number</dt><dd className="font-semibold">{result.admitCardNumber}</dd></div>
                <div><dt className="text-muted">Candidate</dt><dd className="font-semibold">{result.studentInitials}</dd></div>
                <div><dt className="text-muted">Examination</dt><dd className="font-semibold">{result.examName}</dd></div>
                <div><dt className="text-muted">Centre</dt><dd className="font-semibold">{result.centreName}</dd></div>
              </dl>
            </div>
          ) : result ? (
            <div className="rounded-[var(--radius-xl)] border border-danger/30 bg-danger-50 p-6">
              <p className="flex items-center gap-3 text-xl font-bold text-navy"><ShieldX className="size-7 text-danger" /> {result.status === "revoked" ? "This admit card has been revoked" : "Admit card not found"}</p>
            </div>
          ) : null}
        </div>
      </Section>
    </>
  );
}
