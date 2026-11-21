import type { AddressInfo } from 'node:net';
import { expect, test, type Page } from '@playwright/test';
import { serve } from '../scripts/serve.mjs';
import {
  PAGES,
  PREVIEW,
  PROD,
  brokenWords,
  collectErrors,
  cutOff,
  horizontalOverflow,
  imageCollisions,
  layOutAll,
} from './helpers.ts';

/** Startseite, alle Teile sofort ausgelegt (für Prüfungen der ganzen Seite) */
async function openHome(page: Page, origin = PROD, hash = '') {
  await page.goto(`${origin}/${hash}`);
  await page.evaluate(() => document.fonts.ready);
  await layOutAll(page);
}

/** Zwei Bilder abwarten: Bis dahin hat jeder IntersectionObserver gemeldet, was er sieht. */
async function nextFrames(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Nach einem Sprung zu einer Marke: Das Ziel steht fertig da. Nichts ist in Zeilen geteilt, der
 * Kicker ist offen, kein Auftritt läuft noch an, und nichts im Bild wartet auf seinen Auftritt.
 * (Was im Ziel weiter unten ausserhalb des Bildes liegt, darf seinen Auftritt noch haben.)
 */
async function expectLanded(page: Page, target: string) {
  // Smooth Scroll und Auftritte sind eingerichtet, der Sprung ist zu Ende.
  await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', { timeout: 15_000 });
  await page.waitForSelector('html:not([data-jump])', { state: 'attached', timeout: 5_000 });
  await nextFrames(page);
  const state = await page.locator(target).evaluate((section) => {
    const inView = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };
    return {
      masks: section.querySelectorAll('.ln-mask').length,
      waiting: [...section.querySelectorAll('[data-enter="wait"]')]
        .filter(inView)
        .map((element) => element.className),
      kicker: getComputedStyle(section.querySelector('.section-head .kicker')!).clipPath,
      // Nur Auftritte (CSS-Animationen): Ein Hover-Übergang unter dem ruhenden Zeiger zählt nicht.
      running: section
        .getAnimations({ subtree: true })
        .filter(
          (animation) => animation instanceof CSSAnimation && animation.playState === 'running',
        )
        .map((animation) => (animation as CSSAnimation).animationName),
    };
  });
  expect(state).toEqual({ masks: 0, waiting: [], kicker: 'none', running: [] });
}

test.describe('Startseite', () => {
  for (const [label, origin] of [
    ['Produktion', PROD],
    ['Vorschau', PREVIEW],
  ] as const) {
    test(`lädt ohne Fehler und ohne horizontales Scrollen (${label})`, async ({ page }) => {
      const errors = collectErrors(page);
      await openHome(page, origin);
      await expect(page.locator('h1')).toHaveText(
        /Wohnen heisst leben\.\s+Und sich\s+wohl fühlen\./i,
      );
      expect(await horizontalOverflow(page)).toBe(0);
      // Alle Sektionen der Navigation sind da und haben eine Überschrift.
      for (const id of ['sortiment', 'service', 'aktuell', 'ueber', 'kontakt']) {
        await expect(page.locator(`#${id} h2`).first()).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }

  test('Sortiment: alle Bereiche aus dem Briefing (WEB-F-002)', async ({ page }) => {
    await openHome(page);
    const titles = await page.locator('#sortiment h3').allTextContents();
    for (const area of [
      'Möbel',
      'Polstermöbel',
      'Betten',
      'Bodenbeläge',
      'Teppiche',
      'Vorhänge',
      'Beleuchtung',
    ]) {
      expect(titles.join(' | '), area).toContain(area);
    }
  });

  test('Service: Innenarchitektur, Beratung vor Ort, Lieferung und Montage (WEB-F-003)', async ({
    page,
  }) => {
    await openHome(page);
    const text = (await page.locator('#service').textContent()) ?? '';
    expect(text).toContain('Innenarchitekten');
    expect(text).toContain('bei Ihnen zu Hause');
    expect(text).toContain('liefern und montieren');
  });

  test('Bilder: alle haben einen Alternativtext und werden geladen', async ({ page }) => {
    await openHome(page, PREVIEW);
    const images = page.locator('main img');
    const count = await images.count();
    expect(count).toBeGreaterThan(10);
    for (let index = 0; index < count; index += 1) {
      const image = images.nth(index);
      expect(await image.getAttribute('alt'), `Bild ${index}`).not.toBeNull();
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
    }
  });

  test('Projekte erscheinen nur in der Vorschau (WEB-F-006)', async ({ page }) => {
    await openHome(page, PROD);
    await expect(page.locator('#projekte')).toHaveCount(0);
    await openHome(page, PREVIEW);
    await expect(page.locator('#projekte h2')).toBeVisible();
  });
});

test.describe('Layout', () => {
  const WIDTHS = [320, 360, 390, 768, 1024, 1280, 1440, 1920];

  for (const path of PAGES) {
    test(`nichts ragt über den Rand, kein Wort bricht um: ${path}`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(`${PREVIEW}${path}`);
      await page.evaluate(() => document.fonts.ready);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await layOutAll(page);
        expect(await horizontalOverflow(page), `${width}px`).toBe(0);
        expect(await cutOff(page), `${width}px`).toEqual([]);
        expect(await brokenWords(page), `${width}px`).toEqual([]);
        expect(await imageCollisions(page), `${width}px`).toEqual([]);
      }
      await context.close();
    });
  }

  test('Porträt: Das Foto reicht bis zum Bildtext, Ecken und Linie liegen darauf', async ({
    page,
  }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    const box = await page.locator('.portrait-frame').evaluate((frame) => {
      const rect = (selector: string) => frame.querySelector(selector)!.getBoundingClientRect();
      const photo = rect('img');
      return {
        photo: { top: photo.top, bottom: photo.bottom, height: photo.height },
        caption: rect('.portrait-caption').top,
        corners: [rect('.portrait-corner-tl').top, rect('.portrait-corner-br').bottom],
        scan: parseFloat(getComputedStyle(frame, '::after').height),
      };
    });
    // Kein leeres Band zwischen Foto und Bildtext (am Desktop ist der Rahmen so hoch wie die
    // Spalte daneben).
    expect(Math.abs(box.caption - box.photo.bottom)).toBeLessThanOrEqual(1);
    // Die Ecken des Suchers sitzen innen auf dem Foto, die Linie ist so hoch wie das Foto.
    expect(box.corners[0]! - box.photo.top).toBeGreaterThan(0);
    expect(box.photo.bottom - box.corners[1]!).toBeGreaterThan(0);
    expect(box.photo.bottom - box.corners[1]!).toBeLessThan(40);
    expect(Math.abs(box.scan - box.photo.height)).toBeLessThanOrEqual(1);
  });

  test('Vorschau-Hinweis passt auf jede Breite', async ({ page }) => {
    await page.goto(`${PREVIEW}/`);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      const clipped = await page.$$eval('[data-preview-note] .preview-text', (spans) =>
        spans
          .filter((span) => span.getClientRects().length > 0)
          .map((span) => span.scrollWidth - span.clientWidth),
      );
      expect(clipped, `${width}px`).toEqual([0]);
    }
  });

  test('angepinnte Flächen passen in niedrige Fenster', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 650 },
      { width: 1280, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`${PROD}/`);
      const orb = await page.locator('.hero-orb').boundingBox();
      expect(orb, JSON.stringify(viewport)).not.toBeNull();
      expect(orb!.y).toBeGreaterThanOrEqual(0);
      expect(orb!.y + orb!.height).toBeLessThanOrEqual(viewport.height);
    }
  });
});

