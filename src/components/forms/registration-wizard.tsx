"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { AnimatedNumber } from "@/components/site/motion";
import { SubjectIcon } from "@/components/site/subject-icon";
import { consentSchema, guardianSchema, password as passwordSchema, studentSchema, subjectSelectionSchema } from "@/lib/validation";
import { formatPaise } from "@/lib/fees";
import { INDIAN_STATES } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CONSENT_SUMMARY } from "@/content/consent";
import { createRegistrationAction } from "@/server/actions/registration";
import { useRazorpayPayment, type PaymentOutcome } from "@/components/student/use-razorpay";
import { applyServerErrors } from "./use-server-form";

export type WizardSubject = { id: string; name: string; nameHi: string; icon: string; feePaise: number; short: string };

type Props = {
  subjects: WizardSubject[];
  registrationFeePaise: number;
  boards: string[];
  classMin: number;
  classMax: number;
  languages: ("ENGLISH" | "HINDI")[];
  guardian: { fullName: string; mobile: string; email: string; address: string | null } | null;
  preselected: string[];
  examName: string;
};

const schema = z.object({
  student: studentSchema,
  guardian: guardianSchema,
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  subjectIds: subjectSelectionSchema,
  consent: consentSchema,
  idempotencyKey: z.string().uuid(),
});
type Values = z.input<typeof schema>;

const STEPS = ["Student", "Guardian", "Subjects", "Review", "Payment", "Confirmed"] as const;

const STEP_FIELDS: FieldPath<Values>[][] = [
  ["student.fullName", "student.classGrade", "student.board", "student.schoolName", "student.city", "student.state", "student.examLanguage"],
  ["guardian.fullName", "guardian.mobile", "guardian.email", "guardian.address"],
  ["subjectIds"],
  ["consent.isGuardian", "consent.dataProcessing", "consent.terms"],
];

