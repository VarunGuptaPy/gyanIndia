import "server-only";
import Razorpay from "razorpay";

export type RazorpayConfigState =
  | { ok: true; keyId: string; mode: "test" | "live" }
  | { ok: false; reason: string };

/**
 * Live keys are refused unless PAYMENTS_LIVE_APPROVED=true, which should only be set
 * after merchant onboarding, legal policies and pricing have been formally approved.
 */
export function razorpayConfig(): RazorpayConfigState {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) {
    return { ok: false, reason: "Online payments have not been configured yet." };
  }
  const mode = keyId.startsWith("rzp_live_") ? "live" : "test";
  if (mode === "live" && process.env.PAYMENTS_LIVE_APPROVED !== "true") {
    return { ok: false, reason: "Live payments are awaiting approval." };
  }
  return { ok: true, keyId, mode };
}

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  const cfg = razorpayConfig();
  if (!cfg.ok) throw new Error(cfg.reason);
  client ??= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  return client;
}
