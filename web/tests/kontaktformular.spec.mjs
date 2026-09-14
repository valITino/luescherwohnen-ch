import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { MAIL_LOG } from "../../playwright.config.mjs";

// WEB-F-004 und ADR-0002: Kontaktformular in zwei Schritten, ohne JavaScript nutzbar.
// Die axe-Prüfung der Dienstseiten liegt in kontaktformular-a11y.spec.mjs (braucht JavaScript).
// Klicks mit force: Ohne JavaScript bleibt Playwrights Stabilitätsprüfung beim
// Wiederholen hängen; die Elemente sind sichtbar, der Klick löst den Formularversand aus.
test.use({ javaScriptEnabled: false });

async function protokoll() {
  try {
    return await readFile(MAIL_LOG, "utf8");
  } catch {
    return "";
  }
}

test("Anfrage prüfen, senden und Danke-Seite erreichen", async ({ page }) => {
  const kennung = `Test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await page.goto("/#kontakt");
  await page.getByLabel("Name", { exact: false }).fill(kennung);
  await page.getByLabel("E-Mail").fill("test@example.com");
  await page.getByLabel("Ihre Nachricht", { exact: false }).fill("Ich interessiere mich für eine Beratung zu Vorhängen.");
  await page.getByRole("button", { name: "Anfrage prüfen" }).click({ force: true });

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anfrage prüfen");
  await expect(page.getByText(kennung)).toBeVisible();

  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Anfrage senden" }).click({ force: true });
  await expect(page).toHaveURL(/\/kontakt\/danke$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vielen Dank für Ihre Anfrage");
  await expect.poll(protokoll).toContain(kennung);
});

test("fehlende Angaben werden verständlich gemeldet", async ({ page }) => {
  await page.goto("/#kontakt");
  // Pflichtfelder leer lassen: Die native Browserprüfung wird für den Test
  // abgeschaltet, damit die serverseitige Prüfung sichtbar wird.
  const formular = page.locator("form.formular");
  await formular.evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByLabel("Ihre Nachricht", { exact: false }).fill("kurz");
  await page.getByRole("button", { name: "Anfrage prüfen" }).click({ force: true });
  await expect(page.getByRole("alert")).toContainText("Bitte prüfen Sie Ihre Angaben");
  await expect(page.getByLabel("Name", { exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Ihre Nachricht", { exact: false })).toHaveAttribute("aria-invalid", "true");
});

test("Angaben ändern führt zurück ins ausgefüllte Formular", async ({ page }) => {
  await page.goto("/#kontakt");
  await page.getByLabel("Name", { exact: false }).fill("Maria Muster");
  await page.getByLabel("Telefon").fill("056 222 78 52");
  await page.getByLabel("Ihre Nachricht", { exact: false }).fill("Bitte rufen Sie mich wegen eines Teppichs zurück.");
  await page.getByRole("button", { name: "Anfrage prüfen" }).click({ force: true });
  await page.getByRole("button", { name: "Angaben ändern" }).click({ force: true });
  await expect(page.getByLabel("Name", { exact: false })).toHaveValue("Maria Muster");
  await expect(page.getByLabel("Telefon")).toHaveValue("056 222 78 52");
});
