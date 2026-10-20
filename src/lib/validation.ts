import { z } from "zod";
import { ENQUIRY_CATEGORIES, INDIAN_STATES } from "./site";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const personName = (label: string) =>
  trimmed(2, 80, label).regex(/^[\p{L}\p{M} .'-]+$/u, `${label} may contain letters, spaces, . ' and - only.`);

/** Indian mobile: optional +91 / 0 prefix, then 10 digits starting 6–9. Normalised to +91XXXXXXXXXX. */
export const indianMobile = z
  .string({ required_error: "Mobile number is required." })
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number.")
  .transform((v) => `+91${v.slice(-10)}`);

export const email = z
  .string({ required_error: "Email address is required." })
  .trim()
  .toLowerCase()
  .max(254)
  .email("Enter a valid email address.");

export const password = z
  .string({ required_error: "Password is required." })
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be at most 128 characters.")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password must include letters and numbers.");

export const stateSchema = z.enum(INDIAN_STATES, {
  errorMap: () => ({ message: "Select a state or union territory." }),
});

// ── Registration ─────────────────────────────────────────────

// Printed on admit cards and certificates, so must be in English (Latin) script.
export const studentName = trimmed(2, 80, "Student's full name").regex(
  /^[A-Za-z][A-Za-z .'-]*$/,
  "Enter the name in English letters, as on school records.",
);

export const studentSchema = z.object({
  fullName: studentName,
  classGrade: z.coerce
    .number({ invalid_type_error: "Select a class." })
    .int()
    .min(1, "Select a class.")
    .max(12, "Select a class."),
  board: trimmed(2, 60, "Board"),
  schoolName: trimmed(3, 150, "School name"),
  city: trimmed(2, 80, "City"),
  state: stateSchema,
  examLanguage: z.enum(["ENGLISH", "HINDI"], {
    errorMap: () => ({ message: "Select the examination language." }),
  }),
});

export const guardianSchema = z.object({
  fullName: personName("Parent/guardian name"),
  mobile: indianMobile,
  email,
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const consentSchema = z.object({
  isGuardian: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you are the parent or legal guardian." }),
  }),
  dataProcessing: z.literal(true, {
    errorMap: () => ({ message: "Consent is required to process your child's registration." }),
  }),
  terms: z.literal(true, {
    errorMap: () => ({ message: "Please accept the terms and policies." }),
  }),
});

export const subjectSelectionSchema = z
  .array(z.string().min(1))
  .min(1, "Select at least one subject.")
  .max(20)
  .refine((ids) => new Set(ids).size === ids.length, "A subject cannot be selected twice.");

export const registrationSchema = z.object({
  student: studentSchema,
  guardian: guardianSchema,
  // Required only when creating a new guardian account.
  password: password.optional(),
  subjectIds: subjectSelectionSchema,
  consent: consentSchema,
  idempotencyKey: z.string().uuid(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

// ── Schools ──────────────────────────────────────────────────

export const schoolPartnershipSchema = z.object({
  schoolName: trimmed(3, 150, "School name"),
  board: trimmed(2, 60, "Board"),
  address: trimmed(5, 300, "Address"),
  city: trimmed(2, 80, "City"),
  state: stateSchema,
  contactName: personName("Principal/coordinator name"),
  contactRole: z.string().trim().max(80).optional().or(z.literal("")),
  officialEmail: email,
  contactNumber: indianMobile,
  classesOffered: trimmed(1, 100, "Classes offered"),
  estimatedStudents: z.coerce
    .number({ invalid_type_error: "Enter an estimated number of students." })
    .int("Enter a whole number.")
    .min(1, "Enter at least 1.")
    .max(100000, "Please enter a realistic estimate."),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  requestVisit: z.boolean().default(false),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue." }) }),
  website: z.string().max(500).optional(), // honeypot — must stay empty; checked in the action
});
export type SchoolPartnershipInput = z.infer<typeof schoolPartnershipSchema>;

// ── Contact ──────────────────────────────────────────────────

export const enquirySchema = z.object({
  name: personName("Name"),
  email,
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^(\+91|91|0)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")), "Enter a valid Indian mobile number."),
  category: z.enum(ENQUIRY_CATEGORIES, { errorMap: () => ({ message: "Select a category." }) }),
  message: trimmed(10, 3000, "Message"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please consent so we can respond to your enquiry." }),
  }),
  website: z.string().max(500).optional(), // honeypot — must stay empty; checked in the action
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

// ── Auth ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20), password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

// ── Verification ─────────────────────────────────────────────

export const certificateNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^GYAN-[A-Z0-9-]{6,40}$/, "Enter a valid certificate number, e.g. GYAN-C26-XXXXXXXX.");

/** Flattens a ZodError into { "student.fullName": "message" } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
