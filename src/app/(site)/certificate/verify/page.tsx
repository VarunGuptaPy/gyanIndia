import { BadgeCheck, Search, ShieldAlert, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero, Section } from "@/components/site/section";
import { verifyCertificate } from "@/server/verification";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Verify a Certificate",
  description: "Verify the authenticity of a GYAN certificate using its unique certificate number.",
  path: "/certificate/verify",
});

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  let result: Awaited<ReturnType<typeof verifyCertificate>> | "rate_limited" | null = null;
  if (id) {
    const allowed = await rateLimit(`verify:${hashIp(await clientIp())}`, 30, 60);
    result = allowed ? await verifyCertificate(id) : "rate_limited";
  }

  return (
    <>
      <PageHero
        eyebrow="Verification"
        title="Verify a GYAN certificate"
        lede="Enter the certificate number printed on the certificate, or scan its QR code. To protect students' privacy, only initials are shown."
        crumbs={[{ label: "Verify a Certificate" }]}
      />
      <Section>
        <div className="container-page max-w-2xl">
          <form method="get" className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-line bg-white p-5 shadow-card sm:flex-row sm:p-6" role="search">
            <label htmlFor="id" className="sr-only">Certificate number</label>
            <Input id="id" name="id" defaultValue={id ?? ""} placeholder="e.g. GYAN-C26-ABCD2345" className="h-12 font-mono uppercase" autoComplete="off" required />
            <Button type="submit" size="lg" className="h-12"><Search aria-hidden /> Verify</Button>
          </form>

          <div className="mt-8" aria-live="polite">
            {result === "rate_limited" && (
              <ResultCard tone="warning" icon={ShieldAlert} title="Too many attempts">Please wait a minute and try again.</ResultCard>
            )}
            {result && result !== "rate_limited" && result.status === "invalid_format" && (
              <ResultCard tone="warning" icon={ShieldAlert} title="That doesn't look like a certificate number">
                Certificate numbers look like <span className="font-mono">GYAN-C26-ABCD2345</span>. Please check and try again.
              </ResultCard>
            )}
            {result && result !== "rate_limited" && result.status === "not_found" && (
              <ResultCard tone="danger" icon={ShieldX} title="No certificate found">
                We could not find a certificate with this number. If you believe this is an error, contact admin@gyanindia.com.
              </ResultCard>
            )}
            {result && result !== "rate_limited" && (result.status === "valid" || result.status === "revoked") && (
              <ResultCard
                tone={result.status === "valid" ? "success" : "danger"}
                icon={result.status === "valid" ? BadgeCheck : ShieldX}
                title={result.status === "valid" ? "Valid certificate" : "This certificate has been revoked"}
              >
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ["Certificate number", result.certificateNumber],
                    ["Awarded to", result.studentInitials],
                    ["Achievement", result.achievement],
                    ["Subject", result.subjectName ?? "—"],
                    ...(result.rank ? [["Rank", String(result.rank)]] : []),
                    ["Examination", `${result.examName}`],
                    ["Issued on", formatDate(result.issuedAt)],
                    ...(result.revokedAt ? [["Revoked on", formatDate(result.revokedAt)]] : []),
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-semibold text-navy">{v}</dd>
                    </div>
                  ))}
                </dl>
              </ResultCard>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

function ResultCard({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "success" | "danger" | "warning";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-success/30 bg-success-50 text-success",
    danger: "border-danger/30 bg-danger-50 text-danger",
    warning: "border-warning/30 bg-warning-50 text-warning",
  }[tone];
  return (
    <div className={`rounded-[var(--radius-xl)] border p-6 ${styles}`}>
      <div className="flex items-center gap-3">
        <Icon className="size-7" />
        <h2 className="text-xl font-bold text-navy">{title}</h2>
      </div>
      <div className="mt-2 text-ink/80">{children}</div>
    </div>
  );
}
