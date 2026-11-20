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
  command: `node scripts/serve.mjs ${dir} --port ${port}${base ? ` --base ${base}` : ''}`,
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
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [server('apps/web/dist', 4321), server('dist-pages', 4322, '/luescherwohnen-ch')],
});
