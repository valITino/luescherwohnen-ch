import { expect, test } from "@playwright/test";
import { SEITEN } from "./seiten.mjs";

// WEB-Q-002: kein horizontales Scrollen von 320 px bis Desktop.
for (const url of SEITEN) {
  for (const breite of [320, 375, 768, 1280]) {
    test(`kein horizontaler Überlauf bei ${breite} px auf ${url}`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 });
      await page.goto(url);
      const ueberlauf = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(ueberlauf).toBeLessThanOrEqual(0);
    });
  }
}
