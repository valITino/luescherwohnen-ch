import { expect, test } from '@playwright/test';
import { PREVIEW, PROD } from './helpers.ts';

/**
 * Regeln für Suchmaschinen (docs/DESIGN.md, Abschnitt 8), geprüft am rohen HTML.
 * Läuft nur einmal (Desktop), weil es um das ausgelieferte HTML geht.
 */
test.skip(({ isMobile }) => isMobile, 'HTML ist für alle Geräte gleich');

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
    const types = data['@graph'].map((node) => node['@type']);
    expect(types).toEqual(
      expect.arrayContaining(['Organization', 'FurnitureStore', 'WebSite', 'WebPage']),
    );
    const store = data['@graph'].find((node) => node['@type'] === 'FurnitureStore')!;
    expect(store.telephone).toBe('+41562227852');
    expect(store.address).toMatchObject({
      streetAddress: 'Weite Gasse 9',
      postalCode: '5400',
      addressLocality: 'Baden',
      addressCountry: 'CH',
    });
    const hours = store.openingHoursSpecification as { dayOfWeek: string[]; opens: string }[];
    expect(hours.flatMap((entry) => entry.dayOfWeek)).not.toContain('Monday');
    expect(hours.flatMap((entry) => entry.dayOfWeek)).not.toContain('Sunday');
    // Keine Bewertungen, keine Preise
    expect(raw).not.toMatch(/aggregateRating|review|price/i);
  });

  test('robots.txt erlaubt alles und nennt die Sitemap', async ({ request }) => {
    const text = await (await request.get(`${PROD}/robots.txt`)).text();
    expect(text).toMatch(/^Allow: \/$/m);
    expect(text).not.toMatch(/^Disallow:/m);
    expect(text).toContain('Sitemap: https://luescherwohnen.ch/sitemap-index.xml');
  });

  test('Sitemap: nur Seiten im Index', async ({ request }) => {
    const xml = await (await request.get(`${PROD}/sitemap-0.xml`)).text();
    for (const path of INDEXED) expect(xml).toContain(`https://luescherwohnen.ch${path}`);
    expect(xml).not.toContain('styleguide');
    expect(xml).not.toContain('404');
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
