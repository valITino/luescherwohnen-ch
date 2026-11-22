import { expect, test, type Page } from '@playwright/test';
import {
  PROD,
  boxOverflow,
  brokenWords,
  collectErrors,
  cutOff,
  imageCollisions,
  layOutAll,
  nextFrames,
  scrollToY,
  toggleMotion,
} from './helpers.ts';

/**
 * Firmengeschichte «Jahr für Jahr» (years.ts, scroll.css): Die Jahre gehen mit dem Scrollen
 * weiter. Die Bühne bleibt dabei unter dem Header stehen, die Linie der Achse wächst, und die
 * Karte des nächsten Jahrs schiebt sich über die des vorherigen. Niemand muss klicken; die Knöpfe
 * der Achse und «Weiter» bleiben als Abkürzung.
 *
 * Wie überall hängt der Zustand allein an der Scrollposition: Die Tests scrollen an eine Stelle
 * und lesen ihn ab.
 */

const YEARS = ['1946', '1949', '1959', '1983', '2010', 'Heute'];

async function openHome(page: Page, hash = '') {
  await page.goto(`${PROD}/${hash}`);
  await page.evaluate(() => document.fonts.ready);
  await layOutAll(page);
}

/** Lage und Länge der Strecke, auf der die Bühne steht (so rechnet auch years.ts) */
const track = (page: Page) =>
  page.locator('[data-years]').evaluate((root) => {
    const stage = root.querySelector<HTMLElement>('.history-stage')!;
    let top = 0;
    for (
      let node: HTMLElement | null = root as HTMLElement;
      node;
      node = node.offsetParent as HTMLElement | null
    ) {
      top += node.offsetTop;
    }
    const style = getComputedStyle(root);
    return {
      sticky: Number.parseFloat(getComputedStyle(stage).top),
      start: top - Number.parseFloat(getComputedStyle(stage).top),
      distance: (root as HTMLElement).offsetHeight - stage.offsetHeight,
      span: Number.parseFloat(style.getPropertyValue('--yr-span')),
      rise: Number.parseFloat(style.getPropertyValue('--yr-rise')),
    };
  });

/**
 * An die Stelle scrollen, an der Jahr `year` (0 bis 5) angekommen ist; Bruchteile: unterwegs.
 * Ein Pixel hinter der gerechneten Stelle, wie die Knöpfe (years.ts): Auf ganze Pixel gerundet
 * läge sie sonst mitunter einen Bruchteil davor, und die Karte wäre noch nicht ganz angekommen.
 */
async function toYear(page: Page, year: number): Promise<void> {
  const { start, distance, span } = await track(page);
  await scrollToY(page, Math.round(start + (distance * year) / span) + (year > 0 ? 1 : 0));
}

/** Was auf der Bühne zu sehen ist */
const stage = (page: Page) =>
  page.locator('[data-years]').evaluate((root) => {
    const box = root.querySelector<HTMLElement>('.history-stage')!;
    const frame = root.querySelector('.timeline')!.getBoundingClientRect();
    const buttons = [...root.querySelectorAll('.yr-btn')];
    const line = getComputedStyle(root.querySelector('.yr-track')!, '::after').scale;
    return {
      position: getComputedStyle(box).position,
      top: Math.round(box.getBoundingClientRect().top),
      bottom: Math.round(box.getBoundingClientRect().bottom),
      current: buttons.findIndex((button) => button.getAttribute('aria-current') === 'step'),
      past: buttons.filter((button) => button.hasAttribute('data-past')).length,
      line: line === 'none' ? 1 : Number.parseFloat(line),
      // Jede Karte: zu sehen? Und wie weit unter ihrem Platz (0: angekommen)?
      cards: [...root.querySelectorAll<HTMLElement>('.moment')].map((card) => ({
        visible: getComputedStyle(card).visibility === 'visible',
        below: Math.round(card.getBoundingClientRect().top - frame.top),
      })),
      frame: Math.round(frame.height),
      next: root.querySelector('[data-years-next-text]')!.textContent,
    };
  });

const visibleCards = (state: Awaited<ReturnType<typeof stage>>) =>
  state.cards.flatMap((card, index) => (card.visible ? [index] : []));

const current = (page: Page) => async () => (await stage(page)).current;

