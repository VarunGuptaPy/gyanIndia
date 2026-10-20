import { expect, test } from "@playwright/test";

test("homepage presents the examination and key calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every Child Has a Talent.");
  await expect(page.getByText("NTHE 2026 | Offline Examination | 12 December 2026")).toBeVisible();
  await expect(page.getByRole("link", { name: "Register for NTHE 2026" }).first()).toBeVisible();
  for (const h of ["Excellence Deserves Recognition.", "Partner With GYAN. Inspire Young Achievers.", "Your Journey Towards Excellence Starts Here."]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
});

test("fee calculator updates instantly", async ({ page }) => {
  await page.goto("/#fees");
  const calc = page.locator("#fees");
  const total = calc.getByText(/^₹[\d,]+$/).last();
  await expect(total).toHaveText("₹0");
  for (const s of ["English", "Mathematics", "Science"]) await calc.locator("label").filter({ hasText: s }).first().click();
  await expect(total).toHaveText("₹800");
  await calc.getByRole("button", { name: "Select all" }).click();
  await expect(total).toHaveText("₹1,800");
  await calc.getByRole("button", { name: "Clear" }).click();
  await expect(total).toHaveText("₹0");
});

test("every main navigation item leads to a real page", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["About GYAN", "NTHE 2026", "Subjects", "Awards", "Schools", "Contact"]) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).not.toHaveTitle(/404/);
  }
});

test("unconfirmed exam policies show To Be Announced", async ({ page }) => {
  await page.goto("/nthe-2026");
  await expect(page.getByText("To Be Announced").first()).toBeVisible();
  await expect(page.getByText("Prize details to be announced").first()).toBeVisible();
});

test("contact form validates and submits", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Name is required.")).toBeVisible();
  await page.getByLabel("Full name").fill("Ravi Kumar");
  await page.getByLabel("Email address").fill("ravi@example.com");
  await page.getByLabel("Enquiry category").selectOption("General enquiry");
  await page.getByLabel("Message").fill("I would like to know more about the examination.");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thank you — message received.")).toBeVisible();
});

test("school partnership form submits", async ({ page }) => {
  await page.goto("/schools/register?visit=1");
  await page.getByLabel("School name").fill("Test Convent School");
  await page.getByLabel("Board").selectOption("CBSE");
  await page.getByLabel("Classes offered").fill("1 to 10");
  await page.getByLabel("Address").fill("12 Station Road");
  await page.getByLabel("City").fill("Kanpur");
  await page.getByLabel("State / UT").selectOption("Uttar Pradesh");
  await page.getByLabel("Principal / coordinator name").fill("Meera Singh");
  await page.getByLabel("Official email").fill("principal@example.com");
  await page.getByLabel("Contact number").fill("9123456780");
  await page.getByLabel("Estimated number of interested students").fill("120");
  await page.getByRole("checkbox", { name: /authorised/ }).click();
  await page.getByRole("button", { name: "Submit partnership enquiry" }).click();
  await expect(page.getByText("Thank you for your interest.")).toBeVisible();
});

test("certificate verification handles unknown numbers", async ({ page }) => {
  await page.goto("/certificate/verify");
  await page.getByLabel("Certificate number").fill("GYAN-C26-ZZZZ9999");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("No certificate found")).toBeVisible();
});

test("protected pages require login", async ({ page }) => {
  await page.goto("/student/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  const res = await page.request.get("/api/admin/export/students", { maxRedirects: 0 });
  expect(res.status()).toBe(401);
  expect((await page.request.get("/api/student/receipt/anything", { maxRedirects: 0 })).status()).toBe(401);
});
