"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/** Applies server-side field errors to a react-hook-form instance. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, errors?: Record<string, string>) {
  if (!errors) return;
  let first = true;
  for (const [key, message] of Object.entries(errors)) {
    form.setError(key as Path<T>, { type: "server", message }, { shouldFocus: first });
    first = false;
  }
}
