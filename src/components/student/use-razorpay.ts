"use client";

import * as React from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const s = existing ?? document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    if (!existing) document.body.appendChild(s);
  });
}

export type PaymentOutcome =
  | { kind: "confirmed"; registrationNumber: string | null }
  | { kind: "pending"; message: string }
  | { kind: "setup_required"; message: string }
  | { kind: "dismissed" }
  | { kind: "error"; message: string };

/**
 * Opens Razorpay Checkout for a registration. The server creates the order and
 * computes the amount; success is only reported after server-side verification.
 */
export function useRazorpayPayment() {
  const [busy, setBusy] = React.useState(false);

  const pay = React.useCallback(async (registrationId: string): Promise<PaymentOutcome> => {
    setBusy(true);
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 || data.setupRequired) {
        return { kind: "setup_required", message: data.error ?? "Online payments are not available yet." };
      }
      if (!res.ok) return { kind: "error", message: data.error ?? "Could not start payment." };

      if (!(await loadScript()) || !window.Razorpay) {
        return { kind: "error", message: "Could not load the payment window. Check your connection and try again." };
      }

      return await new Promise<PaymentOutcome>((resolve) => {
        const rzp = new window.Razorpay!({
          key: data.keyId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          name: data.name,
          description: data.description,
          prefill: data.prefill,
          theme: { color: "#0B1F3A" },
          modal: { ondismiss: () => resolve({ kind: "dismissed" }), confirm_close: true },
          handler: async (response: Record<string, string>) => {
            try {
              const v = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const vd = await v.json().catch(() => ({}));
              if (v.ok && vd.status === "confirmed") resolve({ kind: "confirmed", registrationNumber: vd.registrationNumber ?? null });
              else if (v.status === 202) resolve({ kind: "pending", message: vd.message });
              else resolve({ kind: "error", message: vd.error ?? "Payment verification failed." });
            } catch {
              resolve({ kind: "pending", message: "We are confirming your payment. Please check your dashboard shortly." });
            }
          },
        });
        rzp.on("payment.failed", () => {
          /* Checkout lets the user retry inside the modal; the webhook records the failure. */
        });
        rzp.open();
      });
    } finally {
      setBusy(false);
    }
  }, []);

  return { pay, busy };
}
