# GYAN — Global Young Achievers Network

Website and examination management platform for the **National Talent Hunt Examination (NTHE) 2026**.

- Public website (home, about, NTHE 2026, subjects + syllabus, awards, schools, FAQ, contact, legal drafts, Hindi summary)
- Guardian registration wizard with consent, fee calculator and Razorpay payments
- Student/guardian dashboard (registration, receipt, admit card, results, certificates)
- School partnership portal
- Admin dashboard with role-based access: students, registrations, payments/refunds, schools, examination config, subjects, centres, admit cards, results import, rankings, awards, certificates, enquiries, settings, audit logs
- PDF admit cards, receipts and certificates with QR verification

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Radix/shadcn-style UI · Framer Motion · PostgreSQL + Prisma 6 · Auth.js (next-auth v4) · Zod + React Hook Form · Razorpay · Resend · pdf-lib · Vitest · Playwright.

> Several items are intentionally **not** final: legal pages are drafts, exam policies show “To Be Announced”, award prizes are unconfirmed, and payments stay disabled until Razorpay credentials are supplied. See [Production readiness](#production-readiness).

---

## 1. Install

Requirements: Node.js 20+ (22 recommended), Docker (for local PostgreSQL) or any PostgreSQL 14+.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in NEXTAUTH_SECRET (openssl rand -base64 32)
```

## 2. Configure PostgreSQL

Local (Docker):

```bash
docker compose up -d        # PostgreSQL 16 on localhost:5433 (db: gyan, user: gyan)
```

Or set `DATABASE_URL` to any PostgreSQL instance (Neon, Supabase, RDS…). Use `?sslmode=require` for managed providers.

## 3. Run migrations and seed

```bash
npm run db:migrate          # dev: applies migrations (prisma migrate dev)
npm run db:seed             # examination config, 7 proposed subjects, unconfirmed award categories
```

The seed is idempotent and **never creates student, registration or payment records**.
In development it also creates a local super admin (`DEV_ADMIN_EMAIL`, password from `DEV_ADMIN_PASSWORD` or the default in `prisma/seed.ts`). In development the seed opens registration; in production registration stays closed until an admin opens it.

## 4. Start development

```bash
npm run dev                 # http://localhost:3000
```

Useful routes: `/` · `/nthe-2026` · `/register` · `/login` · `/student/dashboard` · `/admin` · `/certificate/verify`.

## 5. Configure Razorpay

1. Create API keys in the Razorpay Dashboard (start with **Test mode** — `rzp_test_…`).
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. Add a webhook: URL `https://<your-domain>/api/payments/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`. Set a secret and copy it to `RAZORPAY_WEBHOOK_SECRET`.
4. Enable **auto-capture** in Razorpay payment settings (the verify endpoint will also capture authorised payments).
5. Live keys (`rzp_live_…`) are refused until `PAYMENTS_LIVE_APPROVED=true`. Set it only after merchant onboarding, the refund policy and pricing are approved.

How payment works: the server creates the order from stored line items (client amounts are ignored) → Razorpay Checkout → the server verifies the HMAC signature, fetches the payment from Razorpay to confirm status and amount, then confirms the registration in a transaction. The signed webhook does the same independently; processing is idempotent, so both paths are safe together.

Without keys the site still works: guardians can register, the registration is saved as **payment pending**, and the payment step shows a clear “not available yet” state. No success is ever simulated.

## 6. Configure email

Create a Resend account, verify the sending domain (e.g. `gyanindia.com`), then set `RESEND_API_KEY` and `EMAIL_FROM` (`"GYAN <noreply@gyanindia.com>"`). Emails sent: registration confirmation and password reset. Without configuration emails are skipped (only the subject line is logged).

## 7. Create the first administrator securely

```bash
ADMIN_PASSWORD='a-long-unique-passphrase' npm run admin:create -- --email you@gyanindia.com --name "Your Name" --role SUPER_ADMIN
```

If `ADMIN_PASSWORD` is omitted a strong random password is generated and printed **once**. Run this from a trusted machine against the production `DATABASE_URL`; don't put the password in shell history on shared machines. Further staff accounts can be created by a Super Admin under **Admin → Settings**.

Roles: Super Admin · Examination Administrator · Finance Administrator · School Coordinator · Student/Guardian. The permission matrix is in `src/lib/rbac.ts`.

## 8. Run tests

```bash
npm run lint
npm run typecheck
npm test                    # Vitest: unit + DB integration tests (uses TEST_DATABASE_URL, default gyan_test)
npm run build && npm run test:e2e   # Playwright against a production build on port 3100 + the test DB
```

Create the test database once: `docker compose exec db psql -U gyan -c "CREATE DATABASE gyan_test;"`.
Tests truncate the test database — never point `TEST_DATABASE_URL` at real data. First Playwright run: `npx playwright install chromium`.

## 9. Deploy (Vercel + managed PostgreSQL)

1. Create a managed PostgreSQL database with point-in-time recovery.
2. Import the repository into Vercel. Build command: `npm run build` (runs `prisma generate`).
3. Set environment variables (Production): `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, Razorpay and Resend variables.
4. Apply migrations from CI or locally against production: `npx prisma migrate deploy`, then `NODE_ENV=production npm run db:seed`.
5. Create the first admin (step 7). Log in, review **Admin → Examination**, **Subjects**, **Awards**, then open registration when approved.

## 10. Production domain

- Add `www.gyanindia.com` (and `gyanindia.com` redirecting to `www`) in Vercel → Domains, and configure DNS as instructed.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://www.gyanindia.com` (used for canonical URLs, sitemap, QR codes and email links).
- Update the Razorpay webhook URL and the Resend sending domain to match.

---

## Project structure

```
prisma/               schema, migrations, seed
scripts/              create-admin, render-sample-pdfs
src/app/(site)/       public website + student portal
src/app/admin/        admin dashboard
src/app/api/          auth, payments (order/verify/webhook), PDFs, exports
src/components/       ui primitives, site, forms, student, admin
src/content/          editorial content (subjects/syllabus, FAQ, consent text)
src/lib/              fees, rankings, CSV import, signatures, rbac, auth, PDFs, validation
src/server/           registration, payments, exam operations, verification, server actions
tests/                unit, integration (DB) and e2e (Playwright)
docs/                 security & privacy checklist
```

### Examination workflow (admin)

1. **Examination** — set confirmed details; leave unknowns blank (shown as “To Be Announced”); set ranking scope + tie policy and mark them approved when official.
2. **Subjects** — availability, fee, max marks, approval flag.
3. **Centres** — add centres, mark approved, auto-allocate (city → state, capacity-aware) or allocate individually from a registration.
4. **Admit cards** — generate (approved centre + reporting time required), review, release (exam-day instructions required).
5. **Results** — upload CSV (`registration_number,marks,status`), review errors/duplicates, apply, correct individually with a logged reason, publish.
6. **Rankings** — calculate, review, publish. Ties always share a rank; no tie-break criterion is invented.
7. **Certificates** — issue participation/merit/rank certificates in bulk; revoke if needed. Anyone can verify at `/certificate/verify`.

## Production readiness

Ready: core flows above, verified by automated tests. Not yet ready / required before launch:

- Razorpay credentials + test-mode end-to-end payment verification; `PAYMENTS_LIVE_APPROVED` sign-off.
- Resend credentials and verified sending domain.
- Legal review of all policy pages (currently marked Draft) and DPDP verifiable-parental-consent confirmation.
- Logo artwork is in `public/brand/` (emblem + "Gyan India" wordmark, raster PNGs). Vector (SVG) versions would sharpen print and PDFs; professional photography if desired.
- Official approval of eligibility, boards, subjects, exam pattern, ranking rules and award structure.
- Official syllabus (subject pages show clearly labelled indicative focus areas).
- See `docs/SECURITY_AND_PRIVACY_CHECKLIST.md` for the full list (CSP header, admin 2FA, retention schedule, backups).
