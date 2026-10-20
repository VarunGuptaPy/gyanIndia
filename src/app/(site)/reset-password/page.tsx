import { ResetPasswordForm } from "@/components/forms/password-forms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Reset password", description: "Choose a new password.", path: "/reset-password", noIndex: true });

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page max-w-md">
        <div className="rounded-[var(--radius-2xl)] border border-line bg-white p-7 shadow-lift sm:p-9">
          <h1 className="text-3xl font-bold">Choose a new password</h1>
          {token ? <ResetPasswordForm token={token} /> : <p className="mt-4 text-danger">This reset link is invalid. Please request a new one.</p>}
        </div>
      </div>
    </section>
  );
}