test.describe('Navigation', () => {
  test('Menü: öffnet, hält den Fokus, schliesst mit Esc', async ({ page, isMobile }) => {
    await page.goto(`${PROD}/`);
    if (!isMobile) {
      // Auf dem Desktop gibt es den Menü-Knopf erst in der Kapsel.
      await page.mouse.wheel(0, 600);
      await expect(page.locator('[data-header]')).toHaveClass(/is-scrolled/);
    }
    const toggle = page.locator('[data-menu-toggle]');
    await toggle.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-menu-label]')).toHaveText('Schliessen');
    // Fokus bleibt im Header, auch nach vielen Tabs.
    for (let index = 0; index < 20; index += 1) await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-header]') !== null),
    ).toBe(true);
    // Der Rest der Seite ist solange nicht bedienbar.
    expect(await page.locator('main').evaluate((main) => (main as HTMLElement).inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('Menü bei reduzierter Bewegung: sofort offen und zu', async ({ browser }, testInfo) => {
    // Schmal, damit der Menü-Knopf auch im Desktop-Projekt ohne Scrollen da ist
    const context = await browser.newContext({
      ...testInfo.project.use,
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${PROD}/impressum`);
    const menu = page.locator('#mobile-menu');
    await page.locator('[data-menu-toggle]').click();
    // Direkt nach dem Klick: Vorhang ganz offen, kein Auftritt mit Dauer (base.css kürzt alle).
    const state = await menu.evaluate((element) => ({
      clip: getComputedStyle(element).clipPath,
      waiting: element
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation.playState !== 'finished' &&
            Number(animation.effect?.getComputedTiming().endTime) >= 1,
        )
        .map((animation) =>
          'animationName' in animation
            ? (animation as CSSAnimation).animationName
            : (animation as CSSTransition).transitionProperty,
        ),
    }));
    expect(state).toEqual({ clip: 'inset(0px)', waiting: [] });
    await expect(page.locator('.menu-links a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    // Kein Vorhang, der noch hochfährt: Das Menü ist im nächsten Bild weg.
    await expect(menu).toBeHidden({ timeout: 100 });
    await expect(page.locator('[data-menu-toggle]')).toBeFocused();
    await context.close();
  });

  test('Menüpunkt springt zur Sektion und schliesst das Menü', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await page.mouse.wheel(0, 600);
    await page.locator('[data-menu-toggle]').click();
    // Festhalten, ob unterwegs eine Überschrift geteilt wird oder ein Auftritt beginnt: Beides
    // soll ein Sprung überspringen (auch an Stellen, deren Auftritt bei der Ankunft schon vorbei
    // wäre).
    await page.locator('main').evaluate((main) => {
      new MutationObserver((records) => {
        for (const record of records) {
          const target = record.target as HTMLElement;
          if (record.type === 'attributes' && target.dataset.enter === 'in') {
            document.documentElement.dataset.testEntered = target.className;
          }
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches('.ln-mask')) {
              document.documentElement.dataset.testEntered = 'ln-mask';
            }
          }
        }
      }).observe(main, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-enter'],
      });
    });
    await page.locator('.menu-links a[href="#kontakt"]').click();
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(page).toHaveURL(/#kontakt$/);
    // Sanftes Scrollen über die ganze Seite: unter Last (parallele Browser) braucht das länger.
    await expect(page.locator('#kontakt-title')).toBeInViewport({ timeout: 15_000 });
    await expectLanded(page, '#kontakt');
    await expect(page.locator('html')).not.toHaveAttribute('data-test-entered');
  });

  test('Direktlink auf eine Marke landet auf dem Ziel', async ({ page }) => {
    await page.goto(`${PROD}/#ueber`);
    await expect(page.locator('#ueber-title')).toBeInViewport({ timeout: 10_000 });
    await expectLanded(page, '#ueber');
  });

  test('Sprung aus dem Hero: Der Header wird ohne Umbau zur Kapsel', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator('[data-header]');
    // Festhalten, ob der Header unterwegs abtaucht: Ein Sprung kommt an, statt zu scrollen.
    await header.evaluate((element) => {
      new MutationObserver(() => {
        if (element.classList.contains('is-morphing')) element.dataset.testMorphed = '';
      }).observe(element, { attributes: true, attributeFilter: ['class'] });
    });
    await page.locator('[data-hero] a[href="#sortiment"]').click();
    await expect(page).toHaveURL(/#sortiment$/);
    await expect(page.locator('#sortiment-title')).toBeInViewport({ timeout: 15_000 });
    await expectLanded(page, '#sortiment');
    await expect(header).toHaveClass(/is-scrolled/);
    await expect(header).not.toHaveAttribute('data-test-morphed');
  });

  test('Sprung aus der Leiste landet genau unter dem Header', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Die Navigation in der Leiste gibt es nur am Desktop');
    // Bei 1280 px Breite läge ein Fehler deutlich daneben (gemessen 35 px), bei 1440 px nur 3 px.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    // Unterwegs darf die Seite oberhalb des Ziels nicht mehr wachsen (etwa der Öffnungsstatus,
    // der erst beim Vorbeiscrollen erschiene): Sonst endete das Gleiten zu tief.
    await page.locator('.bar-nav a[href="#sortiment"]').click();
    await expect(page).toHaveURL(/#sortiment$/);
    await expectLanded(page, '#sortiment');
    const offset = await page.evaluate(() => {
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      return document.querySelector('#sortiment')!.getBoundingClientRect().top - padding;
    });
    expect(Math.abs(offset)).toBeLessThanOrEqual(2);
  });

  test('Seitenwechsel zu einer Marke: Der Header wird nicht verzerrt', async ({
    browser,
    isMobile,
  }) => {
    test.skip(isMobile, 'Die Navigation in der Leiste gibt es nur am Desktop');
    // Mit den Cache-Regeln der Produktion: Bei no-store überspringt Chromium den Übergang oft.
    const server = await serve({ dir: 'apps/web/dist', port: 0, quiet: true, production: true });
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    // Auf jeder neuen Seite festhalten, welche Teile der Übergang für Leiste und Kapsel hat.
    await page.addInitScript(() => {
      // Meldet die Seite ihren pagereveal-Zuhörer erst danach an, kam ihr Skript zu spät, um die
      // Form vor dem ersten Bild einzustellen. Das entscheidet der Browser (header.ts): Ein
      // solcher Versuch zählt nicht.
      let revealed = false;
      window.addEventListener('pagereveal', () => (revealed = true));
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (
        this: EventTarget,
        ...args: Parameters<typeof add>
      ) {
        if (this === window && args[0] === 'pagereveal' && revealed) {
          document.documentElement.dataset.testLate = '';
        }
        return add.apply(this, args);
      };
      window.addEventListener('pagereveal', (event) => {
        const transition = (event as PageRevealEvent).viewTransition;
        if (!transition) return;
        transition.ready.then(
          () => {
            const parts = (name: string) =>
              document
                .getAnimations()
                .map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement)
                .filter((pseudo) => pseudo?.includes(name))
                .join(' ') || 'none';
            document.documentElement.dataset.testBar = parts('site-bar');
            document.documentElement.dataset.testCapsule = parts('site-capsule');
            document.documentElement.dataset.testTypes = [...transition.types].join(' ');
            document.documentElement.dataset.testNamed = String(
              getComputedStyle(document.querySelector('[data-header] .bar')!).viewTransitionName ===
                'site-bar',
            );
          },
          // Übersprungen: Dann gibt es nichts festzuhalten.
          () => undefined,
        );
      });
    });
    const html = page.locator('html');
    /*
     * Ein Wechsel mit Übergang; Chromium lässt ihn gelegentlich aus, dann noch einmal. `script`:
     * Das Ergebnis hängt davon ab, dass die neue Seite ihre Form vor dem ersten Bild einstellt.
     * `scrolled`: Die alte Seite steht weiter unten, ihr Header ist die Kapsel.
     */
    const change = async (
      from: string,
      link: string,
      url: RegExp,
      { script = false, scrolled = false } = {},
    ) => {
      for (let attempt = 0; attempt < 6; attempt++) {
        await page.goto(`${origin}${from}`);
        await page.evaluate(() => document.fonts.ready);
        if (scrolled) {
          await page.mouse.wheel(0, 600);
          await expect(page.locator('[data-header]')).toHaveClass(/is-scrolled/);
          await page.waitForTimeout(700);
        }
        await page.locator(link).first().click();
        await expect(page).toHaveURL(url);
        await page.waitForLoadState('load');
        await page.waitForTimeout(600);
        if (script && (await html.getAttribute('data-test-late')) !== null) continue;
        const parts = await html.getAttribute('data-test-bar');
        if (parts !== null) return parts;
      }
      return null;
    };
    try {
      // Oben von Seite zu Seite: Die Leiste steht still. Alte und neue Leiste bilden ein Paar (die
      // Gruppe), und überblendet wird nicht: Weder die alte noch die neue Leiste hat eine
      // Animation (eine neue Leiste ohne Partner blendete ein).
      const still = await change('/impressum', '[data-header] .bar-logo', /\/$/);
      expect(still, 'Übergang hat stattgefunden').not.toBeNull();
      expect(still).toContain('::view-transition-group(site-bar)');
      expect(still).not.toContain('::view-transition-old(site-bar)');
      expect(still).not.toContain('::view-transition-new(site-bar)');
      // Zu einer Marke: Die neue Seite steht weiter unten (Kapsel). Die alte Leiste geht mit der
      // alten Seite; nichts zieht die Kapsel auf die Breite der Leiste. Die Kapsel steht schon
      // beim ersten Bild der neuen Seite und kommt mit ihr, statt dass oben kurz die Leiste
      // erscheint.
      const toMark = await change('/impressum', '.bar-nav a[href="/#kontakt"]', /#kontakt$/, {
        script: true,
      });
      expect(toMark, 'Übergang hat stattgefunden').toBe('none');
      expect(await html.getAttribute('data-test-named')).toBe('false');
      // Ohne alte Kapsel kommt die neue mit ihrer Seite.
      expect(await html.getAttribute('data-test-capsule')).toContain(
        '::view-transition-new(site-capsule)',
      );

      // Von Kapsel zu Kapsel: Beide bilden ein Paar und stehen, keine blendet aus oder ein.
      const capsule = await change('/impressum', '.bar-cta', /#kontakt$/, {
        script: true,
        scrolled: true,
      });
      expect(capsule, 'Übergang hat stattgefunden').toBe('none');
      const pair = await html.getAttribute('data-test-capsule');
      expect(pair).toContain('::view-transition-group(site-capsule)');
      expect(pair).not.toContain('::view-transition-old(site-capsule)');
      expect(pair).not.toContain('::view-transition-new(site-capsule)');

      // Zurück zu einer Seite, die oben beginnt: Ihre Leiste steht sofort (Übergangstyp «stand»),
      // statt über der weichenden alten einzublenden.
      let back: string | null = null;
      for (let attempt = 0; attempt < 6 && back === null; attempt++) {
        await page.goto(`${origin}/impressum`);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('[data-header] .bar-logo').first().click();
        await expect(page).toHaveURL(/\/$/);
        await page.waitForLoadState('load');
        await page.waitForTimeout(600);
        await page.evaluate(() => history.back());
        await expect(page).toHaveURL(/\/impressum$/);
        await page.waitForTimeout(600);
        if ((await html.getAttribute('data-test-late')) !== null) continue;
        back = await html.getAttribute('data-test-bar');
      }
      expect(back, 'Übergang hat stattgefunden').not.toBeNull();
      expect(await html.getAttribute('data-test-types')).toContain('stand');
      expect(await html.getAttribute('data-test-named')).toBe('true');
      expect(back).not.toContain('::view-transition-new(site-bar)');

      // Ohne Navigation API (pageswap ohne activation, kein navigation.activation) gilt die
      // sichere Annahme: Die alte Leiste geht mit der alten Seite, auch ohne bekanntes Ziel.
      // Beginnt die neue Seite oben, steht ihre Leiste sofort (wie zurück und vor).
      await page.addInitScript(() => {
        Object.defineProperty(PageSwapEvent.prototype, 'activation', { get: () => null });
        if ('navigation' in window) {
          Object.defineProperty(Object.getPrototypeOf(window.navigation), 'activation', {
            get: () => null,
          });
        }
      });
      const blind = await change('/impressum', '.bar-nav a[href="/#kontakt"]', /#kontakt$/);
      expect(blind, 'Übergang hat stattgefunden').not.toBeNull();
      expect(blind).not.toContain('::view-transition-old(site-bar)');
      expect(blind).not.toContain('::view-transition-group(site-bar)');
      const blindTop = await change('/impressum', '[data-header] .bar-logo', /\/$/, {
        script: true,
      });
      expect(blindTop, 'Übergang hat stattgefunden').toBe('none');
      expect(await html.getAttribute('data-test-types')).toContain('stand');
    } finally {
      await context.close();
      server.close();
    }
  });

  test('Interne Links der Vorschau führen nie ins Leere (Basis-Pfad)', async ({
    page,
    request,
  }) => {
    await openHome(page, PREVIEW);
    const hrefs = await page.$$eval('a[href]', (links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
    const internal = [
      ...new Set(
        hrefs
          .filter((href) => href.startsWith('http://127.0.0.1:4322/'))
          .map((href) => href.split('#')[0]!),
      ),
    ];
    expect(internal.length).toBeGreaterThan(3);
    for (const href of internal) {
      expect(href, href).toContain('/luescherwohnen-ch/');
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });

  test('Skip-Link führt zum Inhalt', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Tastatur');
    await page.goto(`${PROD}/impressum`);
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#inhalt$/);
  });
});

test.describe('Öffnungszeiten', () => {
  test('zeigt «geöffnet bis» während der Zeiten', async ({ page }) => {
    // Dienstag, 24. November 2026, 11:00 in Baden
    await page.clock.setFixedTime(new Date('2026-11-24T11:00:00+01:00'));
    await page.goto(`${PROD}/`);
    await page.locator('.visit').scrollIntoViewIfNeeded();
    await expect(page.locator('.visit [data-open-status-text]')).toHaveText('Geöffnet bis 18:30');
  });

  test('zeigt am Montag die nächste Öffnung', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T11:00:00+01:00'));
    await page.goto(`${PROD}/`);
    await page.locator('.visit').scrollIntoViewIfNeeded();
    await expect(page.locator('.visit [data-open-status-text]')).toHaveText(
      'Geschlossen · öffnet morgen 10:00',
    );
  });

  test('ohne JavaScript bleibt die Tabelle, der Status fehlt', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${PROD}/`);
    await expect(page.locator('.visit-hours li')).toHaveCount(4);
    await expect(page.locator('.visit [data-open-status]')).toBeHidden();
    await context.close();
  });
});

test.describe('Kontakt', () => {
  test('Produktion: ohne Empfänger kein Formular, dafür direkte Wege', async ({ page }) => {
    await openHome(page, PROD);
    await expect(page.locator('[data-contact]')).toHaveCount(0);
    await expect(page.locator('#kontakt a[href="tel:+41562227852"]').first()).toBeVisible();
    await expect(
      page.locator('#kontakt a[href="mailto:info@luescherwohnen.ch"]').first(),
    ).toBeVisible();
  });

  test('Vorschau: Inline-Validierung, dann simulierter Versand ohne Netz', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') requests.push(request.url());
    });
    await openHome(page, PREVIEW, '#kontakt');
    const form = page.locator('[data-contact]');
    await form.locator('[data-submit]').click();
    await expect(page.locator('#kontakt-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#kontakt-name')).toBeFocused();
    await expect(page.locator('[data-error-for="email"]')).toContainText('E-Mail');
    await expect(page.locator('[data-error-for="datenschutz"]')).toBeVisible();

    // Synthetische Testdaten
    await page.fill('#kontakt-name', 'Erika Muster');
    await page.fill('#kontakt-email', 'erika@beispiel.ch');
    await page.locator('label.chip', { hasText: 'Beratung bei mir zu Hause' }).click();
    await page.fill('#kontakt-nachricht', 'Wir suchen ein neues Sofa für das Wohnzimmer.');
    await page.locator('#kontakt-datenschutz').check();
    await expect(page.locator('#kontakt-name')).not.toHaveAttribute('aria-invalid');
    await form.locator('[data-submit]').click();
    await expect(page.locator('[data-form-success]')).toBeVisible();
    await expect(page.locator('[data-form-success]')).toBeFocused();
    expect(requests).toEqual([]);
    expect(page.url()).not.toContain('erika');
  });

  test('Formular sendet nie per GET: keine Eingaben in der Adresse', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${PREVIEW}/`);
    await expect(page.locator('[data-contact]')).toHaveAttribute('method', 'post');
    await context.close();
  });
});

