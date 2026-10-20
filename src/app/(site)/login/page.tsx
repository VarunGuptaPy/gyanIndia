import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { LogoMark } from "@/components/site/logo";
import { currentUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Log in", description: "Log in to your GYAN guardian or administrator account.", path: "/login", noIndex: true });

function safeCallback(url?: string) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : undefined;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const { callbackUrl, reset } = await searchParams;
  const user = await currentUser();
  if (user) redirect(safeCallback(callbackUrl) ?? (isAdminRole(user.role) ? "/admin" : "/student/dashboard"));
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div aria-hidden className="grid-texture-light pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative container-page max-w-md">
        <div className="rounded-[var(--radius-2xl)] border border-line bg-white p-7 shadow-lift sm:p-9">
          <LogoMark className="h-20" />
          <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-muted">Log in to manage registrations, admit cards and results.</p>
          {reset === "1" && <p role="status" className="mt-5 rounded-lg bg-success-50 px-4 py-3 text-sm text-success">Your password has been reset. Please log in.</p>}
          <LoginForm callbackUrl={safeCallback(callbackUrl)} />
          <p className="mt-6 text-center text-sm text-muted">
            New to GYAN? <Link href="/register" className="font-semibold text-royal">Register a student</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
