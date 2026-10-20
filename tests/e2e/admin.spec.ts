import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./fixtures";

test("an administrator can sign in and open every admin module", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/Incorrect email or password/)).toBeVisible();

  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Not configured").first()).toBeVisible();

  const modules = ["students", "registrations", "payments", "schools", "examinations", "subjects", "centres", "admit-cards", "results", "rankings", "awards", "certificates", "enquiries", "settings", "audit-logs"];
  for (const m of modules) {
    const res = await page.goto(`/admin/${m}`);
    expect(res?.status(), m).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("an administrator can add a centre, and it is audit-logged", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/centres");
  const add = page.locator("form").filter({ has: page.getByRole("button", { name: "Add centre" }) });
  await add.getByLabel("Code", { exact: true }).fill("GGN-01");
  await add.getByLabel("Centre name", { exact: true }).fill("Test Examination Centre");
  await add.getByLabel("Address", { exact: true }).fill("Sector 62 Road");
  await add.getByLabel("City", { exact: true }).fill("Gurugram");
  await add.locator("select[name=state]").selectOption("Haryana");
  await add.getByLabel("Capacity", { exact: true }).fill("200");
  await add.getByRole("button", { name: "Add centre" }).click();
  await expect(page.getByText("GGN-01 — Test Examination Centre")).toBeVisible();

  await page.goto("/admin/audit-logs");
  await expect(page.getByText("centre.created")).toBeVisible();
});
