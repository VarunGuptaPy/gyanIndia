"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelRegistrationAction } from "@/server/actions/registration";
import { useRazorpayPayment } from "./use-razorpay";

export function PayNowButton({ registrationId, amountLabel }: { registrationId: string; amountLabel: string }) {
  const router = useRouter();
  const { pay, busy } = useRazorpayPayment();
  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={async () => {
        const r = await pay(registrationId);
        if (r.kind === "confirmed") {
          toast.success(`Payment verified. Registration number ${r.registrationNumber ?? ""}`);
          router.refresh();
        } else if (r.kind === "setup_required") toast.warning(r.message);
        else if (r.kind === "pending") toast.info(r.message);
        else if (r.kind === "error") toast.error(r.message);
      }}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />} Pay {amountLabel}
    </Button>
  );
}

export function CancelPendingButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        <X aria-hidden /> Cancel registration
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-danger-50 py-1 pr-1 pl-3 text-sm text-danger">
      Cancel this unpaid registration?
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await cancelRegistrationAction(registrationId);
            if (r.ok) toast.success("Registration cancelled.");
            else toast.error(r.error);
            setConfirming(false);
            router.refresh();
          })
        }
      >
        Yes, cancel
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>No</Button>
    </span>
  );
}
