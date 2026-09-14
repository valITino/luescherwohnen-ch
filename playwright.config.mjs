import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Der Kontakt-Dienst protokolliert Anfragen im Test in diese Datei.
export const MAIL_LOG = path.join(os.tmpdir(), "luescherwohnen-test-mails.jsonl");

// End-to-End-, Accessibility- und Responsive-Prüfungen gegen web/dist.
export default defineConfig({
  testDir: "web/tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    // Ohne Animationen: sanftes Scrollen zu Sprungmarken macht Elemente für
    // Playwright kurz "instabil", ohne JavaScript bleibt der Klick sonst hängen.
    reducedMotion: "reduce",
  },
  webServer: [
    {
      command: "node scripts/serve.mjs 4173 web/dist",
      url: "http://127.0.0.1:4173/",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
      env: { KONTAKT_UPSTREAM: "http://127.0.0.1:4174" },
    },
    {
      command: "node kontakt/server.mjs",
      url: "http://127.0.0.1:4174/kontakt/healthz",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
      env: {
        HOST: "127.0.0.1",
        PORT: "4174",
        MAIL_MODE: "log",
        MAIL_LOG_FILE: MAIL_LOG,
        KONTAKT_SECRET: "nur-fuer-tests-0123456789abcdef0123456789", // gitleaks:allow synthetischer Testwert
        KONTAKT_MIN_AGE_MS: "300",
        RATE_LIMIT_PER_HOUR: "1000",
        TRUST_PROXY: "1",
        PARTIALS_DIR: "web/src/partials",
      },
    },
  ],
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
