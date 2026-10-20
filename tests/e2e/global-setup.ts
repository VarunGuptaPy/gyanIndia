import { execSync } from "node:child_process";
import { E2E_ADMIN } from "./fixtures";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://gyan:gyan_dev_password@localhost:5433/gyan_test";

export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: TEST_DB, NODE_ENV: "development" as const, DEV_ADMIN_EMAIL: E2E_ADMIN.email, DEV_ADMIN_PASSWORD: E2E_ADMIN.password };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  // Clean slate for participant data; examination config is (re)seeded below.
  execSync(
    `npx prisma db execute --stdin --schema prisma/schema.prisma`,
    {
      env,
      input: `TRUNCATE "Registration","Student","Guardian","ConsentRecord","PaymentOrder","Payment","Refund","Enquiry","SchoolPartnership","School","AuditLog","RateLimitBucket","WebhookEvent","Counter","Certificate","Result","Ranking","AdmitCard","CentreAllocation","ExaminationCentre","ResultImportBatch","PasswordResetToken" CASCADE; DELETE FROM "User";`,
    },
  );
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
  execSync(`npx prisma db execute --stdin --schema prisma/schema.prisma`, { env, input: `UPDATE "Examination" SET "registrationOpen" = true;` });
}
