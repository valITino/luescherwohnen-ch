import { expect, test } from "@playwright/test";
import { SEITEN } from "./seiten.mjs";

// WEB-F-005: Impressum und Datenschutz sind eigene, direkt erreichbare Seiten.
for (const url of SEITEN) {
  test(`Fusszeile verlinkt Impressum und Datenschutz auf ${url}`, async ({ page }) => {
    await page.goto(url);
    const fuss = page.getByRole("contentinfo");
    await expect(fuss.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum.html");
    await expect(fuss.getByRole("link", { name: "Datenschutz" })).toHaveAttribute("href", "/datenschutz.html");
  });
}

test("Impressum und Datenschutz sind direkt aufrufbar", async ({ page }) => {
  await page.goto("/impressum.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Impressum");
  await page.goto("/datenschutz.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Datenschutz");
});
