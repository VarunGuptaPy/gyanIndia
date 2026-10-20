"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionResult } from "@/server/actions/admin-helpers";

/**
 * Form bound to a server action returning { ok, message }. Shows a toast and refreshes.
 * Optional confirm text asks before submitting (for irreversible actions).
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  resetOnSuccess,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const ref = React.useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (fd) => {
        if (confirm && !window.confirm(confirm)) return;
        const res = await action(fd);
        if (res.ok) {
          toast.success(res.message);
          if (resetOnSuccess) ref.current?.reset();
          onSuccess?.();
          router.refresh();
        } else toast.error(res.message);
      }}
    >
      {children}
    </form>
  );
}

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
