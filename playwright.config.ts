import { defineConfig, devices } from '@playwright/test';

/**
 * Tests gegen die gebauten Varianten. Vorher bauen (Reihenfolge wichtig, build:pages
 * überschreibt apps/web/dist):
 *   pnpm build:pages && pnpm build
 *
 * - Produktion (apps/web/dist, Port 4321): ohne Formular, im Index, mit strukturierten Daten
 * - Vorschau (dist-pages, Port 4322 unter /luescherwohnen-ch): wie GitHub Pages, Formular
 *   simuliert, noindex, Projekte sichtbar
 * Es geht kein Request ins Netz.
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

const server = (dir: string, port: number, base = '') => ({
  // Mit den Cache-Regeln der Produktion: Bei no-store bricht Chromium Seitenübergänge mitunter ab.
  command: `node scripts/serve.mjs ${dir} --port ${port}${base ? ` --base ${base}` : ''} --production`,
  url: `http://127.0.0.1:${port}${base}/`,
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
});

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'off',
    launchOptions: { executablePath },
  },
  /*
   * Jeder Test läuft auf Desktop und Handy und prüft dort, was das Gerät tut (am Handy etwa das
   * Menü statt der Navigation in der Leiste). Die Prüfungen am rohen HTML (seo.spec.ts) laufen
   * einmal, ohne Gerät: Das HTML ist für alle gleich.
   */
  projects: [
    {
      name: 'desktop',
      testIgnore: /seo\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testIgnore: /seo\.spec\.ts$/,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    { name: 'html', testMatch: /seo\.spec\.ts$/ },
  ],
  webServer: [server('apps/web/dist', 4321), server('dist-pages', 4322, '/luescherwohnen-ch')],
});
