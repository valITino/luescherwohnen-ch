import { expect, test } from "@playwright/test";

// WEB-F-001, WEB-F-004, WEB-Q-001: Struktur, Navigation, Tastatur und Kontakt.
test.describe("Startseite", () => {
  test("hat Titel, genau eine H1 und alle Landmarken", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lüscher Wohnen/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const role of ["banner", "navigation", "main", "contentinfo"]) {
      await expect(page.getByRole(role).first()).toBeVisible();
    }
  });

  test("Hauptnavigation führt zu jedem Bereich mit eigener Überschrift", async ({ page }) => {
    await page.goto("/");
    const links = page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < (await links.count()); i += 1) {
      const href = await links.nth(i).getAttribute("href");
      const id = href?.split("#")[1];
      expect(id, `Link ${href} zeigt auf einen Bereich`).toBeTruthy();
      const bereich = page.locator(`#${id}`);
      await expect(bereich).toBeVisible();
      await expect(bereich.getByRole("heading", { level: 2 })).toBeVisible();
    }
  });

  test("Skip-Link ist das erste Tastaturziel und springt in den Inhalt", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Zum Inhalt springen" })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    const imInhalt = await page.evaluate(() => Boolean(document.activeElement?.closest("main")));
    expect(imInhalt).toBe(true);
  });

  test("Telefon und E-Mail sind im Inhalt verlinkt", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(main.locator('a[href^="mailto:"]').first()).toBeVisible();
  });
});
