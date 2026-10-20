import { Download, FileBadge, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { requireGuardian } from "@/lib/session";
import { guardianRegistrations } from "@/server/student";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admit Card" };

export default async function AdmitCardPage() {
  const { guardian } = await requireGuardian("/student/admit-card");
  const regs = (await guardianRegistrations(guardian.id)).filter((r) => r.status === "CONFIRMED");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Admit cards</h2>
      {regs.length === 0 && <EmptyState text="Admit cards appear here for confirmed registrations." />}
      {regs.map((r) => {
        const card = r.admitCard;
        const ready = card?.status === "RELEASED" && r.examination.admitCardsReleased;
        return (
          <Card key={r.id}>
            <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-navy">{r.student.fullName}</p>
                <p className="text-sm text-muted">{r.registrationNumber} · {r.examination.shortName} · {formatDate(r.examination.examDate)}</p>
                {ready && card && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-ink/80"><MapPin className="mt-0.5 size-4 text-royal" aria-hidden />{card.centreName} — reporting time {card.reportingTime}</p>
                )}
              </div>
              {ready ? (
                <Button asChild><a href={`/api/student/admit-card/${r.id}`}><Download aria-hidden /> Download admit card (PDF)</a></Button>
              ) : (
                <p className="rounded-full bg-warning-50 px-4 py-2 text-sm font-medium text-warning">
                  {card?.status === "REVOKED" ? "Being reissued — please check back" : "Not yet released"}
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card><CardBody className="py-14 text-center"><FileBadge className="mx-auto size-10 text-muted" aria-hidden /><p className="mt-4 text-muted">{text}</p></CardBody></Card>
  );
}
