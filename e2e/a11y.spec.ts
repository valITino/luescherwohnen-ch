import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, PREVIEW, PROD, layOutAll } from './helpers.ts';

/**
 * Barrierefreiheit mit axe-core gegen WCAG 2.2 AA (WEB-Q-001). Bei reduzierter Bewegung, damit
 * keine Auftritte (halbe Deckkraft) die Kontrastmessung verfälschen. Ersetzt nicht den
 * manuellen Tastatur- und Screenreader-Test (docs/TODO.md).
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const [label, origin] of [
  ['Vorschau', PREVIEW],
  ['Produktion', PROD],
] as const) {
  for (const path of PAGES) {
    test(`axe WCAG 2.2 AA (${label}): ${path}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        ...testInfo.project.use,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(`${origin}${path}`);
      await page.evaluate(() => document.fonts.ready);
      await layOutAll(page);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const violations = result.violations.map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(' '))
            .join(' | ')}`,
      );
      expect(violations).toEqual([]);
      await context.close();
    });
  }
}

test('Menü offen: auch das Overlay ist zugänglich', async ({ page }) => {
  await page.goto(`${PROD}/impressum`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-menu-toggle]').click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  // Gemessen wird der Endzustand: erst, wenn Vorhang und Auftritte im Menü fertig sind.
  await page.waitForFunction(() =>
    document
      .querySelector('#mobile-menu')!
      .getAnimations({ subtree: true })
      .every((animation) => animation.playState === 'finished'),
  );
  const result = await new AxeBuilder({ page }).include('#mobile-menu').withTags(TAGS).analyze();
  expect(result.violations.map((violation) => violation.id)).toEqual([]);
});
