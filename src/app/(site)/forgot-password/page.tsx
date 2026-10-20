import { ForgotPasswordForm } from "@/components/forms/password-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Forgot password", description: "Reset your GYAN account password.", path: "/forgot-password", noIndex: true });

export default function ForgotPasswordPage() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page max-w-md">
        <div className="rounded-[var(--radius-2xl)] border border-line bg-white p-7 shadow-lift sm:p-9">
          <h1 className="text-3xl font-bold">Forgot your password?</h1>
          <p className="mt-2 text-muted">Enter your account email and we&apos;ll send you a link to reset it.</p>
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
