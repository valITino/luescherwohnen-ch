import { expect, test, type Page } from '@playwright/test';
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
    await page.locator('.menu-links a[href="#kontakt"]').click();
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(page).toHaveURL(/#kontakt$/);
    // Sanftes Scrollen über die ganze Seite: unter Last (parallele Browser) braucht das länger.
    await expect(page.locator('#kontakt-title')).toBeInViewport({ timeout: 15_000 });
  });

  test('Direktlink auf eine Marke landet auf dem Ziel', async ({ page }) => {
    await page.goto(`${PROD}/#ueber`);
    await expect(page.locator('#ueber-title')).toBeInViewport({ timeout: 10_000 });
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
  });

  test('Auftritte beim Hereinscrollen: am Ende wartet nichts mehr', async ({ page }) => {
    await page.goto(`${PROD}/`);
    await layOutAll(page);
    await page.mouse.wheel(0, 200);
    await expect(page.locator('html')).toHaveAttribute('data-scroll', 'ready', {
      timeout: 15_000,
    });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1200);
    expect(await page.locator('[data-enter="wait"]').count()).toBe(0);
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
