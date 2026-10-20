"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) return setError("Enter your email and password.");
    setPending(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res?.ok) {
      setPending(false);
      setError("Incorrect email or password, or too many attempts. Please try again in a few minutes.");
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    router.replace(callbackUrl ?? (role && role !== "GUARDIAN" ? "/admin" : "/student/dashboard"));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email address" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-royal hover:underline">Forgot password?</Link>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
