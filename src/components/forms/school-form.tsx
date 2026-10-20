"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { schoolPartnershipSchema } from "@/lib/validation";
import { INDIAN_STATES } from "@/lib/site";
import { submitSchoolPartnership } from "@/server/actions/public";
import { applyServerErrors } from "./use-server-form";

type Values = z.input<typeof schoolPartnershipSchema>;

export function SchoolForm({ boards, requestVisit }: { boards: string[]; requestVisit: boolean }) {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schoolPartnershipSchema),
    defaultValues: { requestVisit, website: "", message: "", contactRole: "" } as Partial<Values>,
  });
  const { register, handleSubmit, formState, control } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await submitSchoolPartnership(values);
    if (res.ok) {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error);
      applyServerErrors(form, res.fieldErrors);
    }
  });

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center rounded-[var(--radius-2xl)] border border-line bg-white px-6 py-16 text-center shadow-card">
        <span className="grid size-16 place-items-center rounded-full bg-success-50 text-success">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-bold">Thank you for your interest.</h2>
        <p className="mt-3 max-w-md text-muted">
          We have received your school&apos;s details. A member of the GYAN team will contact you at the official email
          address provided.
        </p>
        <Button asChild variant="outline" className="mt-8"><Link href="/schools">Back to Schools</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8 rounded-[var(--radius-2xl)] border border-line bg-white p-6 shadow-card sm:p-9">
      {error && <Alert tone="danger">{error}</Alert>}
      <fieldset className="space-y-5">
        <legend className="font-display text-lg font-bold text-navy">School details</legend>
        <Field label="School name" htmlFor="schoolName" error={e.schoolName?.message} required>
          <Input id="schoolName" autoComplete="organization" aria-invalid={!!e.schoolName} {...register("schoolName")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Board" htmlFor="board" error={e.board?.message} required>
            <NativeSelect id="board" defaultValue="" aria-invalid={!!e.board} {...register("board")}>
              <option value="" disabled>Select board</option>
              {[...boards, "Other"].map((b) => <option key={b}>{b}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Classes offered" htmlFor="classesOffered" hint="e.g. Nursery – 12" error={e.classesOffered?.message} required>
            <Input id="classesOffered" aria-invalid={!!e.classesOffered} {...register("classesOffered")} />
          </Field>
        </div>
        <Field label="Address" htmlFor="address" error={e.address?.message} required>
          <Input id="address" autoComplete="street-address" aria-invalid={!!e.address} {...register("address")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" htmlFor="city" error={e.city?.message} required>
            <Input id="city" autoComplete="address-level2" aria-invalid={!!e.city} {...register("city")} />
          </Field>
          <Field label="State / UT" htmlFor="state" error={e.state?.message} required>
            <NativeSelect id="state" defaultValue="" aria-invalid={!!e.state} {...register("state")}>
              <option value="" disabled>Select state</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </NativeSelect>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="mb-5 font-display text-lg font-bold text-navy">Contact person</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Principal / coordinator name" htmlFor="contactName" error={e.contactName?.message} required>
            <Input id="contactName" autoComplete="name" aria-invalid={!!e.contactName} {...register("contactName")} />
          </Field>
          <Field label="Designation (optional)" htmlFor="contactRole" error={e.contactRole?.message}>
            <Input id="contactRole" autoComplete="organization-title" {...register("contactRole")} />
          </Field>
          <Field label="Official email" htmlFor="officialEmail" error={e.officialEmail?.message} required>
            <Input id="officialEmail" type="email" autoComplete="email" aria-invalid={!!e.officialEmail} {...register("officialEmail")} />
          </Field>
          <Field label="Contact number" htmlFor="contactNumber" error={e.contactNumber?.message} required>
            <Input id="contactNumber" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!e.contactNumber} {...register("contactNumber")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="mb-5 font-display text-lg font-bold text-navy">Participation</legend>
        <Field label="Estimated number of interested students" htmlFor="estimatedStudents" error={e.estimatedStudents?.message} required className="sm:max-w-xs">
          <Input id="estimatedStudents" type="number" inputMode="numeric" min={1} aria-invalid={!!e.estimatedStudents} {...register("estimatedStudents")} />
        </Field>
        <Field label="Message (optional)" htmlFor="message" error={e.message?.message}>
          <Textarea id="message" rows={4} placeholder="Tell us about your school and how you'd like to participate." {...register("message")} />
        </Field>
        <Controller
          control={control}
          name="requestVisit"
          render={({ field }) => (
            <label className="flex gap-3 text-sm text-ink/85">
              <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              <span><strong className="font-semibold text-navy">Request a school visit</strong> — a GYAN representative will contact you to arrange a visit or information session.</span>
            </label>
          )}
        />
      </fieldset>

      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="border-t border-line pt-6">
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <div>
              <label className="flex gap-3 text-sm leading-relaxed text-ink/80">
                <Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={!!e.consent} />
                <span>I confirm I am authorised to share these details on behalf of the school and agree to GYAN contacting me about partnership, as described in the <a href="/privacy-policy" className="font-medium text-royal underline">Privacy Policy</a>.</span>
              </label>
              {e.consent && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">{e.consent.message}</p>}
            </div>
          )}
        />
        <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {formState.isSubmitting ? "Submitting…" : "Submit partnership enquiry"}
        </Button>
      </div>
    </form>
  );
}
