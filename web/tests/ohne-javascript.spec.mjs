import { expect, test } from "@playwright/test";

// Progressive Enhancement: ohne JavaScript bleibt alles lesbar und bedienbar.
test.use({ javaScriptEnabled: false });

test("Startseite ist ohne JavaScript vollständig nutzbar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: "Kontakt" }).click();
  await expect(page).toHaveURL(/#kontakt$/);
  await expect(page.locator("#kontakt").getByRole("heading", { level: 2 })).toBeVisible();
  await expect(page.getByRole("main").locator('a[href^="tel:"]').first()).toBeVisible();
});
