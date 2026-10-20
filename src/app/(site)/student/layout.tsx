import { requireGuardian } from "@/lib/session";
import { StudentNav } from "@/components/student/student-nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { guardian } = await requireGuardian();
  return (
    <div className="min-h-[70vh] bg-paper">
      <div className="border-b border-line bg-gold-50/60">
        <div className="container-page py-8">
          <p className="text-sm text-muted">Guardian account</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome, {guardian.fullName.split(" ")[0]}</h1>
          <div className="mt-6"><StudentNav /></div>
        </div>
      </div>
      <div className="container-page py-10">{children}</div>
    </div>
  );
}
