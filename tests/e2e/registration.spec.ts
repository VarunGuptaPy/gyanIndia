import { expect, test } from "@playwright/test";
import { E2E_GUARDIAN_PASSWORD } from "./fixtures";

test("a guardian registers a student; payment shows the setup state and the dashboard shows the pending registration", async ({ page }) => {
  const email = `guardian-${Date.now()}@example.com`;
  await page.goto("/register");

  // Step 1 — validation then student details
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Student's full name is required.")).toBeVisible();
  await page.getByLabel("Student's full name").fill("Kavya Test Nair");
  await page.getByLabel("Class").selectOption("5");
  await page.getByLabel("Education board").selectOption("ICSE");
  await page.getByLabel("School name").fill("Test Academy");
  await page.getByLabel("City").fill("Gurugram");
  await page.getByLabel("State / UT").selectOption("Haryana");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — guardian
  await expect(page.getByRole("heading", { name: "Parent / guardian details" })).toBeVisible();
  await page.getByLabel("Full name").fill("Anil Test Nair");
  await page.getByLabel("Mobile number").fill("9988776655");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Create a password").fill(E2E_GUARDIAN_PASSWORD);
  await page.getByLabel("Confirm password").fill("mismatch-1234");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await page.getByLabel("Confirm password").fill(E2E_GUARDIAN_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — subjects
  await expect(page.getByRole("heading", { name: "Select subjects" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Select at least one subject.")).toBeVisible();
  await page.locator("label").filter({ hasText: "Mathematics" }).click();
  await page.locator("label").filter({ hasText: "Artificial Intelligence" }).click();
  await expect(page.getByLabel("Registration progress").locator("..").getByText("₹550").first()).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4 — review and consent
  await expect(page.getByRole("heading", { name: "Review and consent" })).toBeVisible();
  await expect(page.getByText("Total payable")).toBeVisible();
  await page.getByRole("button", { name: "Confirm and continue to payment" }).click();
  await expect(page.getByText("Please confirm you are the parent or legal guardian.")).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  for (const cb of await page.getByRole("checkbox").all()) await cb.click();
  await page.getByRole("button", { name: "Confirm and continue to payment" }).click();

  // Step 5 — payment (Razorpay intentionally not configured in E2E)
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await page.getByRole("button", { name: /Pay ₹550 securely/ }).click();
  await expect(page.getByText("Online payment is not available yet")).toBeVisible();

  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await expect(page.getByText("Kavya Test Nair")).toBeVisible();
  await expect(page.getByText("Payment pending")).toBeVisible();
  await expect(page.getByText("Assigned after payment")).toBeVisible();

  // Guardians cannot open admin pages.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/student\/dashboard/);

  // Registering the same child again is blocked.
  await page.goto("/register");
  await page.getByLabel("Student's full name").fill("Kavya Test Nair");
  await page.getByLabel("Class").selectOption("5");
  await page.getByLabel("Education board").selectOption("ICSE");
  await page.getByLabel("School name").fill("Test Academy");
  await page.getByLabel("City").fill("Gurugram");
  await page.getByLabel("State / UT").selectOption("Haryana");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("label").filter({ hasText: "Science" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review and consent" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  for (const cb of await page.getByRole("checkbox").all()) await cb.click();
  await page.getByRole("button", { name: "Confirm and continue to payment" }).click();
  await expect(page.getByText(/already registered for NTHE 2026/)).toBeVisible();
});