test.describe('Bewegung und Chrome', () => {
  test('Band: «Band anhalten» hält an, «Band fortsetzen» läuft weiter', async ({ page }) => {
    await openHome(page);
    const ticker = page.locator('[data-ticker]');
    const toggle = ticker.locator('[data-ticker-toggle]');
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    await expect(ticker).toHaveClass(/is-paused/);
    await expect(toggle).toHaveText(/Band fortsetzen/);
    await toggle.click();
    await expect(ticker).not.toHaveClass(/is-paused/);
    await page.mouse.move(0, 0);
    await page.locator('.kicker').first().focus();
    const state = await ticker
      .locator('.ticker-row')
      .first()
      .evaluate((row) => getComputedStyle(row).animationPlayState);
    expect(state).toBe('running');
  });

  test('Reduzierte Bewegung: nichts wartet, kein sanftes Scrollen, Band steht', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${PROD}/`);
    // Der Auftakt im Hero steht sofort: höchstens Animationen ohne Dauer (base.css), keine läuft.
    const heroMotion = await page.locator('[data-hero]').evaluate((hero) =>
      hero
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation.playState !== 'finished' &&
            Number(animation.effect?.getComputedTiming().endTime) >= 1,
        )
        .map((animation) => (animation as CSSAnimation).animationName),
    );
    expect(heroMotion).toEqual([]);
    await layOutAll(page);
    await page.mouse.wheel(0, 3000);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready');
    expect(await page.locator('[data-enter="wait"]').count()).toBe(0);
    expect(await page.locator('html.lenis').count()).toBe(0);
    const animation = await page
      .locator('.ticker-row')
      .first()
      .evaluate((row) => getComputedStyle(row).animationName);
    expect(animation).toBe('none');
    await context.close();
  });

  test('Hero: Foto und Lead vom ersten Bild an sichtbar', async ({ page }) => {
    await page.goto(`${PROD}/`);
    const hero = page.locator('[data-hero]');
    const first = await hero.evaluate((root) => {
      const photo = root.querySelector('.hero-photo')!;
      const lead = root.querySelector('.hero-lead')!;
      const animated = (element: Element) =>
        element.getAnimations().map((animation) => ({
          name: (animation as CSSAnimation).animationName,
          properties: (animation.effect as KeyframeEffect)
            .getKeyframes()
            .flatMap((frame) => Object.keys(frame)),
        }));
      return {
        photo: getComputedStyle(photo).opacity,
        photoAnimations: animated(photo).map(({ name }) => name),
        lead: getComputedStyle(lead).opacity,
        leadProperties: animated(lead).flatMap(({ properties }) => properties),
      };
    });
    // Die Blende öffnet das Foto, ohne es je zu verbergen (LCP).
    expect(first.photo).toBe('1');
    expect(first.photoAnimations).toContain('hero-aperture');
    // Fliesstext blendet nie ein: Der Lead rückt höchstens nach.
    expect(first.lead).toBe('1');
    expect(first.leadProperties).not.toContain('opacity');
  });

  test('Hero: nach 1,5 s ruht alles', async ({ page }) => {
    await page.goto(`${PROD}/`);
    const hero = page.locator('[data-hero]');
    // Jeder Auftritt im Hero ist endlich und endet spätestens 1,5 s nach seinem Start.
    const timings = await hero.evaluate((root) =>
      root.getAnimations({ subtree: true }).map((animation) => ({
        name: (animation as CSSAnimation).animationName,
        end: Number(animation.effect?.getComputedTiming().endTime),
      })),
    );
    expect(timings.length).toBeGreaterThan(0);
    for (const { name, end } of timings) expect(end, name).toBeLessThanOrEqual(1500);
    // Gemessen ab dem Start des Auftakts auf der Zeitachse des Dokuments, nicht ab dem Laden:
    // So prüft der Test die Choreografie und hängt nicht davon ab, wie schnell die Seite lädt.
    const start = await hero.evaluate(async (root) => {
      const animations = root.getAnimations({ subtree: true });
      await Promise.all(animations.map((animation) => animation.ready));
      return Math.min(...animations.map((animation) => Number(animation.startTime)));
    });
    await page.waitForFunction((at) => Number(document.timeline.currentTime) >= at, start + 1500);
    const running = await hero.evaluate((root) =>
      root
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running')
        .map((animation) => (animation as CSSAnimation).animationName),
    );
    expect(running).toEqual([]);
  });

  test('Kapsel: nach dem Wechsel voll sichtbar', async ({ page }) => {
    await page.goto(`${PROD}/`);
    const header = page.locator('[data-header]');
    // Festhalten, dass die Leiste wirklich den animierten Weg nimmt (Abtauchen, dann Wechsel).
    await header.evaluate((element) => {
      new MutationObserver(() => {
        if (element.classList.contains('is-morphing')) element.dataset.testMorphed = '';
      }).observe(element, { attributes: true, attributeFilter: ['class'] });
    });
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveClass(/is-scrolled/);
    await expect(header).toHaveAttribute('data-test-morphed', '');
    // Gewartet wird auf den echten Zustand, nicht auf eine feste Zeit: Der Wechsel ist fertig,
    // wenn an Leiste und Fläche nichts mehr läuft (nach Plan gut 0,6 s, hier höchstens 3 s).
    await page.waitForFunction(
      () => {
        const element = document.querySelector('[data-header]')!;
        return (
          !element.matches('.is-morphing, .is-swapping') &&
          element.querySelector('.bar')!.getAnimations({ subtree: true }).length === 0
        );
      },
      null,
      { timeout: 3000 },
    );
    const state = await header.locator('.bar').evaluate((bar) => {
      const shown = (element: Element) => getComputedStyle(element).display !== 'none';
      const parts = [...bar.children, ...bar.querySelector('.bar-actions')!.children].filter(shown);
      return {
        bar: getComputedStyle(bar).opacity,
        parts: parts.map((element) => getComputedStyle(element).opacity),
        surface: getComputedStyle(bar, '::before').clipPath,
        surfaceOpacity: getComputedStyle(bar, '::before').opacity,
        shadowOpacity: getComputedStyle(bar, '::after').opacity,
      };
    });
    expect(state.bar).toBe('1');
    expect(state.parts.length).toBeGreaterThan(1);
    for (const opacity of state.parts) expect(opacity).toBe('1');
    expect(state.surface).toMatch(/inset\(0px round/);
    expect(state.surfaceOpacity).toBe('1');
    expect(state.shadowOpacity).toBe('1');
    // Milchglas: Die Kapsel trägt keinen Namen für den Seitenwechsel. Mit Namen grenzt Chromium
    // die Unschärfe der Fläche (::before) auf die Kapsel selbst ab, das Glas bliebe klar.
    const glass = await header.locator('.bar').evaluate((bar) => ({
      name: getComputedStyle(bar).viewTransitionName,
      blur: getComputedStyle(bar, '::before').backdropFilter,
    }));
    expect(glass.name).toBe('none');
    expect(glass.blur).toContain('blur');
  });

  test('Tastatur: Der Fokus bleibt beim Formwechsel im Header', async ({ page, isMobile }) => {
    await page.goto(`${PROD}/`);
    await page.mouse.wheel(0, 600);
    const header = page.locator('[data-header]');
    await expect(header).toHaveClass(/is-scrolled/);
    const settled = () =>
      page.waitForFunction(
        () => {
          const element = document.querySelector('[data-header]')!;
          return (
            !element.matches('.is-morphing, .is-swapping') &&
            element.querySelector('.bar')!.getAnimations({ subtree: true }).length === 0
          );
        },
        null,
        { timeout: 3000 },
      );
    await settled();
    // Ein Knopf, den es nur in der Kapsel gibt: am Desktop das Menü, am Handy «Beratung anfragen».
    const start = header.locator(isMobile ? '.bar-cta' : '[data-menu-toggle]');
    await start.focus();
    await expect(start).toBeFocused();
    expect(await start.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    // Solange der Header abtaucht, bleibt der fokussierte Knopf ganz sichtbar.
    await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>('[data-header]')!;
      const focused = document.activeElement!;
      let lowest = 1;
      const sample = () => {
        if (header.classList.contains('is-morphing')) {
          let value = 1;
          for (
            let node: Element | null = focused;
            node && node !== header;
            node = node.parentElement
          ) {
            value *= Number(getComputedStyle(node).opacity);
          }
          lowest = Math.min(lowest, value);
          header.dataset.testLowest = String(lowest);
        }
        if (header.classList.contains('is-scrolled')) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.keyboard.press('Home');
    await expect(header).not.toHaveClass(/is-scrolled/);
    await settled();
    expect(Number(await header.getAttribute('data-test-lowest'))).toBeGreaterThan(0.99);
    // Oben gibt es den Knopf nicht: Der Fokus ist auf ein sichtbares Gegenstück im Header
    // gewandert, statt auf <body> zu fallen, und der Fokusring bleibt.
    const state = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        inHeader: Boolean(active?.closest('[data-header]')),
        visible: Boolean(active?.checkVisibility()),
        ring: Boolean(active?.matches(':focus-visible')),
      };
    });
    expect(state).toEqual({ inHeader: true, visible: true, ring: true });
  });

  test('Tastatur: Ein Link der Navigation taucht nicht ab, Tab geht in der Kapsel weiter', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Die Navigation in der Leiste gibt es nur am Desktop');
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator('[data-header]');
    const link = header.locator('.bar-nav a').first();
    await link.focus();
    expect(await link.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>('[data-header]')!;
      const focused = document.activeElement!;
      let lowest = 1;
      const sample = () => {
        if (header.classList.contains('is-morphing') && document.activeElement === focused) {
          let value = 1;
          for (
            let node: Element | null = focused;
            node && node !== header;
            node = node.parentElement
          ) {
            value *= Number(getComputedStyle(node).opacity);
          }
          lowest = Math.min(lowest, value);
          header.dataset.testLowest = String(lowest);
        }
        if (!header.classList.contains('is-scrolled')) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.keyboard.press('PageDown');
    await expect(header).toHaveClass(/is-scrolled/);
    // Solange der Header abtaucht, bleibt der fokussierte Link ganz sichtbar.
    expect(Number(await header.getAttribute('data-test-lowest'))).toBeGreaterThan(0.99);
    // In der Kapsel gibt es die Navigation nicht: Der Fokus geht zum nächsten Bedienelement der
    // Leiste (Anrufen), steht sofort ganz da, und Tab führt weiter durch die Kapsel.
    const after = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      let opacity = 1;
      for (
        let node: Element | null = active;
        node && !node.matches('[data-header]');
        node = node.parentElement
      ) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      return {
        phone: active.matches('.bar-phone'),
        ring: active.matches(':focus-visible'),
        swapping: document.querySelector('[data-header]')!.matches('.is-swapping'),
        opacity,
        transition: [
          getComputedStyle(active).transitionProperty,
          getComputedStyle(active).transitionDuration,
        ],
      };
    });
    expect(after.phone).toBe(true);
    expect(after.ring).toBe(true);
    if (!after.swapping) expect(after.opacity).toBeGreaterThan(0.99);
    // Sofort stehen nur Deckkraft und Lage; die Farben beim Hover gleiten weiter.
    const [properties, durations] = after.transition.map((list) => list.split(', '));
    // Ist die Liste der Dauern kürzer, wiederholt CSS sie (wie hier nachgebildet).
    const duration = (property: string) => {
      const index = properties!.indexOf(property);
      expect(index, `${property} gleitet überhaupt`).toBeGreaterThanOrEqual(0);
      return parseFloat(durations![index % durations!.length]!);
    };
    expect(duration('opacity')).toBe(0);
    expect(duration('transform')).toBe(0);
    expect(duration('border-color')).toBeGreaterThan(0);
    expect(duration('background-color')).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('.bar-actions') !== null),
    ).toBe(true);
  });

  test('Ohne checkVisibility (Safari vor 17.4): Der Header wechselt trotzdem die Form', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      delete (Element.prototype as Partial<Element>).checkVisibility;
    });
    await page.goto(`${PROD}/`);
    expect(await page.evaluate(() => 'checkVisibility' in Element.prototype)).toBe(false);
    const header = page.locator('[data-header]');
    for (const [top, scrolled] of [
      [800, true],
      [0, false],
      [1600, true],
    ] as const) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
      if (scrolled) await expect(header).toHaveClass(/is-scrolled/);
      else await expect(header).not.toHaveClass(/is-scrolled/);
    }
    expect(errors).toEqual([]);
  });

  test('Leertaste auf einem Knopf hält das Ausgleiten nicht an', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Am Handy gleitet nichts aus (kein Lenis)');
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const start = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(120);
    // Den Knopf des Bands fokussieren, ohne dorthin zu scrollen, und mit der Leertaste auslösen.
    await page.evaluate(() =>
      document.querySelector<HTMLElement>('[data-ticker-toggle]')!.focus({ preventScroll: true }),
    );
    await page.keyboard.press('Space');
    await expect(page.locator('[data-ticker-toggle]')).toHaveText(/Band fortsetzen/);
    // Die Seite gleitet trotzdem bis ans Ziel des Mausrads.
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(start + 1490);
  });

  test('Auftritte beim Hereinscrollen: am Ende wartet nichts mehr', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    const main = page.locator('main');
    // Endliche Animationen in main: Name und Ende samt Verzögerung (ms ab ihrem Start)
    const finite = () =>
      main.evaluate((root) =>
        root
          .getAnimations({ subtree: true })
          .map((animation) => ({
            name: (animation as CSSAnimation).animationName,
            end: Number(animation.effect?.getComputedTiming().endTime),
          }))
          .filter(({ end }) => Number.isFinite(end)),
      );
    const seen: { name: string; end: number }[] = [];
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
      seen.push(...(await finite()));
    }
    // Gewartet wird auf den echten Zustand: Kein endlicher Auftritt läuft mehr (nur das Band
    // läuft endlos weiter), und keine Überschrift ist mehr in Zeilen geteilt.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('main .ln-mask').length === 0 &&
        document
          .querySelector('main')!
          .getAnimations({ subtree: true })
          .every(
            (animation) =>
              animation.playState !== 'running' ||
              !Number.isFinite(Number(animation.effect?.getComputedTiming().endTime)),
          ),
      null,
      { timeout: 5_000 },
    );
    expect(await page.locator('[data-enter="wait"]').count()).toBe(0);
    // Auftritte gab es wirklich (auch die Bilder), und jeder endet spätestens nach 1410 ms: Die
    // Linie im Sucher endet nach 1250 ms, Bilder nach 800 ms plus höchstens drei Versätze von 70 ms.
    expect(seen.map(({ name }) => name)).toContain('unveil');
    for (const { name, end } of seen) expect(end, name).toBeLessThanOrEqual(1200 + 3 * 70);
  });

  test('Überschriften: Beim Auftritt dieselben Zeilen wie danach', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    await layOutAll(page);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main h2.display[id]')]
        .filter((title) => title.getBoundingClientRect().top > window.innerHeight)
        .map((title) => title.id),
    );
    expect(ids).toContain('ueber-title');
    for (const id of ids) {
      // Zeilen, wie der Browser die Überschrift ohne Teilung setzt (Zeichen nach Unterkante).
      const natural = await page.evaluate((key) => {
        const title = document.getElementById(key)!;
        const range = document.createRange();
        const lines: string[] = [];
        let last = Number.NEGATIVE_INFINITY;
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node as Text;
          for (let at = 0; at < text.data.length; at++) {
            const char = text.data[at]!;
            if (/\s|\u00AD/.test(char)) {
              if (lines.length) lines[lines.length - 1] += char === '\u00AD' ? '' : ' ';
              continue;
            }
            range.setStart(text, at);
            range.setEnd(text, at + 1);
            const bottom = range.getBoundingClientRect().bottom;
            if (bottom > last + 1) lines.push('');
            last = Math.max(last, bottom);
            lines[lines.length - 1] += char;
          }
        }
        return lines.map((line) => line.replace(/\s+/g, ' ').trim());
      }, id);
      const title = page.locator(`#${id}`);
      const name = await title.evaluate((element) =>
        (element.textContent ?? '')
          .replace(/\u00AD/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      );
      await title.evaluate((element) =>
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6,
          behavior: 'instant',
        }),
      );
      await expect(title.locator('.ln').first()).toBeAttached({ timeout: 2_000 });
      const split = await title.evaluate((element) =>
        [...element.querySelectorAll('.ln')].map((line) =>
          (line.textContent ?? '')
            .replace(/\u00AD/g, '')
            .replace(/-$/, '')
            .replace(/\s+/g, ' ')
            .trim(),
        ),
      );
      expect(split, id).toEqual(natural.map((line) => line.replace(/-$/, '')));
      // Screenreader hören den Namen ohne den sichtbar gesetzten Trennstrich.
      expect(await title.getAttribute('aria-label'), id).toBe(name);
      // Danach ist das Markup wieder wie vorher: kein Umbruch und kein Strich bleibt zurück.
      await expect(title.locator('.ln')).toHaveCount(0, { timeout: 3_000 });
      expect(await title.locator('br').count(), id).toBe(0);
    }
    expect(await page.locator('#ueber-title').textContent()).toContain('Familien\u00ADunternehmen');
  });

  test('Bilder laden vor ihrem Auftritt (loading="lazy")', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    // Ein Bild weit unten (Aktuell), das auf seinen Auftritt wartet. Allmählich hinscrollen wie
    // beim Lesen, bis es gut 600 px unter dem unteren Rand steht: Dort lädt der Browser Bilder mit
    // loading="lazy" schon vor. Ein ganz beschnittenes Bild lüde er erst im Bild (ein Sprung
    // dagegen lädt es auch so).
    const media = await page
      .locator('.story-media.enter-unveil[data-enter="wait"]')
      .first()
      .elementHandle();
    expect(media).not.toBeNull();
    const below = () =>
      media!.evaluate((element) => element.getBoundingClientRect().top - window.innerHeight);
    for (let step = 0; step < 300; step++) {
      const distance = await below();
      if (distance < 640) break;
      await page.mouse.wheel(0, Math.min(150, Math.max(20, (distance - 600) / 2)));
      await page.waitForTimeout(30);
    }
    await page.waitForFunction(
      (element) => {
        const image = element.querySelector('img')!;
        return image.complete && image.naturalWidth > 0;
      },
      media!,
      { timeout: 5_000 },
    );
    expect(await below()).toBeGreaterThan(0);
    expect(await media!.evaluate((element) => (element as HTMLElement).dataset.enter)).toBe('wait');
  });

  test('Bilder öffnen sich ab einem Viertel, am Rand nach kurzer Zeit', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    const frame = await page
      .locator('.story-media.enter-unveil[data-enter="wait"]')
      .first()
      .elementHandle();
    expect(frame).not.toBeNull();
    // Rahmen so stellen, dass ein Anteil davon über der Auslösekante steht (8 % über dem Rand).
    const showShare = (share: number) =>
      frame!.evaluate((element, wanted) => {
        const rect = element.getBoundingClientRect();
        const edge = window.innerHeight * 0.92;
        window.scrollTo({
          top: window.scrollY + rect.top - edge + rect.height * wanted,
          behavior: 'instant',
        });
      }, share);
    // Erst knapp darunter vorladen lassen, damit es um den Auslöser geht, nicht ums Laden.
    await showShare(-0.5);
    await page.waitForFunction((element) => element.querySelector('img')!.complete, frame!, {
      timeout: 5_000,
    });
    // Festhalten, wie lange nach dem Hinstellen das Bild sich öffnet (im Browser gemessen).
    await frame!.evaluate((element) => {
      new MutationObserver(() => {
        const frame = element as HTMLElement;
        if (frame.dataset.enter !== 'in' || frame.dataset.testAfter) return;
        frame.dataset.testAfter = String(
          performance.now() - Number(document.documentElement.dataset.testShown),
        );
      }).observe(element, { attributes: true, attributeFilter: ['data-enter'] });
    });
    // Ein Zehntel im Bild: Das Bild wartet noch.
    await page.evaluate(() => {
      document.documentElement.dataset.testShown = String(performance.now());
    });
    await showShare(0.1);
    await nextFrames(page);
    expect(await frame!.evaluate((element) => (element as HTMLElement).dataset.enter)).toBe('wait');
    // Bleibt der Rahmen dort stehen, öffnet sich das Bild nach kurzer Zeit trotzdem: nach einer
    // Viertelsekunde, nicht später (länger stünde der Rahmen nur leer da).
    await page.waitForFunction(
      (element) => (element as HTMLElement).dataset.enter === 'in',
      frame!,
      { timeout: 3_000 },
    );
    expect(Number(await frame!.getAttribute('data-test-after'))).toBeLessThan(600);
    // Ein zweites Bild weiter unten: Ab gut einem Viertel öffnet es sich sofort.
    const next = await page.evaluateHandle(
      () =>
        [...document.querySelectorAll<HTMLElement>('.enter-unveil[data-enter="wait"]')].find(
          (element) => element.getBoundingClientRect().top > window.innerHeight + 100,
        ) ?? null,
    );
    const second = next.asElement();
    expect(second).not.toBeNull();
    const place = (share: number) =>
      second!.evaluate((element, wanted) => {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - window.innerHeight * 0.92 + rect.height * wanted,
          behavior: 'instant',
        });
      }, share);
    await place(-0.5);
    await page.waitForFunction((element) => element.querySelector('img')!.complete, second!, {
      timeout: 5_000,
    });
    await place(0.5);
    await page.waitForFunction(
      (element) => (element as HTMLElement).dataset.enter === 'in',
      second!,
      { timeout: 500 },
    );
  });

  test('Hohe Rahmen: Das Porträt öffnet sich, bevor ein Viertel davon im Bild ist', async ({
    page,
  }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    const frame = page.locator('.portrait-frame.enter-unveil');
    await expect(frame).toHaveAttribute('data-enter', 'wait');
    // So stellen, dass `seen` Pixel über der Auslösekante stehen (8 % über dem Rand).
    const show = (seen: number) =>
      frame.evaluate((element, pixels) => {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - window.innerHeight * 0.92 + pixels,
          behavior: 'instant',
        });
      }, seen);
    await show(-400);
    await page.waitForFunction(
      () => document.querySelector<HTMLImageElement>('.portrait-frame img')!.complete,
      null,
      { timeout: 5_000 },
    );
    // Gut ein Achtel der Fensterhöhe im Bild, weniger als ein Viertel des Rahmens: Das Bild öffnet
    // sich sofort, ohne die Wartezeit am Rand (eine Viertelsekunde).
    const share = await frame.evaluate((element) => {
      const seen = window.innerHeight * 0.14;
      return { seen, quarter: element.getBoundingClientRect().height / 4 };
    });
    expect(share.seen).toBeLessThan(share.quarter);
    const after = await frame.evaluate(
      (element, seen) =>
        new Promise<number>((resolve) => {
          const start = performance.now();
          new MutationObserver(() => {
            if ((element as HTMLElement).dataset.enter === 'in') resolve(performance.now() - start);
          }).observe(element, { attributes: true, attributeFilter: ['data-enter'] });
          const rect = element.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight * 0.92 + seen,
            behavior: 'instant',
          });
        }),
      share.seen,
    );
    expect(after).toBeLessThan(200);
  });

  test('Langsames Netz: Ein Bild, das noch lädt, steigt nicht über einen leeren Rahmen', async ({
    page,
  }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    // Ab jetzt kommen Bilder erst nach 2,5 s an.
    await page.route(/\.(avif|webp|jpe?g|png)(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue().catch(() => undefined);
    });
    const frame = await page
      .locator(
        '.project-media.enter-unveil[data-enter="wait"], .story-media.enter-unveil[data-enter="wait"]',
      )
      .last()
      .elementHandle();
    expect(frame).not.toBeNull();
    expect(await frame!.evaluate((element) => element.querySelector('img')!.complete)).toBe(false);
    // Festhalten, ob der Rahmen je «in» bekommt, solange das Bild fehlt, und wie das Bild
    // erscheint, wenn es spät kommt.
    await frame!.evaluate((element) => {
      new MutationObserver(() => {
        const image = element.querySelector('img')!;
        const state = (element as HTMLElement).dataset.enter;
        if (state === 'in' && !image.complete) {
          document.documentElement.dataset.testRoseEmpty = '';
        }
        if (state === 'loaded') {
          document.documentElement.dataset.testLate = image
            .getAnimations()
            .map((animation) => (animation as CSSAnimation).animationName)
            .join(' ');
        }
      }).observe(element, { attributes: true, attributeFilter: ['data-enter'] });
    });
    // Sprunghaft halb ins Bild (wie schnelles Wischen).
    await frame!.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - window.innerHeight * 0.92 + rect.height * 0.5,
        behavior: 'instant',
      });
    });
    // Nach kurzem Warten verzichtet das Bild auf seinen Auftritt («late»). Der Rahmen bleibt
    // leer, statt bis zum Bild die Farbe zu wechseln.
    await page.waitForFunction(
      (element) => (element as HTMLElement).dataset.enter === 'late',
      frame!,
      { timeout: 2_000 },
    );
    const look = () =>
      frame!.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        image: getComputedStyle(element.querySelector('img')!).opacity,
        loaded: element.querySelector('img')!.complete,
      }));
    expect(await look()).toEqual({ background: 'rgba(0, 0, 0, 0)', image: '0', loaded: false });
    // Ist es da, blendet es ein (nur die Deckkraft) und steht dann ganz.
    await page.waitForFunction(
      (element) => (element as HTMLElement).dataset.enter === 'loaded',
      frame!,
      { timeout: 6_000 },
    );
    await expect(page.locator('html')).toHaveAttribute('data-test-late', 'unveil-late');
    await expect.poll(look).toEqual({ background: 'rgba(0, 0, 0, 0)', image: '1', loaded: true });
    await expect(page.locator('html')).not.toHaveAttribute('data-test-rose-empty');
    // Anhalten und Fortsetzen: Auch das spät eingeblendete Foto blendet nicht nochmals ein.
    await expect
      .poll(() =>
        frame!.evaluate((element) => element.querySelector('img')!.getAnimations().length),
      )
      .toBe(0);
    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    await nextFrames(page);
    expect(
      await frame!.evaluate((element) => ({
        state: (element as HTMLElement).dataset.enter,
        animations: element.querySelector('img')!.getAnimations().length,
        image: getComputedStyle(element.querySelector('img')!).opacity,
      })),
    ).toEqual({ state: '', animations: 0, image: '1' });
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('Hängt ein Foto, zeigt der Rahmen nach einer Weile wieder seine Fläche', async ({
    page,
  }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    // Ab jetzt kommt kein Bild mehr an (das Netz hängt).
    await page.route(/\.(avif|webp|jpe?g|png)(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 20_000));
      await route.continue().catch(() => undefined);
    });
    const frame = await page
      .locator('.story-media.enter-unveil[data-enter="wait"]')
      .last()
      .elementHandle();
    expect(frame).not.toBeNull();
    expect(await frame!.evaluate((element) => element.querySelector('img')!.complete)).toBe(false);
    await frame!.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - window.innerHeight * 0.92 + rect.height * 0.5,
        behavior: 'instant',
      });
    });
    await page.waitForFunction(
      (element) => (element as HTMLElement).dataset.enter === 'late',
      frame!,
      { timeout: 2_000 },
    );
    // Drei Sekunden später steht der Rahmen wie ohne Auftritt da: mit seiner Sandfläche.
    await page.waitForFunction((element) => (element as HTMLElement).dataset.enter === '', frame!, {
      timeout: 5_000,
    });
    expect(await frame!.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('Bleibt ein Rahmen am unteren Rand stehen, öffnet er sich trotzdem', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    const frame = await page
      .locator('.story-media.enter-unveil[data-enter="wait"]')
      .first()
      .elementHandle();
    expect(frame).not.toBeNull();
    // `seen` Pixel vom Rahmen im Fenster, gemessen am unteren Rand.
    const show = (seen: number) =>
      frame!.evaluate((element, pixels) => {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - window.innerHeight + pixels,
          behavior: 'instant',
        });
      }, seen);
    await show(-400);
    await page.waitForFunction((element) => element.querySelector('img')!.complete, frame!, {
      timeout: 5_000,
    });
    // 40 px im Bild, also unter der Auslösekante (8 % über dem Rand): Der Rahmen wartet, solange
    // gescrollt wird, und öffnet sich nach einer kurzen Ruhe.
    const after = await frame!.evaluate(
      (element) =>
        new Promise<number>((resolve) => {
          const start = performance.now();
          new MutationObserver(() => {
            if ((element as HTMLElement).dataset.enter === 'in') resolve(performance.now() - start);
          }).observe(element, { attributes: true, attributeFilter: ['data-enter'] });
          const rect = element.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight + 40,
            behavior: 'instant',
          });
        }),
    );
    expect(after).toBeGreaterThan(200);
    expect(after).toBeLessThan(900);
  });

  test('Bilder steigen an der Fensterkante auf, nicht darunter', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    const frame = await page
      .locator('.story-media.enter-unveil[data-enter="wait"]')
      .first()
      .elementHandle();
    expect(frame).not.toBeNull();
    const place = (share: number) =>
      frame!.evaluate((element, wanted) => {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - window.innerHeight * 0.92 + rect.height * wanted,
          behavior: 'instant',
        });
      }, share);
    await place(-0.5);
    await page.waitForFunction((element) => element.querySelector('img')!.complete, frame!, {
      timeout: 5_000,
    });
    // Gut ein Drittel im Bild: Der Auftritt beginnt sofort. Im ersten Bild der Enthüllung steht
    // die sichtbare Kante des Ausschnitts (mit Zoom) am unteren Fensterrand, nicht tiefer.
    const start = await frame!.evaluate(
      (element) =>
        new Promise<{ edge: number; fold: number; bottom: number }>((resolve) => {
          const image = element.querySelector('img')!;
          new MutationObserver((_, observer) => {
            if ((element as HTMLElement).dataset.enter !== 'in') return;
            observer.disconnect();
            requestAnimationFrame(() => {
              const unveil = image
                .getAnimations()
                .find((animation) => (animation as CSSAnimation).animationName === 'unveil')!;
              unveil.pause();
              unveil.currentTime = 0;
              const rect = image.getBoundingClientRect();
              const inset = parseFloat(getComputedStyle(image).clipPath.slice('inset('.length));
              unveil.play();
              resolve({
                edge: rect.top + (inset / 100) * rect.height,
                fold: window.innerHeight,
                bottom: rect.bottom,
              });
            });
          }).observe(element, { attributes: true, attributeFilter: ['data-enter'] });
          const rect = element.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight * 0.92 + rect.height * 0.35,
            behavior: 'instant',
          });
        }),
    );
    expect(start.bottom).toBeGreaterThan(start.fold);
    expect(Math.abs(start.edge - start.fold)).toBeLessThanOrEqual(2);
    // Danach ist das Markup wieder wie zuvor.
    await page.waitForFunction(
      (element) => element.querySelector('img')!.getAnimations().length === 0,
      frame!,
      { timeout: 3_000 },
    );
    expect(await frame!.getAttribute('style')).toBeNull();
  });

  test('Bewegung pausiert: nichts wartet', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    // Erst die Auftritte scharf machen: Smooth Scroll und Scroll-Animationen sind geladen, und
    // was unter dem Bild liegt, wartet auf seinen Auftritt.
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    expect(await page.locator('[data-enter="wait"]').count()).toBeGreaterThan(0);

    const toggle = page.locator('[data-motion-toggle]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    // Sofort: Nichts wartet mehr, keine Überschrift ist geteilt.
    expect(await page.locator('[data-enter="wait"]').count()).toBe(0);
    expect(await page.locator('.ln-mask').count()).toBe(0);

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await nextFrames(page);
      expect(await page.locator('[data-enter="wait"]').count(), `bei ${y} px`).toBe(0);
      expect(await page.locator('.ln-mask').count(), `bei ${y} px`).toBe(0);
    }
  });

  test('Bewegung pausiert: Header und Menü wechseln ohne Übergang', async ({ page }) => {
    await page.goto(`${PROD}/`);
    const toggle = page.locator('[data-motion-toggle]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    // Am Handy steht der Schalter im Seitenfluss, der Klick hat dorthin gescrollt: zurück nach oben.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const header = page.locator('[data-header]');
    await expect(header).not.toHaveClass(/is-scrolled/);
    await header.evaluate((element) => {
      new MutationObserver(() => {
        if (element.classList.contains('is-morphing')) element.dataset.testMorphed = '';
        if (element.classList.contains('is-scrolled')) element.dataset.testScrolled = '';
      }).observe(element, { attributes: true, attributeFilter: ['class'] });
    });
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-scrolled/);
    // Der Wechsel geschah unter Beobachtung, aber ohne Abtauchen.
    await expect(header).toHaveAttribute('data-test-scrolled', '');
    await expect(header).not.toHaveAttribute('data-test-morphed');
    // Fläche und Schatten der Kapsel stehen sofort, statt sich aufzufalten.
    const glass = await header
      .locator('.bar')
      .evaluate((bar) => [
        bar.getAnimations({ subtree: true }).length,
        getComputedStyle(bar, '::before').opacity,
      ]);
    expect(glass).toEqual([0, '1']);
    // Das Menü ist sofort offen, ohne Vorhang.
    await page.locator('[data-menu-toggle]').click();
    const menu = await page
      .locator('[data-menu]')
      .evaluate((element) => [element.getAnimations().length, getComputedStyle(element).clipPath]);
    expect(menu).toEqual([0, 'inset(0px)']);
  });

  test('Bewegung pausiert: kein sanftes Scrollen, nichts hängt am Scrollen', async ({
    page,
    isMobile,
  }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    // Am Desktop gleitet Lenis, bis jemand pausiert (am Handy scrollt ohnehin der Browser).
    expect(await page.locator('html.lenis').count()).toBe(isMobile ? 0 : 1);
    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    expect(await page.locator('html.lenis').count()).toBe(0);

    // Ein Sprung ist sofort am Ziel, statt durch die Seite zu gleiten.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator('[data-hero] a[href="#sortiment"]').click();
    await nextFrames(page);
    const landed = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(landed);
    expect(landed).toBeGreaterThan(300);

    // Der Hero hängt nicht am Scrollen.
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await nextFrames(page);
    const hero = page.locator('[data-hero]');
    expect(await hero.evaluate((root) => root.style.getPropertyValue('--hero-p'))).toBe('');

    // Die Haltung steht in voller Deckkraft, auch mitten auf ihrer Strecke.
    const statement = page.locator('[data-reveal-words]').first();
    const midway = () =>
      statement.evaluate((element) =>
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.75,
          behavior: 'instant',
        }),
      );
    const dimmed = () =>
      statement.evaluate(
        (element) =>
          [...element.querySelectorAll<HTMLElement>('.word')].filter(
            (word) => Number(getComputedStyle(word).opacity) < 1,
          ).length,
      );
    await midway();
    await nextFrames(page);
    expect(await statement.locator('.word').count()).toBeGreaterThan(3);
    expect(await dimmed()).toBe(0);

    // Fortsetzen: Am Desktop gleitet es wieder, und die Wörter der Haltung werden wieder hell.
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    expect(await page.locator('html.lenis').count()).toBe(isMobile ? 0 : 1);
    await midway();
    await expect.poll(dimmed).toBeGreaterThan(0);
  });

  test('Bewegung pausiert mitten im Sprung: Er kommt trotzdem an', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Die Navigation in der Leiste gibt es nur am Desktop');
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    await page.locator('.bar-nav a[href="#kontakt"]').click();
    await page.waitForTimeout(200);
    // Noch unterwegs: Lenis gleitet gut anderthalb Sekunden durch die Seite.
    const midway = await page.evaluate(() => window.scrollY);
    const goal = await page.evaluate(
      () => document.querySelector('#kontakt')!.getBoundingClientRect().top + window.scrollY,
    );
    expect(goal - midway).toBeGreaterThan(1000);
    await page.locator('[data-motion-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await nextFrames(page);
    const offset = await page.evaluate(() => {
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      return document.querySelector('#kontakt')!.getBoundingClientRect().top - padding;
    });
    expect(Math.abs(offset)).toBeLessThanOrEqual(2);
  });

  test('Bewegung pausiert: Der Hero hält nicht mehr an, die Ansicht bleibt', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Angepinnt wird der Hero nur auf grossen Bildschirmen');
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    const hero = page.locator('[data-hero]');
    await expect(hero).toHaveAttribute('data-pinned', '');
    const toggle = page.locator('[data-motion-toggle]');
    const anchor = page.locator('#sortiment');
    const top = () => anchor.evaluate((element) => element.getBoundingClientRect().top);
    const bringUp = async () => {
      await anchor.evaluate((element) =>
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.scrollY - 200,
          behavior: 'instant',
        }),
      );
      await nextFrames(page);
      return top();
    };
    // Anhalten mitten auf der Seite: Der Hero gibt sein Anpinnen auf, was im Bild ist, bleibt.
    const before = await bringUp();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(hero).not.toHaveAttribute('data-pinned');
    expect(Math.abs((await top()) - before)).toBeLessThanOrEqual(1);
    // Ganz oben bewegt schon das erste Scrollen den Inhalt (keine stille Strecke).
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    const title = page.locator('#hero-title');
    const start = await title.evaluate((element) => element.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
    await nextFrames(page);
    const moved = start - (await title.evaluate((element) => element.getBoundingClientRect().top));
    expect(Math.abs(moved - 100)).toBeLessThanOrEqual(1);
    // Fortsetzen: wieder angepinnt, und wieder bleibt die Ansicht, wo sie ist.
    const again = await bringUp();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    await expect(hero).toHaveAttribute('data-pinned', '');
    expect(Math.abs((await top()) - again)).toBeLessThanOrEqual(1);
  });

  test('Fortsetzen im Hero: Die erste Zeile gleitet an ihren Platz, statt zu springen', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Angepinnt wird der Hero nur auf grossen Bildschirmen');
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    // Angehalten ein Stück in den Hero scrollen, dann fortsetzen: Die Ansicht bleibt, man steht
    // damit am Ende der angepinnten Strecke, wo die erste Zeile halb zurückgetreten ist.
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
    await nextFrames(page);
    const samples = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const line = document.querySelector('.q1')!;
          const values: number[] = [];
          const sample = () => {
            values.push(Number(getComputedStyle(line).opacity));
            if (values.length < 40) requestAnimationFrame(sample);
            else resolve(values);
          };
          document.querySelector<HTMLElement>('[data-motion-toggle]')!.click();
          requestAnimationFrame(sample);
        }),
    );
    // Kein Sprung in einem Bild: Die Deckkraft sinkt über mehrere Bilder und kommt bei der
    // Hälfte an.
    expect(samples[0]).toBeGreaterThan(0.85);
    for (let index = 1; index < samples.length; index++) {
      expect(samples[index - 1]! - samples[index]!).toBeLessThan(0.2);
    }
    expect(samples.at(-1)).toBeCloseTo(0.5, 1);
  });

  test('Rad übernimmt einen Sprung: Anhalten lässt die Seite, wo sie ist', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Die Navigation in der Leiste gibt es nur am Desktop');
    await page.goto(`${PROD}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.wheel(0, 10);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await nextFrames(page);
    await page.locator('.bar-nav a[href="#kontakt"]').click();
    await page.waitForTimeout(250);
    // Mitten im Gleiten übernimmt das Rad (nach oben), kurz danach hält jemand die Bewegung an.
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(120);
    const before = await page.evaluate(() => window.scrollY);
    await page.locator('[data-motion-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await nextFrames(page);
    // Die Seite springt nicht gegen das Rad zur Marke. (Der Hero gibt sein Anpinnen auf, die
    // Ansicht bleibt dabei; gemessen wird darum am Ziel, nicht an der Scrollposition.)
    const offset = await page.evaluate(() => {
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      return document.querySelector('#kontakt')!.getBoundingClientRect().top - padding;
    });
    expect(before).toBeGreaterThan(0);
    expect(Math.abs(offset)).toBeGreaterThan(300);
  });

  test('Anhalten und Fortsetzen: Der Auftakt spielt nicht weiter', async ({ page }) => {
    await page.goto(`${PROD}/`);
    // Zehnmal langsamer: So läuft der Auftakt sicher noch, wenn der Schalter erscheint.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
    const hero = page.locator('[data-hero]');
    const running = () =>
      hero.evaluate((root) =>
        root
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running')
          .map((animation) => (animation as CSSAnimation).animationName),
      );
    const toggle = page.locator('[data-motion-toggle]');
    await expect(toggle).toBeVisible();
    expect((await running()).length, 'Der Auftakt läuft noch').toBeGreaterThan(0);

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    await nextFrames(page);
    // Nach dem Fortsetzen steht der Hero fertig da und baut sich nicht nochmals auf.
    expect(await running()).toEqual([]);
    const state = await hero.evaluate((root) => ({
      photo: getComputedStyle(root.querySelector('.hero-photo')!).clipPath,
      lines: [...root.querySelectorAll('.mask-line')].map(
        (line) => getComputedStyle(line).transform,
      ),
      actions: getComputedStyle(root.querySelector('.hero-actions')!).opacity,
    }));
    expect(state.photo).toBe('none');
    for (const transform of state.lines) expect(transform).toBe('none');
    expect(state.actions).toBe('1');
  });

  test('Anhalten und Fortsetzen: Fertige Bilder öffnen sich nicht nochmals', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    await nextFrames(page);
    // Ein Bild, das noch wartet, ins Bild holen und seinen Auftritt ganz abwarten.
    const media = await page.locator('.enter-unveil[data-enter="wait"]').first().elementHandle();
    expect(media).not.toBeNull();
    await media!.evaluate((element) =>
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 200),
    );
    await page.waitForFunction(
      (element) =>
        (element as HTMLElement).dataset.enter === 'in' &&
        element.getAnimations({ subtree: true }).every((a) => a.playState !== 'running'),
      media!,
      { timeout: 5_000 },
    );

    const toggle = page.locator('[data-motion-toggle]');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    await nextFrames(page);
    const after = await media!.evaluate((element) => ({
      running: element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running').length,
      clip: getComputedStyle(element.querySelector('img')!).clipPath,
    }));
    expect(after.running).toBe(0);
    expect(after.clip).toBe('none');
  });

  test('Cookie-Hinweis öffnet und schliesst sich', async ({ page }) => {
    await page.goto(`${PROD}/impressum`);
    await page.locator('.chrome-btn').click();
    await expect(page.locator('#cookie-note')).toBeVisible();
    await expect(page.locator('#cookie-note')).toContainText('keine Cookies');
    await page.locator('#cookie-note button').click();
    await expect(page.locator('#cookie-note')).toBeHidden();
  });

  test('keine Cookies, kein Web-Speicher', async ({ page, context }) => {
    await openHome(page, PREVIEW);
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(500);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });
});

test.describe('Unterseiten', () => {
  test('Impressum: Angaben aus dem bisherigen Impressum', async ({ page }) => {
    await page.goto(`${PROD}/impressum`);
    const text = (await page.locator('main').textContent()) ?? '';
    for (const fact of [
      'Lüscher Wohnen AG',
      'Weite Gasse 9',
      '5400',
      'Baden',
      '+41 56 222 78 52',
      'info@luescherwohnen.ch',
      'Michael Längle',
      'Kantons Aargau',
      'CHE 116.367.369',
    ]) {
      expect(text, fact).toContain(fact);
    }
    // Beim Seitenwechsel steht der Header still: Seine Leiste wird als eigene Ebene übergeben
    // (View Transition, global.css) statt mit der Seite überblendet.
    const transitionName = await page
      .locator('[data-header] .bar')
      .evaluate((bar) => getComputedStyle(bar).viewTransitionName);
    expect(transitionName).toBe('site-bar');
  });

  test('Impressum und Datenschutz sind ohne JavaScript erreichbar (WEB-F-005)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${PROD}/`);
    await page.locator('footer a', { hasText: 'Impressum' }).click();
    await expect(page.locator('h1')).toHaveText('Impressum');
    await page.locator('footer a', { hasText: 'Datenschutz' }).click();
    await expect(page.locator('h1')).toContainText('Datenschutz');
    await context.close();
  });

  test('unbekannte Adresse: 404 mit Weg zurück', async ({ page }) => {
    const response = await page.goto(`${PROD}/gibt-es-nicht`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('404');
    await page.locator('main a', { hasText: 'Zur Startseite' }).click();
    await expect(page).toHaveURL(`${PROD}/`);
  });
});
