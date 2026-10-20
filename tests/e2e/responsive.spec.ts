import { expect, test } from "@playwright/test";

const PAGES = ["/", "/about", "/nthe-2026", "/subjects", "/subjects/artificial-intelligence", "/awards", "/schools/register", "/register", "/contact", "/faq", "/hi"];

for (const path of PAGES) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test("mobile menu opens and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Awards" }).click();
  await expect(page).toHaveURL(/\/awards/);
});
