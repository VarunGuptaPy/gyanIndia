# Security, Privacy & Child-Data-Protection Checklist

Status legend: ✅ implemented in code · ⚠️ partially implemented / needs configuration · ⬜ organisational action required before launch.

## Implemented in the platform

| Control | Status | Where |
|---|---|---|
| Guardian-controlled accounts; students never log in directly | ✅ | `src/server/registration.ts` |
| Versioned guardian consent recorded (version, SHA-256 of text, timestamp, hashed IP, user agent) before any child data is stored | ✅ | `ConsentRecord`, `src/content/consent.ts` |
| Data minimisation — no DOB, photo, Aadhaar or ID numbers collected; address optional | ✅ | `src/lib/validation.ts` |
| Server-side validation (Zod) of every form, action and API body | ✅ | `src/lib/validation.ts` |
| Fees recomputed on the server from DB, integer paise; client amounts ignored | ✅ | `src/lib/fees.ts`, `src/server/payments.ts` |
| Payment confirmed only after HMAC checkout signature **and** a Razorpay API fetch, or a signed webhook; never from a redirect | ✅ | `src/app/api/payments/*` |
| Idempotent payment processing (row-level claim, unique payment IDs, webhook event de-duplication) | ✅ | `confirmPayment`, `WebhookEvent` |
| Live payment keys blocked unless `PAYMENTS_LIVE_APPROVED=true` | ✅ | `src/lib/razorpay.ts` |
| Role-based access enforced server-side on every admin page, action and API route; middleware as defence in depth | ✅ | `src/lib/rbac.ts`, `src/lib/session.ts`, `src/middleware.ts` |
| Deactivated accounts and role changes take effect on the next request (DB re-check of JWT session) | ✅ | `currentUser()` |
| bcrypt (cost 12) password hashing; account lockout after 5 failures; timing-equalised login | ✅ | `src/lib/auth.ts` |
| Rate limiting (Postgres-backed, works on serverless) on login, registration, contact, school form, password reset, verification, payments | ✅ | `src/lib/rate-limit.ts` |
| CSRF: Server Actions use Next.js origin checks; Auth.js uses CSRF tokens; cookies httpOnly + SameSite=Lax + Secure over HTTPS | ✅ | framework |
| Honeypot spam traps on public forms | ✅ | contact & school forms |
| Audit log of sensitive actions containing identifiers only (no child PII, no payment credentials) | ✅ | `AuditLog`, `src/lib/audit.ts` |
| IP addresses stored only as salted hashes | ✅ | `src/lib/request.ts` |
| Public certificate/admit-card verification shows initials only | ✅ | `src/server/verification.ts` |
| Results visible only to the owning guardian; no public results list | ✅ | `/student/results` |
| CSV export neutralises spreadsheet formula injection; exports are audit-logged | ✅ | `/api/admin/export/students` |
| Security headers (HSTS, nosniff, frame-deny, referrer policy, permissions policy) | ✅ | `next.config.ts` |
| Error responses never leak stack traces; logs exclude PII and secrets | ✅ | route handlers, `src/lib/email.ts` |
| Content-Security-Policy header | ⚠️ | Not yet set — add a nonce-based CSP allowing `checkout.razorpay.com` after launch testing |
| Email verification of guardian address | ⚠️ | Password reset works when Resend is configured; a verify-email step is not yet enforced |

## Required before accepting live registrations (organisational)

- ⬜ Qualified legal review of Privacy Policy, Terms, Refund Policy and Child Data Protection statement (all marked **Draft** on the site).
- ⬜ DPDP Act 2023 / DPDP Rules: confirm the **verifiable parental consent** mechanism is sufficient (the platform records declared guardianship + consent; the Rules may require additional verification, e.g. a DigiLocker/virtual-token based age check).
- ⬜ Appoint a grievance officer and publish contact details; define data-retention periods and implement scheduled deletion.
- ⬜ Data Processing Agreements with hosting (Vercel), database provider, Razorpay and Resend; confirm data residency requirements.
- ⬜ Razorpay merchant onboarding, approved refund policy, and test-mode end-to-end verification before setting `PAYMENTS_LIVE_APPROVED=true`.
- ⬜ Approve examination policies (eligibility, boards, subjects, duration, marking, ranking scope and tie policy, awards) in the admin panel.
- ✅ Website uses the supplied logo artwork (`public/brand/`). ⬜ PDF documents (receipt, admit card, certificate) still draw the old placeholder emblem.
- ⬜ Incident-response and breach-notification procedure (Data Protection Board + affected users).
- ⬜ Staff training on handling children's data; least-privilege role assignment; enforce strong passwords and consider adding 2FA for admins.

## Backup & recovery guidance

- Use a managed PostgreSQL with **point-in-time recovery** (e.g. Neon, Supabase, RDS) and daily snapshots retained ≥ 30 days.
- Encrypt backups at rest; restrict backup access to named Super Admins.
- Test a full restore to a staging database at least once before launch and before results publication.
- Before bulk operations (result import/apply, ranking generation, certificate issue) take an on-demand snapshot.
- `prisma migrate deploy` is forward-only; never run `migrate reset` or `db push --force-reset` against production.
