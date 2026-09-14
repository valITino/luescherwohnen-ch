import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WEB-Q-001: Die vom Kontakt-Dienst gerenderten Seiten (Bestätigung, Fehler,
// Danke) bestehen den axe-Scan. Läuft mit JavaScript, weil axe ein Skript injiziert.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("Bestätigungsseite ohne WCAG-Verstösse", async ({ page }) => {
  await page.goto("/#kontakt");
  await page.getByLabel("Name", { exact: false }).fill("Maria Muster");
  await page.getByLabel("E-Mail").fill("maria@example.com");
  await page.getByLabel("Ihre Nachricht", { exact: false }).fill("Ich interessiere mich für eine Beratung zu Betten.");
  await page.getByRole("button", { name: "Anfrage prüfen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anfrage prüfen");
  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(ergebnis.violations).toEqual([]);
});

test("Fehlerseite des Formulars ohne WCAG-Verstösse", async ({ page }) => {
  await page.goto("/#kontakt");
  await page.locator("form.formular").evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByLabel("Ihre Nachricht", { exact: false }).fill("kurz");
  await page.getByRole("button", { name: "Anfrage prüfen" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(ergebnis.violations).toEqual([]);
});

test("Danke-Seite ohne WCAG-Verstösse", async ({ page }) => {
  await page.goto("/kontakt/danke");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vielen Dank für Ihre Anfrage");
  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(ergebnis.violations).toEqual([]);
});
