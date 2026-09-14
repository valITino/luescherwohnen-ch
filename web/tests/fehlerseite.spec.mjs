import { expect, test } from "@playwright/test";

// Unbekannte Adressen liefern Status 404 mit einer verständlichen Seite und Rückweg.
test("unbekannte Adresse liefert 404 mit Rückweg zur Startseite", async ({ page }) => {
  const antwort = await page.goto("/gibt-es-nicht");
  expect(antwort?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seite nicht gefunden");
  await expect(page.getByRole("main").getByRole("link", { name: "Zur Startseite" })).toHaveAttribute("href", "/");
});