export function RegistrationWizard(props: Props) {
  const { subjects, registrationFeePaise, guardian } = props;
  const loggedIn = !!guardian;
  const router = useRouter();
  const reduce = useReducedMotion();
  const topRef = React.useRef<HTMLDivElement>(null);

  const [step, setStep] = React.useState(0);
  const [serverError, setServerError] = React.useState<{ message: string; code?: string } | null>(null);
  const [registrationId, setRegistrationId] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<PaymentOutcome | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const { pay, busy } = useRazorpayPayment();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      student: { fullName: "", board: "", schoolName: "", city: "", examLanguage: "ENGLISH" } as Values["student"],
      guardian: guardian
        ? { fullName: guardian.fullName, mobile: guardian.mobile, email: guardian.email, address: guardian.address ?? "" }
        : { fullName: "", mobile: "", email: "", address: "" },
      password: "",
      confirmPassword: "",
      subjectIds: props.preselected.filter((id) => subjects.some((s) => s.id === id)),
      consent: {} as Values["consent"],
      idempotencyKey: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined,
    },
  });
  const { register, control, formState, watch, trigger, getValues, setError } = form;
  const e = formState.errors;
  const selected = watch("subjectIds") ?? [];
  const chosen = subjects.filter((s) => selected.includes(s.id));
  const total = chosen.length ? registrationFeePaise + chosen.reduce((a, s) => a + s.feePaise, 0) : 0;

  React.useEffect(() => {
    if (!getValues("idempotencyKey")) form.setValue("idempotencyKey", crypto.randomUUID());
  }, [form, getValues]);

  const goTo = (n: number) => {
    setStep(n);
    setServerError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!ok) return;
    if (step === 1 && !loggedIn) {
      const pw = getValues("password") ?? "";
      const pwCheck = passwordSchema.safeParse(pw);
      if (!pwCheck.success) {
        setError("password", { message: pwCheck.error.issues[0].message }, { shouldFocus: true });
        return;
      }
      if (pw !== getValues("confirmPassword")) {
        setError("confirmPassword", { message: "Passwords do not match." }, { shouldFocus: true });
        return;
      }
    }
    goTo(step + 1);
  };

  const submitRegistration = async () => {
    const ok = await trigger(STEP_FIELDS[3], { shouldFocus: true });
    if (!ok) return;
    const valid = await trigger();
    if (!valid) {
      setServerError({ message: "Some details need attention. Please go back and check each step." });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    const values = schema.parse(getValues());
    const res = await createRegistrationAction({
      student: values.student,
      guardian: values.guardian,
      password: loggedIn ? undefined : values.password,
      subjectIds: values.subjectIds,
      consent: values.consent,
      idempotencyKey: values.idempotencyKey,
    });
    if (!res.ok) {
      setSubmitting(false);
      setServerError({ message: res.error, code: res.code });
      applyServerErrors(form, res.fieldErrors);
      const firstKey = Object.keys(res.fieldErrors ?? {})[0];
      if (firstKey) {
        const idx = STEP_FIELDS.findIndex((f) => f.some((k) => k === firstKey || firstKey.startsWith(k)));
        if (idx >= 0 && idx < 3) setStep(idx);
        if (firstKey === "password") setStep(1);
      }
      return;
    }
    if (res.newAccount) {
      const s = await signIn("credentials", { email: values.guardian.email, password: values.password, redirect: false });
      if (!s?.ok) {
        setSubmitting(false);
        setServerError({
          message: "Your registration was saved, but we couldn't sign you in automatically. Please log in to complete payment.",
          code: "LOGIN_REQUIRED",
        });
        return;
      }
    }
    setRegistrationId(res.registrationId);
    setSubmitting(false);
    goTo(4);
    router.refresh();
  };

  const startPayment = async () => {
    if (!registrationId) return;
    setOutcome(null);
    const result = await pay(registrationId);
    setOutcome(result);
    if (result.kind === "confirmed") goTo(5);
  };

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Progress step={step} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 rounded-[var(--radius-2xl)] border border-line bg-white shadow-card">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="p-6 sm:p-9"
            >
              {serverError && (
                <Alert tone="danger" className="mb-6" title={serverError.message}>
                  {serverError.code === "ACCOUNT_EXISTS" && (
                    <Link href="/login?callbackUrl=/register" className="font-semibold text-royal underline">Log in to continue</Link>
                  )}
                  {serverError.code === "DUPLICATE" && (
                    <Link href="/student/dashboard" className="font-semibold text-royal underline">Go to dashboard</Link>
                  )}
                  {serverError.code === "LOGIN_REQUIRED" && (
                    <Link href="/login?callbackUrl=/student/dashboard" className="font-semibold text-royal underline">Log in</Link>
                  )}
                </Alert>
              )}

              {step === 0 && (
                <StepShell title="Student details" lede="Enter the student's name exactly as it should appear on the admit card and certificate.">
                  <Field label="Student's full name" htmlFor="student.fullName" error={e.student?.fullName?.message} required>
                    <Input id="student.fullName" autoComplete="off" aria-invalid={!!e.student?.fullName} {...register("student.fullName")} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Class" htmlFor="student.classGrade" error={e.student?.classGrade?.message} required>
                      <NativeSelect id="student.classGrade" defaultValue="" aria-invalid={!!e.student?.classGrade} {...register("student.classGrade")}>
                        <option value="" disabled>Select class</option>
                        {Array.from({ length: props.classMax - props.classMin + 1 }, (_, i) => props.classMin + i).map((c) => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Education board" htmlFor="student.board" error={e.student?.board?.message} required>
                      <NativeSelect id="student.board" defaultValue="" aria-invalid={!!e.student?.board} {...register("student.board")}>
                        <option value="" disabled>Select board</option>
                        {[...props.boards, "Other"].map((b) => <option key={b}>{b}</option>)}
                      </NativeSelect>
                    </Field>
                  </div>
                  <Field label="School name" htmlFor="student.schoolName" error={e.student?.schoolName?.message} required>
                    <Input id="student.schoolName" aria-invalid={!!e.student?.schoolName} {...register("student.schoolName")} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="City" htmlFor="student.city" error={e.student?.city?.message} required>
                      <Input id="student.city" autoComplete="address-level2" aria-invalid={!!e.student?.city} {...register("student.city")} />
                    </Field>
                    <Field label="State / UT" htmlFor="student.state" error={e.student?.state?.message} required>
                      <NativeSelect id="student.state" defaultValue="" aria-invalid={!!e.student?.state} {...register("student.state")}>
                        <option value="" disabled>Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                      </NativeSelect>
                    </Field>
                  </div>
                  <fieldset>
                    <legend className="text-sm font-semibold text-navy">Examination language <span className="text-danger" aria-hidden>*</span></legend>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {props.languages.map((l) => (
                        <label key={l} className="relative flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-royal has-[:checked]:bg-royal-50">
                          <input type="radio" value={l} className="size-4 accent-[#174EA6]" {...register("student.examLanguage")} />
                          <span className="font-medium text-navy">{l === "ENGLISH" ? "English" : <span lang="hi">हिंदी (Hindi)</span>}</span>
                        </label>
                      ))}
                    </div>
                    {e.student?.examLanguage && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">{e.student.examLanguage.message}</p>}
                  </fieldset>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell
                  title="Parent / guardian details"
                  lede={loggedIn ? "You are registering from your guardian account. These details come from your profile." : "As the parent or guardian, you will create an account to manage this registration."}
                >
                  <Field label="Full name" htmlFor="guardian.fullName" error={e.guardian?.fullName?.message} required>
                    <Input id="guardian.fullName" autoComplete="name" readOnly={loggedIn} aria-invalid={!!e.guardian?.fullName} {...register("guardian.fullName")} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Mobile number" htmlFor="guardian.mobile" hint="10-digit Indian mobile number" error={e.guardian?.mobile?.message} required>
                      <Input id="guardian.mobile" type="tel" inputMode="tel" autoComplete="tel" readOnly={loggedIn} aria-invalid={!!e.guardian?.mobile} {...register("guardian.mobile")} />
                    </Field>
                    <Field label="Email address" htmlFor="guardian.email" hint={loggedIn ? undefined : "This will be your login."} error={e.guardian?.email?.message} required>
                      <Input id="guardian.email" type="email" autoComplete="email" readOnly={loggedIn} aria-invalid={!!e.guardian?.email} {...register("guardian.email")} />
                    </Field>
                  </div>
                  <Field label="Postal address (optional)" htmlFor="guardian.address" hint="Only needed if GYAN has to post documents to you." error={e.guardian?.address?.message}>
                    <Textarea id="guardian.address" rows={2} autoComplete="street-address" readOnly={loggedIn} {...register("guardian.address")} />
                  </Field>
                  {!loggedIn && (
                    <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
                      <Field label="Create a password" htmlFor="password" hint="At least 10 characters, with letters and numbers." error={e.password?.message} required>
                        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} {...register("password")} />
                      </Field>
                      <Field label="Confirm password" htmlFor="confirmPassword" error={e.confirmPassword?.message} required>
                        <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!e.confirmPassword} {...register("confirmPassword")} />
                      </Field>
                      <p className="text-sm text-muted sm:col-span-2">
                        Already have an account?{" "}
                        <Link href="/login?callbackUrl=/register" className="font-semibold text-royal">Log in</Link> to register another child.
                      </p>
                    </div>
                  )}
                </StepShell>
              )}

              {step === 2 && (
                <StepShell title="Select subjects" lede="Choose one or more subjects. Each subject is examined and ranked separately.">
                  <Controller
                    control={control}
                    name="subjectIds"
                    render={({ field }) => (
                      <fieldset>
                        <legend className="sr-only">Subjects</legend>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {subjects.map((s) => {
                            const on = field.value?.includes(s.id);
                            return (
                              <li key={s.id}>
                                <label className={cn("flex h-full cursor-pointer gap-3.5 rounded-xl border p-4 transition-all", on ? "border-royal bg-royal-50 shadow-[0_0_0_3px_rgb(23_78_166/0.1)]" : "border-line hover:border-navy/30")}>
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={!!on}
                                    onChange={() => {
                                      const cur = field.value ?? [];
                                      field.onChange(on ? cur.filter((x) => x !== s.id) : [...cur, s.id]);
                                    }}
                                  />
                                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", on ? "bg-royal text-white" : "bg-paper text-navy")}>
                                    <SubjectIcon icon={s.icon} className="size-5" />
                                  </span>
                                  <span className="flex-1">
                                    <span className="flex items-start justify-between gap-2">
                                      <span className="font-semibold text-navy">{s.name}</span>
                                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", on ? "border-royal bg-royal text-white" : "border-line-strong")} aria-hidden>
                                        {on && <Check className="size-3" strokeWidth={3} />}
                                      </span>
                                    </span>
                                    <span className="mt-1 block text-xs leading-relaxed text-muted">{s.short}</span>
                                    <span className="mt-2 block text-sm font-semibold text-navy">{formatPaise(s.feePaise)}</span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                        {e.subjectIds && <p role="alert" className="mt-3 text-sm font-medium text-danger">{e.subjectIds.message ?? e.subjectIds.root?.message}</p>}
                      </fieldset>
                    )}
                  />
                </StepShell>
              )}

              {step === 3 && (
                <StepShell title="Review and consent" lede="Please check every detail. The student's name will be printed on the admit card and certificate exactly as shown.">
                  <ReviewBlock
                    title="Student"
                    onEdit={() => goTo(0)}
                    rows={[
                      ["Name", getValues("student.fullName")],
                      ["Class", `Class ${getValues("student.classGrade")}`],
                      ["Board", getValues("student.board")],
                      ["School", getValues("student.schoolName")],
                      ["City / State", `${getValues("student.city")}, ${getValues("student.state")}`],
                      ["Exam language", getValues("student.examLanguage") === "HINDI" ? "Hindi" : "English"],
                    ]}
                  />
                  <ReviewBlock
                    title="Parent / guardian"
                    onEdit={() => goTo(1)}
                    rows={[
                      ["Name", getValues("guardian.fullName")],
                      ["Mobile", getValues("guardian.mobile")],
                      ["Email", getValues("guardian.email")],
                    ]}
                  />
                  <ReviewBlock
                    title="Subjects and fees"
                    onEdit={() => goTo(2)}
                    rows={[
                      ...chosen.map((s) => [s.name, formatPaise(s.feePaise)] as [string, string]),
                      ["Registration fee (one-time)", formatPaise(registrationFeePaise)],
                    ]}
                    footer={["Total payable", formatPaise(total)]}
                  />

                  <div className="rounded-xl border border-line bg-paper p-5">
                    <p className="flex items-center gap-2 font-semibold text-navy"><ShieldCheck className="size-5 text-success" aria-hidden /> Guardian consent</p>
                    <div className="mt-4 space-y-4">
                      {(
                        [
                          ["consent.isGuardian", CONSENT_SUMMARY[0]],
                          ["consent.dataProcessing", <>{CONSENT_SUMMARY[1]} {CONSENT_SUMMARY[2]} <Link href="/child-data-protection" target="_blank" className="font-medium text-royal underline">Read the full consent text</Link>.</>],
                          ["consent.terms", <>I have read and accept the <Link href="/terms-and-conditions" target="_blank" className="font-medium text-royal underline">Terms</Link>, <Link href="/privacy-policy" target="_blank" className="font-medium text-royal underline">Privacy Policy</Link> and <Link href="/refund-policy" target="_blank" className="font-medium text-royal underline">Refund Policy</Link>.</>],
                        ] as const
                      ).map(([name, label]) => {
                        const err = name === "consent.isGuardian" ? e.consent?.isGuardian : name === "consent.dataProcessing" ? e.consent?.dataProcessing : e.consent?.terms;
                        return (
                          <Controller
                            key={name}
                            control={control}
                            name={name}
                            render={({ field }) => (
                              <div>
                                <label className="flex gap-3 text-sm leading-relaxed text-ink/85">
                                  <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={!!err} ref={field.ref} />
                                  <span>{label}</span>
                                </label>
                                {err && <p role="alert" className="mt-1 pl-8 text-[0.8rem] font-medium text-danger">{err.message}</p>}
                              </div>
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell title="Payment" lede="Your registration has been saved. Complete the payment to confirm it.">
                  <div className="rounded-xl border border-line bg-paper p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Amount payable</span>
                      <span className="font-display text-3xl font-extrabold text-navy tabular-nums">{formatPaise(total)}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      {chosen.length} subject{chosen.length > 1 ? "s" : ""} + one-time registration fee. No additional taxes or
                      gateway charges are added by GYAN; your bank may apply its own charges.
                    </p>
                  </div>
                  {outcome?.kind === "setup_required" && (
                    <Alert tone="warning" title="Online payment is not available yet">
                      {outcome.message} Your registration is saved as <strong>payment pending</strong>. You can complete the
                      payment from your dashboard once payments are enabled — we will not ask you to fill the form again.
                    </Alert>
                  )}
                  {outcome?.kind === "pending" && <Alert tone="info" title="Payment processing">{outcome.message}</Alert>}
                  {outcome?.kind === "error" && <Alert tone="danger" title="Payment not completed">{outcome.message}</Alert>}
                  {outcome?.kind === "dismissed" && <Alert tone="info">Payment window closed. You can try again whenever you are ready.</Alert>}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" onClick={startPayment} disabled={busy || outcome?.kind === "setup_required"}>
                      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
                      {busy ? "Opening secure payment…" : `Pay ${formatPaise(total)} securely`}
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/student/dashboard">Go to dashboard</Link>
                    </Button>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted"><CreditCard className="size-4" aria-hidden /> Payments are processed by Razorpay. GYAN never sees your card or UPI details.</p>
                </StepShell>
              )}

              {step === 5 && outcome?.kind === "confirmed" && (
                <div className="py-6 text-center" role="status">
                  <motion.span
                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto grid size-20 place-items-center rounded-full bg-success-50 text-success"
                  >
                    <PartyPopper className="size-9" aria-hidden />
                  </motion.span>
                  <h2 className="mt-6 text-3xl font-bold">Registration confirmed!</h2>
                  <p className="mx-auto mt-3 max-w-md text-muted">
                    Payment verified. {getValues("student.fullName")} is registered for {props.examName}.
                  </p>
                  {outcome.registrationNumber && (
                    <div className="mx-auto mt-8 max-w-sm rounded-xl border border-dashed border-gold bg-gold-50 px-6 py-5">
                      <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">Registration number</p>
                      <p className="mt-1 font-mono text-2xl font-bold text-navy">{outcome.registrationNumber}</p>
                    </div>
                  )}
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild size="lg"><Link href="/student/dashboard">Go to my dashboard <ArrowRight aria-hidden /></Link></Button>
                    <Button variant="outline" size="lg" onClick={() => window.location.assign("/register")}>Register another child</Button>
                  </div>
                </div>
              )}

              {step < 4 && (
                <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-6">
                  <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0 || submitting} className={step === 0 ? "invisible" : ""}>
                    <ArrowLeft aria-hidden /> Back
                  </Button>
                  {step < 3 ? (
                    <Button onClick={next}>Continue <ArrowRight aria-hidden /></Button>
                  ) : (
                    <Button onClick={submitRegistration} disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}
                      {submitting ? "Saving…" : "Confirm and continue to payment"}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 5 && (
          <aside className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-navy text-white shadow-lift">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Fee summary</p>
              </div>
              <div className="space-y-3 px-6 py-5 text-sm">
                {chosen.length === 0 ? (
                  <p className="text-white/60">No subjects selected yet.</p>
                ) : (
                  chosen.map((s) => (
                    <div key={s.id} className="flex justify-between gap-4"><span className="text-white/75">{s.name}</span><span className="tabular-nums">{formatPaise(s.feePaise)}</span></div>
                  ))
                )}
                <div className="flex justify-between gap-4 border-t border-dashed border-white/15 pt-3">
                  <span className="text-white/75">Registration fee</span>
                  <span className="tabular-nums">{chosen.length ? formatPaise(registrationFeePaise) : "—"}</span>
                </div>
              </div>
              <div className="bg-white/[0.06] px-6 py-5">
                <p className="text-sm text-white/60">Total</p>
                <p className="font-display text-4xl font-extrabold tabular-nums" aria-live="polite">
                  <AnimatedNumber value={total} format={formatPaise} />
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Amounts are recalculated and verified on our server before payment.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <nav aria-label="Registration progress">
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={label} className="flex flex-1 flex-col gap-2" aria-current={state === "current" ? "step" : undefined}>
              <span className={cn("h-1.5 rounded-full transition-colors duration-500", state === "todo" ? "bg-line" : state === "current" ? "bg-gold" : "bg-royal")} />
              <span className={cn("hidden text-xs font-semibold sm:block", state === "todo" ? "text-muted" : "text-navy")}>
                <span className="mr-1 tabular-nums">{i + 1}.</span>{label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-navy sm:hidden">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>
    </nav>
  );
}

function StepShell({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      {lede && <p className="mt-2 text-muted">{lede}</p>}
      <div className="mt-7 space-y-5">{children}</div>
    </div>
  );
}

function ReviewBlock({ title, rows, footer, onEdit }: { title: string; rows: [string, React.ReactNode][]; footer?: [string, string]; onEdit: () => void }) {
  return (
    <section className="rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h3 className="font-bold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-royal hover:underline">Edit</button>
      </div>
      <dl className="divide-y divide-line px-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 py-2.5">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-medium break-words text-navy">{v}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div className="flex justify-between gap-6 rounded-b-xl bg-gold-50 px-5 py-3">
          <span className="font-semibold text-navy">{footer[0]}</span>
          <span className="font-display text-lg font-extrabold text-navy tabular-nums">{footer[1]}</span>
        </div>
      )}
    </section>
  );
}
