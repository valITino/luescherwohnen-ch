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

test('Nach einer Wahl: anderer Raum und geöffnetes «Mehr lesen» sind zugänglich', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({ ...testInfo.project.use, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${PREVIEW}/`);
  await page.evaluate(() => document.fonts.ready);
  await layOutAll(page);
  // Was erst nach einer Wahl zu sehen ist, misst axe sonst nie: Text und Kontrast der anderen
  // Tafeln und der aufgeklappten Absätze.
  await page.locator('[data-rooms] .room-btn').nth(3).click();
  await page.evaluate(() => {
    for (const details of document.querySelectorAll('details')) details.open = true;
  });
  await expect(page.locator('#raum-bodenbelaege figcaption')).toBeVisible();
  // Die Firmengeschichte steht bei reduzierter Bewegung als Zeitleiste da: alle Jahre messbar.
  await expect(page.locator('#jahr-1983 .moment-body')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(
    result.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.target}`),
  ).toEqual([]);
  await context.close();
});

test('Firmengeschichte auf der Bühne: Achse, Karte und «Weiter» sind zugänglich', async ({
  page,
}) => {
  // Mit Bewegung wird die Zeitleiste zur Bühne (years.ts): Karten aus Papier auf dem grünlichen
  // Bogen, Knöpfe auf der Achse. Die Seiten-Tests oben messen bei reduzierter Bewegung nur die
  // Zeitleiste.
  await page.goto(`${PROD}/`);
  await page.evaluate(() => document.fonts.ready);
  await layOutAll(page);
  const years = page.locator('[data-years]');
  const button = years.locator('.yr-btn').nth(3);
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(button).toHaveAttribute('aria-current', 'step');
  // Gemessen wird in Ruhe: Die Karte des Jahrs liegt allein und an ihrem Platz obenauf.
  await expect
    .poll(() =>
      years.evaluate((root) => {
        const frame = root.querySelector('.timeline')!.getBoundingClientRect();
        return [...root.querySelectorAll<HTMLElement>('.moment')]
          .filter((card) => getComputedStyle(card).visibility === 'visible')
          .map((card) => `${card.id}@${Math.round(card.getBoundingClientRect().top - frame.top)}`);
      }),
    )
    .toEqual(['jahr-1983@0']);
  const result = await new AxeBuilder({ page }).include('[data-years]').withTags(TAGS).analyze();
  expect(
    result.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.target}`),
  ).toEqual([]);
  // Der Kontrast des Satzes auf der Karte ist wirklich gemessen, nicht nur «unklar»: Die Karte
  // trägt ihre Farbe selbst, kein Schleier liegt darüber. (Unklar bleiben für axe nur Teile auf
  // dem Verlauf des Bogens oder mit eigenem Punkt, wie überall auf der Seite.)
  const unclear = result.incomplete
    .filter((entry) => entry.id === 'color-contrast')
    .flatMap((entry) => entry.nodes.map((node) => node.target.join(' ')))
    .filter((target) => target.includes('.moment-body') || /\bp\b/.test(target));
  expect(unclear).toEqual([]);
  const measured = result.passes
    .filter((entry) => entry.id === 'color-contrast')
    .flatMap((entry) => entry.nodes.map((node) => node.target.join(' ')))
    .filter((target) => target.includes('#jahr-1983'));
  expect(measured.length).toBeGreaterThan(0);
  // Für Screenreader: Die Jahre sind Knöpfe mit Namen, eines gilt als aktuell.
  await expect(years.getByRole('button', { name: '1983' })).toHaveAttribute('aria-current', 'step');
  await expect(years.getByRole('button', { name: 'Weiter: 2010' })).toBeVisible();
});

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
