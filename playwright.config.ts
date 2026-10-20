import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://gyan:gyan_dev_password@localhost:5433/gyan_test";

// E2E runs a production build against the separate test database.
// Run `npm run build` first. Razorpay/Resend are intentionally unconfigured so the
// tests also verify the "payments not configured" setup state.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DB,
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_SECRET: "e2e-secret-not-for-production",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      RAZORPAY_KEY_ID: "",
      RAZORPAY_KEY_SECRET: "",
      RESEND_API_KEY: "",
    },
  },
});