test.describe('Firmengeschichte geht mit dem Scrollen weiter', () => {
  test('Die Bühne steht, Linie und Karten folgen dem Weg, vor und zurück', async ({ page }) => {
    const errors = collectErrors(page);
    await openHome(page);
    const { start, distance, sticky } = await track(page);
    const viewport = await page.evaluate(() => window.innerHeight);

    // Noch auf dem Weg ins Bild: Die Bühne scrollt wie alles andere, 1946 ist zu sehen.
    await scrollToY(page, start - 300);
    let state = await stage(page);
    expect(state.position).toBe('sticky');
    expect(Math.abs(state.top - (sticky + 300))).toBeLessThanOrEqual(1);
    expect(visibleCards(state)).toEqual([0]);
    expect(state.line).toBe(0);

    // Unter dem Header angekommen, bleibt sie stehen. Sie passt ganz ins Fenster.
    await toYear(page, 0);
    state = await stage(page);
    expect(Math.abs(state.top - sticky)).toBeLessThanOrEqual(1);
    expect(state.bottom).toBeLessThanOrEqual(viewport + 1);
    await expect.poll(current(page)).toBe(0);
    expect(state.next).toBe('Weiter: 1949');

    // Unterwegs zum nächsten Jahr: Die Bühne steht weiter, die Karte von 1949 schiebt sich von
    // unten über 1946 (beide sind zu sehen), und die Linie ist ein Stück gewachsen.
    await toYear(page, 0.6);
    state = await stage(page);
    expect(Math.abs(state.top - sticky)).toBeLessThanOrEqual(1);
    expect(visibleCards(state)).toEqual([0, 1]);
    expect(state.cards[1]!.below).toBeGreaterThan(state.frame * 0.3);
    expect(state.cards[1]!.below).toBeLessThan(state.frame * 0.8);
    expect(state.line).toBeCloseTo(0.6 / 5, 2);
    // Noch gilt 1946: Der Punkt von 1949 wird erst grün, wenn die Linie ihn erreicht.
    expect(state.current).toBe(0);

    // Angekommen: Die neue Karte steht an ihrem Platz, die alte ist ganz verdeckt und verborgen.
    await toYear(page, 1);
    state = await stage(page);
    expect(visibleCards(state)).toEqual([1]);
    expect(state.cards[1]!.below).toBe(0);
    expect(state.line).toBeCloseTo(0.2, 2);
    await expect.poll(current(page)).toBe(1);
    expect((await stage(page)).past).toBe(1);

    // Jedes Jahr ruht zuerst (ein Viertel seines Wegs), bevor das nächste steigt.
    await toYear(page, 3.15);
    state = await stage(page);
    expect(visibleCards(state)).toEqual([3]);
    expect(state.cards[3]!.below).toBe(0);
    await expect.poll(current(page)).toBe(3);
    expect((await stage(page)).next).toBe('Weiter: 2010');

    // Zurück an dieselbe Stelle: derselbe Zustand, auf den Pixel. Ohne Scrollen läuft nichts.
    await toYear(page, 1.6);
    await expect.poll(current(page)).toBe(1);
    const there = await stage(page);
    await toYear(page, 4.2);
    await toYear(page, 1.6);
    await expect.poll(current(page)).toBe(1);
    expect(await stage(page)).toEqual(there);
    await page.waitForTimeout(400);
    expect(await stage(page)).toEqual(there);

    // «Heute» kommt an, ruht einen halben Schritt, dann gibt die Bühne die Seite wieder frei.
    await toYear(page, 5);
    state = await stage(page);
    expect(visibleCards(state)).toEqual([5]);
    expect(state.line).toBe(1);
    expect(Math.abs(state.top - sticky)).toBeLessThanOrEqual(1);
    await expect.poll(current(page)).toBe(5);
    expect((await stage(page)).next).toBe('Zurück zu 1946');
    await scrollToY(page, start + distance + 200);
    state = await stage(page);
    expect(state.top).toBeLessThan(sticky - 150);
    expect(visibleCards(state)).toEqual([5]);
    expect(errors).toEqual([]);
  });

  test('Die Knöpfe der Achse und «Weiter» bleiben als Abkürzung', async ({ page }) => {
    await openHome(page);
    const years = page.locator('[data-years]');
    await expect(years.getByRole('group', { name: 'Jahre der Firmengeschichte' })).toBeVisible();
    const buttons = years.locator('.yr-btn');
    await expect(buttons).toHaveText(YEARS);
    const next = years.locator('[data-years-next]');
    const { sticky } = await track(page);
    /** Am Ziel: Die Bühne steht, die Karte des Jahrs liegt allein und an ihrem Platz obenauf. */
    const arrived = async (index: number) => {
      await expect(buttons.nth(index)).toHaveAttribute('aria-current', 'step');
      await expect
        .poll(async () => {
          const state = await stage(page);
          return [
            visibleCards(state),
            state.cards[index]!.below,
            Math.abs(state.top - sticky) <= 1,
          ];
        })
        .toEqual([[index], 0, true]);
    };

    // Ein Jahr auf der Achse: Die Seite scrollt an seine Stelle, der Zustand folgt der Lage.
    await buttons.nth(3).scrollIntoViewIfNeeded();
    await buttons.nth(3).click();
    await arrived(3);
    await expect(years.getByRole('status')).toHaveText('1983, 4 von 6');
    // Genau ein Jahr gilt als aktuell.
    await expect(years.locator('.yr-btn[aria-current]')).toHaveCount(1);

    // «Weiter» führt zum nächsten Jahr und am Ende zurück zum Anfang.
    await expect(next).toHaveText(/Weiter: 2010/);
    await next.click();
    await arrived(4);
    await expect(years.getByRole('status')).toHaveText('2010, 5 von 6');
    await buttons.last().click();
    await arrived(5);
    await expect(next).toHaveText(/Zurück zu 1946/);
    await expect(next).toHaveAttribute('aria-label', 'Zurück zu 1946');
    await next.click();
    await arrived(0);
    await expect(next).toHaveText(/Weiter: 1949/);

    // Tastatur: Pfeile, Pos1 und Ende wandern auf der Achse, die Eingabetaste wählt.
    await buttons.nth(1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(buttons.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(buttons.last()).toBeFocused();
    await page.keyboard.press('Enter');
    await arrived(5);
    // Der Fokus bleibt auf dem Knopf und im Bild.
    await expect(buttons.last()).toBeFocused();
    await expect(buttons.last()).toBeInViewport();
  });

  test('Direktlink auf ein Jahr zeigt dieses Jahr', async ({ page }) => {
    await openHome(page, '#jahr-1983');
    await expect(page.locator('[data-years] .yr-btn').nth(3)).toHaveAttribute(
      'aria-current',
      'step',
    );
    const { sticky } = await track(page);
    await expect
      .poll(async () => {
        const state = await stage(page);
        return [visibleCards(state), Math.abs(state.top - sticky) <= 1];
      })
      .toEqual([[3], true]);
    await expect(page.locator('#jahr-1983 p').last()).toContainText('Bruno Längle');
  });

  test('Ohne scrollgekoppelte Animationen wechseln die Jahre in Schritten', async ({ page }) => {
    // Firefox und Safari vor 26: Der Browser kennt die Zeitleiste am Scrollen nicht. Die Bühne
    // steht trotzdem, und years.ts wechselt die Karten nach der Scrollposition.
    await page.route('**/*.css', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replaceAll('animation-timeline:view()', 'x-none:view()');
      await route.fulfill({ response, body });
    });
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = ((...args: [string, string?]) =>
        String(args[0]).includes('animation-timeline')
          ? false
          : supports(...(args as [string]))) as typeof CSS.supports;
    });
    await openHome(page);
    const { sticky } = await track(page);
    await toYear(page, 0.5);
    let state = await stage(page);
    expect(state.position).toBe('sticky');
    expect(Math.abs(state.top - sticky)).toBeLessThanOrEqual(1);
    await expect.poll(current(page)).toBe(0);
    expect(visibleCards(await stage(page))).toEqual([0]);

    // Das nächste Jahr gilt, sobald seine Karte halb gestiegen wäre: Sie fährt dann herein.
    await toYear(page, 0.7);
    await expect.poll(current(page)).toBe(1);
    await expect
      .poll(async () => {
        const now = await stage(page);
        return [visibleCards(now), now.cards[1]!.below];
      })
      .toEqual([[1], 0]);
    // Die Linie wächst in Schritten bis zum aktuellen Jahr.
    await expect.poll(async () => (await stage(page)).line).toBeCloseTo(0.2, 2);

    // Zurück ebenso, und die Knöpfe führen weiterhin an die Stelle ihres Jahrs.
    await toYear(page, 0.5);
    await expect.poll(current(page)).toBe(0);
    await expect.poll(async () => visibleCards(await stage(page))).toEqual([0]);
    await page.locator('[data-years] .yr-btn').nth(4).click();
    await expect.poll(current(page)).toBe(4);
    await expect.poll(async () => visibleCards(await stage(page))).toEqual([4]);
    state = await stage(page);
    expect(Math.abs(state.top - sticky)).toBeLessThanOrEqual(1);
  });

  test('Bewegung angehalten: Die Jahre wechseln sofort, die Seite verschiebt sich nicht', async ({
    page,
  }) => {
    await openHome(page);
    await toYear(page, 2.6);
    // Geführt: Die Karte von 1983 ist unterwegs, 1959 noch zu sehen.
    expect(visibleCards(await stage(page))).toEqual([2, 3]);
    const before = { y: await page.evaluate(() => window.scrollY), track: await track(page) };

    await toggleMotion(page, 'off');
    // Sofort ein ganzes Bild: nur das Jahr, das an dieser Stelle gilt, ohne Zwischenzustand.
    let state = await stage(page);
    expect(visibleCards(state)).toEqual([2]);
    expect(state.cards[2]!.below).toBe(0);
    expect(state.current).toBe(2);
    expect(state.line).toBeCloseTo(0.4, 3);
    expect(state.position).toBe('sticky');
    // Die Bühne liegt, wo sie lag, und ist gleich lang: Die Seite steht, wo sie stand.
    expect({ y: await page.evaluate(() => window.scrollY), track: await track(page) }).toEqual(
      before,
    );

    // Weiter gescrollt, wechselt das Jahr ohne Übergang.
    await toYear(page, 2.7);
    await expect.poll(current(page)).toBe(3);
    state = await stage(page);
    expect(visibleCards(state)).toEqual([3]);
    expect(state.cards[3]!.below).toBe(0);

    // Fortgesetzt hängen Karte und Linie wieder am Weg.
    await toggleMotion(page, 'on');
    await toYear(page, 2.6);
    await nextFrames(page);
    state = await stage(page);
    expect(visibleCards(state)).toEqual([2, 3]);
    expect(state.line).toBeCloseTo(2.6 / 5, 2);
  });

  test('Als Zeitleiste: bei reduzierter Bewegung, im niedrigen Fenster und ohne Skript', async ({
    browser,
  }, testInfo) => {
    const cases = [
      { label: 'reduzierte Bewegung', options: { reducedMotion: 'reduce' as const } },
      { label: 'niedriges Fenster', options: { viewport: { width: 844, height: 390 } } },
      { label: 'ohne Skript', options: { javaScriptEnabled: false } },
    ];
    for (const { label, options } of cases) {
      const context = await browser.newContext({ ...testInfo.project.use, ...options });
      const page = await context.newPage();
      await page.goto(`${PROD}/`);
      const years = page.locator('[data-years]');
      await years.scrollIntoViewIfNeeded();
      // Alle sechs Momente stehen untereinander, in der Reihenfolge der Jahre, nichts ist verborgen.
      await expect(years.locator('.moment-year'), label).toHaveText(YEARS);
      for (const text of await years.locator('.moment-body p').all()) {
        await expect(text, label).toBeVisible();
      }
      // Nichts bleibt stehen, und es gibt keine Knöpfe, die nichts täten.
      expect(
        await years
          .locator('.history-stage')
          .evaluate((element) => getComputedStyle(element).position),
        label,
      ).toBe('static');
      await expect(years.locator('.yr-axis'), label).toBeHidden();
      await expect(years.locator('button:visible'), label).toHaveCount(0);
      await context.close();
    }
  });

  test('Die Bühne passt ganz ins Fenster, und nichts ragt aus seinem Kasten', async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 640 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      // Tablet quer und kleiner Laptop: Der Titel steht neben der Bühne, ihre Spalte ist schmal.
      { width: 1024, height: 700 },
      { width: 1280, height: 600 },
      { width: 1366, height: 650 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      const label = `${viewport.width}×${viewport.height}`;
      await page.setViewportSize(viewport);
      await openHome(page);
      // Bei 1959 steht der längste Satz, bei 1946 und 1983 ein Foto. Die Prüfungen messen nur
      // die Firmengeschichte: Mit Bewegung ragen anderswo Teile absichtlich aus ihrem Rahmen
      // (Band, gleitende Fotos); die ganze Seite messen die Layout-Tests bei reduzierter Bewegung.
      for (const year of [0, 2, 3]) {
        await toYear(page, year);
        await expect.poll(current(page), label).toBe(year);
        const fit = await page.locator('[data-years]').evaluate((root) => {
          const box = root.querySelector<HTMLElement>('.history-stage')!;
          const frame = root.querySelector('.timeline')!.getBoundingClientRect();
          const card = root.querySelector('.moment[data-on] .moment-card')!;
          return {
            deck: root.hasAttribute('data-deck'),
            // Die Bühne ist nicht höher als das Fenster, und ihr Inhalt nicht höher als sie.
            inWindow: box.getBoundingClientRect().bottom <= window.innerHeight + 1,
            content: box.scrollHeight <= box.clientHeight + 1,
            // Alles auf der Karte liegt im Rahmen.
            inFrame: [...card.querySelectorAll('p, img')].every((element) => {
              const rect = element.getBoundingClientRect();
              return rect.top >= frame.top - 0.5 && rect.bottom <= frame.bottom + 0.5;
            }),
          };
        });
        expect(fit, `${label}, Jahr ${year}`).toEqual({
          deck: true,
          inWindow: true,
          content: true,
          inFrame: true,
        });
        expect(await cutOff(page, '[data-years]'), label).toEqual([]);
        expect(await boxOverflow(page, '[data-years]'), label).toEqual([]);
        expect(await brokenWords(page, '[data-years]'), label).toEqual([]);
        expect(await imageCollisions(page, '[data-years]'), label).toEqual([]);
      }
    }
  });

  test('Passt die Bühne nicht ins Fenster, bleibt die Zeitleiste', async ({ page }) => {
    // Schmal und niedrig: Der längste Satz bricht hier so oft um, dass die Karte nicht mehr ins
    // Fenster passte. Das Skript misst das, sobald der Abschnitt ausgelegt ist, und nimmt die
    // Bühne zurück.
    await page.setViewportSize({ width: 320, height: 580 });
    await openHome(page);
    const years = page.locator('[data-years]');
    await years.scrollIntoViewIfNeeded();
    await expect(years).not.toHaveAttribute('data-deck');
    await expect(years.locator('.moment-year')).toHaveText(YEARS);
    for (const text of await years.locator('.moment-body p').all()) {
      await expect(text).toBeVisible();
    }
    await expect(years.locator('button:visible')).toHaveCount(0);
    expect(await cutOff(page)).toEqual([]);
    // In einem grösseren Fenster ist die Bühne wieder da.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(years).toHaveAttribute('data-deck', '');
    await toYear(page, 1);
    await expect.poll(current(page)).toBe(1);
    expect((await stage(page)).position).toBe('sticky');
  });

  test('Fällt die Bühne weg, bleibt man in der Firmengeschichte', async ({ page }) => {
    // Handy gedreht, mitten auf der Bühne: Quer ist das Fenster zu niedrig, die Zeitleiste gilt.
    // Die Seite ist dann um die ganze Strecke der Bühne kürzer; ohne Vorkehrung stünde man im
    // Kontakt oder am Seitenende.
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    await toYear(page, 3);
    await expect.poll(current(page)).toBe(3);
    // Die Seite merkt sich die Ansicht, sobald das Scrollen ruht (position.ts): Daran macht das
    // Skript die Stelle fest, denn beim Drehen umbricht der Browser erst die ganze Seite neu.
    await expect
      .poll(() => page.evaluate(() => (history.state as { view?: unknown } | null)?.view ?? null))
      .not.toBeNull();
    await page.setViewportSize({ width: 844, height: 390 });
    const years = page.locator('[data-years]');
    await expect
      .poll(() =>
        years.locator('.history-stage').evaluate((element) => getComputedStyle(element).position),
      )
      .toBe('static');
    // Der Anfang der Zeitleiste steht unter dem Header.
    await expect(years.locator('.history-title')).toBeInViewport();
    await expect(years.locator('.moment-year').first()).toBeInViewport();
    // Und zurück: Hochkant ist die Bühne wieder da.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        years.locator('.history-stage').evaluate((element) => getComputedStyle(element).position),
      )
      .toBe('sticky');
  });

  test('Wo die Bühne nicht passt, landet ein Sprung zum Kontakt trotzdem richtig', async ({
    browser,
  }, testInfo) => {
    // Mit Bühne ist die Seite rund zwei Fensterhöhen länger als mit Zeitleiste. Wird die Bühne
    // erst zurückgenommen, während der Sprung schon unterwegs ist, landet er im Footer oder in
    // der Firmengeschichte (so war es, bevor die Passform beim Auslegen entschieden wurde).
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 1024, height: 500 },
    ]) {
      for (const way of ['Knopf im Hero', 'Direktlink'] as const) {
        const label = `${viewport.width}×${viewport.height}, ${way}`;
        const context = await browser.newContext({ ...testInfo.project.use, viewport });
        const page = await context.newPage();
        if (way === 'Direktlink') {
          await page.goto(`${PROD}/#kontakt`);
        } else {
          await page.goto(`${PROD}/`);
          await page.evaluate(() => document.fonts.ready);
          await page.locator('[data-hero] a[href$="#kontakt"]').first().click();
        }
        /** Abstand der Oberkante des Kontakts von der Linie unter dem Header */
        const off = () =>
          page.evaluate(() => {
            const header = Number.parseFloat(
              getComputedStyle(document.documentElement).scrollPaddingTop,
            );
            return Math.abs(
              document.querySelector('#kontakt')!.getBoundingClientRect().top - header,
            );
          });
        await expect.poll(off, { message: label, timeout: 10_000 }).toBeLessThanOrEqual(2);
        // Und die Seite bleibt dort.
        await page.waitForTimeout(600);
        expect(await off(), label).toBeLessThanOrEqual(2);
        await expect(page.locator('[data-years]'), label).not.toHaveAttribute('data-deck');
        await context.close();
      }
    }
  });

  test('Heranscrollen und direkt landen ergeben dieselbe Form', async ({ browser }, testInfo) => {
    // Beim Hereinscrollen steht der Inhalt der Bühne noch etwas tiefer (scroll.css). Eine Messung
    // über den Überlauf zählte das mit: Wer heranscrollte, bekam die Zeitleiste, wer direkt
    // landete, die Bühne. Gemessen wird darum am Layout, und zwar bevor jemand ankommt.
    for (const viewport of [
      { width: 360, height: 600 },
      { width: 768, height: 560 },
      { width: 1024, height: 700 },
      { width: 1280, height: 600 },
    ]) {
      const label = `${viewport.width}×${viewport.height}`;
      const forms: string[] = [];
      for (const way of ['herangescrollt', 'direkt'] as const) {
        const context = await browser.newContext({ ...testInfo.project.use, viewport });
        const page = await context.newPage();
        await page.goto(`${PROD}/`);
        await page.evaluate(() => document.fonts.ready);
        const years = page.locator('[data-years]');
        if (way === 'direkt') {
          await layOutAll(page);
          await years.evaluate((element) => element.scrollIntoView({ block: 'start' }));
        } else {
          // Mit dem Rad, Schritt für Schritt, bis die Firmengeschichte mitten im Fenster steht.
          await page.mouse.move(viewport.width / 2, viewport.height / 2);
          for (let step = 0; step < 400; step += 1) {
            const arrived = await years.evaluate(
              (element) => element.getBoundingClientRect().top < window.innerHeight * 0.5,
            );
            if (arrived) break;
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(40);
          }
        }
        await page.waitForTimeout(500);
        const form = await years.evaluate((root) => {
          const box = root.querySelector<HTMLElement>('.history-stage')!;
          if (getComputedStyle(box).position !== 'sticky') return 'Zeitleiste';
          // Passt die Bühne? Am Layout gemessen, ohne Verschiebungen.
          const parts = [...box.children] as HTMLElement[];
          const style = getComputedStyle(box);
          const room =
            box.clientHeight -
            Number.parseFloat(style.paddingTop) -
            Number.parseFloat(style.paddingBottom);
          const need =
            Math.max(...parts.map((part) => part.offsetTop + part.offsetHeight)) -
            Math.min(...parts.map((part) => part.offsetTop));
          return need <= room + 1 ? 'Bühne' : `Bühne, ${need - room} px zu hoch`;
        });
        expect(form, `${label}, ${way}`).toMatch(/^(Bühne|Zeitleiste)$/);
        forms.push(form);
        await context.close();
      }
      expect(forms[0], label).toBe(forms[1]);
    }
  });

  test('Schaltet die Bühne über dem Leser um, behält er seine Stelle', async ({ page }) => {
    // Im Kontakt gelesen, in einem Fenster, in das die Bühne nicht passt. Wird das Fenster höher,
    // passt sie und kommt über dem Leser dazu: Die Seite wird dort rund zwei Fensterhöhen länger.
    await page.setViewportSize({ width: 1024, height: 500 });
    await page.goto(`${PROD}/#kontakt`);
    await page.evaluate(() => document.fonts.ready);
    const years = page.locator('[data-years]');
    await expect(years).not.toHaveAttribute('data-deck');
    await page.waitForSelector('html:not([data-jump])', { state: 'attached', timeout: 10_000 });
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
    const kontakt = () =>
      page.evaluate(() =>
        Math.round(document.querySelector('#kontakt')!.getBoundingClientRect().top),
      );
    // Die Seite hat sich die Ansicht gemerkt (Kontakt, 300 px weit gelesen).
    await expect
      .poll(async () => {
        const top = await page.evaluate(
          () => (history.state as { view?: { top: number } } | null)?.view?.top ?? null,
        );
        return top !== null && top === (await kontakt());
      })
      .toBe(true);
    const before = await kontakt();
    expect(before).toBeLessThan(-100);

    await page.setViewportSize({ width: 1024, height: 700 });
    await expect(years).toHaveAttribute('data-deck', '');
    await expect.poll(async () => Math.abs((await kontakt()) - before)).toBeLessThanOrEqual(2);
    // Und wieder weg: Die Seite wird kürzer, der Leser bleibt im Kontakt.
    await page.setViewportSize({ width: 1024, height: 500 });
    await expect(years).not.toHaveAttribute('data-deck');
    await expect.poll(async () => Math.abs((await kontakt()) - before)).toBeLessThanOrEqual(2);
  });

  test('Ohne die Einheit svh im Browser bleibt die Zeitleiste', async ({ page }) => {
    // Die Bühne rechnet mit dem kleinsten Fenster (svh). Kennt ein älterer Browser die Einheit
    // nicht, fielen ihre Höhen weg: Sie gilt dort darum gar nicht.
    await page.route('**/*.css', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replaceAll('(height:100svh)', '(height:100xyz)');
      await route.fulfill({ response, body });
    });
    await openHome(page);
    const years = page.locator('[data-years]');
    await years.scrollIntoViewIfNeeded();
    expect(
      await years
        .locator('.history-stage')
        .evaluate((element) => getComputedStyle(element).position),
    ).toBe('static');
    await expect(years.locator('.moment-year')).toHaveText(YEARS);
    for (const text of await years.locator('.moment-body p').all()) {
      await expect(text).toBeVisible();
    }
    await expect(years.locator('button:visible')).toHaveCount(0);
  });

  test('Neu geladen steht wieder dasselbe Jahr da', async ({ page }) => {
    await openHome(page);
    await toYear(page, 3);
    await expect.poll(current(page)).toBe(3);
    // Die Seite merkt sich die Ansicht, sobald das Scrollen ruht (position.ts).
    await expect
      .poll(() => page.evaluate(() => (history.state as { view?: unknown } | null)?.view ?? null))
      .not.toBeNull();
    await page.reload();
    await expect(page.locator('[data-years] .yr-btn').nth(3)).toHaveAttribute(
      'aria-current',
      'step',
      { timeout: 15_000 },
    );
    await expect.poll(async () => visibleCards(await stage(page))).toEqual([3]);
  });

  test('Die Fotos der Bühne sind geladen, bevor ihre Karte steigt', async ({ page }) => {
    await openHome(page);
    // Eine Fensterhöhe vor der Firmengeschichte: Das Foto von 1983 wartet noch verborgen unter
    // dem Rahmen. Der Browser lüde es dort von sich aus nicht (loading="lazy").
    const { start } = await track(page);
    const viewport = await page.evaluate(() => window.innerHeight);
    await scrollToY(page, start - viewport * 0.8);
    const photo = page.locator('#jahr-1983 img');
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    expect(visibleCards(await stage(page))).toEqual([0]);
  });
});
