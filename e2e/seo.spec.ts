import { expect, test } from '@playwright/test';
import { PREVIEW, PROD } from './helpers.ts';

/**
 * Regeln für Suchmaschinen (docs/DESIGN.md, Abschnitt 8), geprüft am rohen HTML. Das HTML ist
 * für alle Geräte gleich: Diese Datei läuft darum einmal, im eigenen Projekt «html» ohne Gerät
 * (playwright.config.ts).
 */

const INDEXED = ['/', '/impressum', '/datenschutz'] as const;
const HIDDEN = ['/404', '/styleguide'] as const;

const meta = async (html: string, name: string) =>
  new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`).exec(html)?.[1];

test.describe('Produktion', () => {
  for (const path of INDEXED) {
    test(`im Index, eigener Titel, absolutes Canonical: ${path}`, async ({ request }) => {
      const html = await (await request.get(`${PROD}${path}`)).text();
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1] ?? '';
      expect(title).toMatch(/ – Lüscher Wohnen$/);
      expect(title).not.toMatch(/TODO/);
      const description = (await meta(html, 'description')) ?? '';
      expect(description.length).toBeGreaterThan(50);
      expect(description.length).toBeLessThanOrEqual(170);
      expect(await meta(html, 'robots')).toMatch(/^index, follow/);
      const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
      expect(canonical).toBe(`https://luescherwohnen.ch${path}`);
      expect(await meta(html, 'og:image')).toBe('https://luescherwohnen.ch/og/luescher.png');
      expect(html).toContain('<html lang="de-CH"');
    });
  }

  for (const path of HIDDEN) {
    test(`noindex ohne Canonical und ohne strukturierte Daten: ${path}`, async ({ request }) => {
      const html = await (await request.get(`${PROD}${path}`)).text();
      expect(await meta(html, 'robots')).toBe('noindex, nofollow');
      expect(html).not.toContain('rel="canonical"');
      expect(html).not.toContain('application/ld+json');
    });
  }

  test('Startseite: Organisation und Geschäft mit belegten Angaben (JSON-LD)', async ({
    request,
  }) => {
    const html = await (await request.get(`${PROD}/`)).text();
    const raw = /<script type="application\/ld\+json">(.+?)<\/script>/.exec(html)?.[1];
    expect(raw).toBeDefined();
    const data = JSON.parse(raw!) as { '@graph': Record<string, unknown>[] };
    // Das Geschäft trägt zwei Typen (Möbel, dazu Vorhänge, Teppiche und Leuchten).
    const types = data['@graph'].flatMap((node) => node['@type'] as string | string[]);
    expect(types).toEqual(
      expect.arrayContaining([
        'Organization',
        'FurnitureStore',
        'HomeGoodsStore',
        'WebSite',
        'WebPage',
      ]),
    );
    const store = data['@graph'].find((node) =>
      ([] as unknown[]).concat(node['@type']).includes('FurnitureStore'),
    )!;
    expect(store.address).toMatchObject({ addressRegion: 'AG' });
    expect(String(store.hasMap)).toContain('openstreetmap.org');
    expect(store.telephone).toBe('+41562227852');
    expect(store.address).toMatchObject({
      streetAddress: 'Weite Gasse 9',
      postalCode: '5400',
      addressLocality: 'Baden',
      addressCountry: 'CH',
    });
    const hours = store.openingHoursSpecification as {
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }[];
    expect(hours.flatMap((entry) => entry.dayOfWeek)).not.toContain('Monday');
    expect(hours.flatMap((entry) => entry.dayOfWeek)).not.toContain('Sunday');
    // Samstag 9:00 bis 16:00 Uhr, Dienstag bis Freitag 10:00 bis 18:30 Uhr (wie auf der Seite).
    expect(hours.find((entry) => entry.dayOfWeek.includes('Saturday'))).toMatchObject({
      opens: '09:00',
      closes: '16:00',
    });
    expect(hours.find((entry) => entry.dayOfWeek.includes('Tuesday'))).toMatchObject({
      opens: '10:00',
      closes: '18:30',
    });
    // Keine Bewertungen, keine Preise
    expect(raw).not.toMatch(/aggregateRating|review|price/i);
  });

  test('robots.txt erlaubt alles und nennt die Sitemap', async ({ request }) => {
    // Nur die Regeln, die Suchmaschinen auswerten: kein Kommentar, kein Crawl-delay, kein Host.
    const text = await (await request.get(`${PROD}/robots.txt`)).text();
    expect(text).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://luescherwohnen.ch/sitemap-index.xml\n',
    );
  });

  test('Sitemap: nur Seiten im Index', async ({ request }) => {
    const xml = await (await request.get(`${PROD}/sitemap-0.xml`)).text();
    for (const path of INDEXED) expect(xml).toContain(`https://luescherwohnen.ch${path}`);
    expect(xml).not.toContain('styleguide');
    expect(xml).not.toContain('404');
  });

  test('Startseite: Angebot und Ort in Titel, Beschreibung und H1', async ({ request }) => {
    const html = await (await request.get(`${PROD}/`)).text();
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1] ?? '';
    // Passt ganz in den Treffer (rund 60 Zeichen), die Marke am Ende.
    expect(title).toBe('Möbel, Betten und Innenarchitektur in Baden – Lüscher Wohnen');
    expect(title.length).toBeLessThanOrEqual(60);
    const description = (await meta(html, 'description')) ?? '';
    for (const word of ['Möbel', 'Betten', 'Bodenbeläge', 'Teppiche', 'Vorhänge', 'Baden']) {
      expect(description).toContain(word);
    }
    expect(description.length).toBeLessThanOrEqual(140);
    const h1 = (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? '').replace(/<[^>]+>/g, ' ');
    expect(h1.replace(/\s+/g, ' ')).toContain('Inneneinrichtung in Baden seit 1946');
    // Der Linktext des Logos ist der alt-Text des Bildes.
    expect(html).toMatch(/<img[^>]+alt="Lüscher Wohnen, zur Startseite"/);
  });

  test('Zoomen bleibt auf jeder Seite erlaubt (WCAG 1.4.4), auch auf dem Handy', async ({
    request,
  }) => {
    for (const path of [...INDEXED, ...HIDDEN]) {
      const html = await (await request.get(`${PROD}${path}`)).text();
      const viewport = await meta(html, 'viewport');
      expect(viewport, path).toBe('width=device-width, initial-scale=1');
      expect(html, path).not.toMatch(/maximum-scale|user-scalable/);
    }
  });

  test('security.txt nach RFC 9116', async ({ request }) => {
    const text = await (await request.get(`${PROD}/.well-known/security.txt`)).text();
    expect(text).toMatch(/^Contact: mailto:/m);
    const expires = /^Expires: (.+)$/m.exec(text)?.[1];
    expect(new Date(expires!).getTime()).toBeGreaterThan(Date.now());
    expect(text).toContain('Canonical: https://luescherwohnen.ch/.well-known/security.txt');
  });
});

