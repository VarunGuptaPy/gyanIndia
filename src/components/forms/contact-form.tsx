"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { enquirySchema } from "@/lib/validation";
import { ENQUIRY_CATEGORIES } from "@/lib/site";
import { submitEnquiry } from "@/server/actions/public";
import { applyServerErrors } from "./use-server-form";

type Values = z.input<typeof enquirySchema>;

export function ContactForm() {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: "", email: "", phone: "", message: "", website: "" } as Partial<Values>,
  });
  const { register, handleSubmit, formState, control } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await submitEnquiry(values);
    if (res.ok) setDone(true);
    else {
      setError(res.error);
      applyServerErrors(form, res.fieldErrors);
    }
  });

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-2xl)] border border-line bg-white px-6 py-16 text-center shadow-card" role="status">
        <span className="grid size-16 place-items-center rounded-full bg-success-50 text-success">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-bold">Thank you — message received.</h2>
        <p className="mt-3 max-w-md text-muted">Our team will get back to you at the email address you provided.</p>
        <Button variant="outline" className="mt-8" onClick={() => { form.reset(); setDone(false); }}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-[var(--radius-2xl)] border border-line bg-white p-6 shadow-card sm:p-8">
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={e.name?.message} required>
          <Input id="name" autoComplete="name" aria-invalid={!!e.name} {...register("name")} />
        </Field>
        <Field label="Email address" htmlFor="email" error={e.email?.message} required>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!e.email} {...register("email")} />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone" error={e.phone?.message}>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!e.phone} {...register("phone")} />
        </Field>
        <Field label="Enquiry category" htmlFor="category" error={e.category?.message} required>
          <NativeSelect id="category" aria-invalid={!!e.category} defaultValue="" {...register("category")}>
            <option value="" disabled>Select a category</option>
            {ENQUIRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Message" htmlFor="message" error={e.message?.message} required>
        <Textarea id="message" rows={5} aria-invalid={!!e.message} {...register("message")} />
      </Field>
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <Controller
        control={control}
        name="consent"
        render={({ field }) => (
          <div>
            <label className="flex gap-3 text-sm leading-relaxed text-ink/80">
              <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={!!e.consent} />
              <span>
                I consent to GYAN storing these details to respond to my enquiry, as described in the{" "}
                <a href="/privacy-policy" className="font-medium text-royal underline">Privacy Policy</a>.
              </span>
            </label>
            {e.consent && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">{e.consent.message}</p>}
          </div>
        )}
      />
      <Button type="submit" size="lg" disabled={formState.isSubmitting} className="w-full sm:w-auto">
        {formState.isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {formState.isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
