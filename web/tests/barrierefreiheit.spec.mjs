import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SEITEN } from "./seiten.mjs";

// WEB-Q-001: automatisierter WCAG-Scan je Seite (ersetzt keinen manuellen Test).
for (const url of SEITEN) {
  test(`axe-core findet keine WCAG-A/AA-Verstösse auf ${url}`, async ({ page }) => {
    await page.goto(url);
    const ergebnis = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(ergebnis.violations).toEqual([]);
  });
}