test.describe('Vorschau (GitHub Pages)', () => {
  for (const path of [...INDEXED, ...HIDDEN]) {
    test(`alles noindex, kein Canonical, Hinweis sichtbar: ${path}`, async ({ page, request }) => {
      const html = await (await request.get(`${PREVIEW}${path}`)).text();
      expect(await meta(html, 'robots')).toBe('noindex, nofollow');
      expect(html).not.toContain('rel="canonical"');
      expect(html).not.toContain('application/ld+json');
      await page.goto(`${PREVIEW}${path}`);
      await expect(page.locator('[data-preview-note]')).toBeVisible();
    });
  }

  test('robots.txt sperrt alles', async ({ request }) => {
    const text = await (await request.get(`${PREVIEW}/robots.txt`)).text();
    expect(text).toContain('Disallow: /');
  });

  test('Favicons und Vorschaubild liegen unter dem Basis-Pfad', async ({ request }) => {
    const html = await (await request.get(`${PREVIEW}/`)).text();
    for (const file of ['favicon.ico', 'favicon.svg', 'icon-192.png', 'apple-touch-icon.png']) {
      expect(html).toContain(`/luescherwohnen-ch/${file}`);
      expect((await request.get(`${PREVIEW}/${file}`)).status(), file).toBe(200);
    }
    expect((await request.get(`${PREVIEW}/og/luescher.png`)).status()).toBe(200);
    expect((await request.get(`${PREVIEW}/site.webmanifest`)).status()).toBe(200);
  });
});
