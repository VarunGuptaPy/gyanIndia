"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { requestPasswordReset, resetPassword } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [state, setState] = React.useState<{ done?: boolean; error?: string; emailEnabled?: boolean }>({});
  const [pending, setPending] = React.useState(false);
  return (
    <form
      className="mt-7 space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const res = await requestPasswordReset({ email: new FormData(e.currentTarget).get("email") });
        setPending(false);
        setState(res.ok ? { done: true, emailEnabled: res.emailEnabled } : { error: res.error });
      }}
    >
      {state.done ? (
        <Alert tone={state.emailEnabled ? "success" : "warning"}>
          {state.emailEnabled
            ? "If an account exists for that email, a reset link is on its way. The link is valid for 30 minutes."
            : "Email delivery is not configured yet, so we cannot send reset links. Please contact admin@gyanindia.com for help."}
        </Alert>
      ) : (
        <>
          {state.error && <Alert tone="danger">{state.error}</Alert>}
          <Field label="Email address" htmlFor="email" required>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />} Send reset link
          </Button>
        </>
      )}
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  return (
    <form
      className="mt-7 space-y-5"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setPending(true);
        const res = await resetPassword({ token, password: fd.get("password"), confirmPassword: fd.get("confirmPassword") });
        setPending(false);
        if (res.ok) router.push("/login?reset=1");
        else {
          setError(res.error);
          setErrors(res.fieldErrors ?? {});
        }
      }}
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="New password" htmlFor="password" hint="At least 10 characters, with letters and numbers." error={errors.password} required>
        <Input id="password" name="password" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Reset password
      </Button>
    </form>
  );
}
