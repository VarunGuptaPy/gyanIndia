import { Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { requireGuardian } from "@/lib/session";
import { guardianRegistrations } from "@/server/student";
import { formatDate, humanize } from "@/lib/format";

export const metadata = { title: "Certificates" };

export default async function StudentCertificatesPage() {
  const { guardian } = await requireGuardian("/student/certificates");
  const regs = await guardianRegistrations(guardian.id);
  const certs = regs.flatMap((r) => r.certificates.map((c) => ({ ...c, student: r.student.fullName })));
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Certificates</h2>
      {certs.length === 0 && (
        <Card><CardBody className="py-14 text-center"><ScrollText className="mx-auto size-10 text-muted" aria-hidden /><p className="mt-4 text-muted">Certificates will appear here after results are published and certificates are issued.</p></CardBody></Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {certs.map((c) => (
          <Card key={c.id} className="relative overflow-hidden">
            <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gold" />
            <CardBody>
              <p className="text-xs font-semibold tracking-wider text-gold-700 uppercase">{humanize(c.type)}</p>
              <p className="mt-1 text-lg font-bold text-navy">{c.subjectName ?? c.examName}{c.rank ? ` — Rank ${c.rank}` : ""}</p>
              <p className="text-sm text-muted">{c.student} · Issued {formatDate(c.issuedAt)}</p>
              <p className="mt-2 font-mono text-xs text-muted">{c.certificateNumber}</p>
              <Button asChild size="sm" className="mt-4"><a href={`/api/certificates/${c.id}`}><Download aria-hidden /> Download PDF</a></Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
