// Vorschau-Build für GitHub Pages: die Website unter <PAGES_URL>/ (z. B.
// https://<user>.github.io/luescherwohnen-ch/).
//
// Das Formular antwortet dort simuliert (PUBLIC_CONTACT_ENDPOINT=mock), es wird nichts gesendet
// oder gespeichert. Alle Seiten sind noindex, oben steht ein Vorschau-Hinweis. Das ist nur eine
// Demo; der Betrieb ist noch nicht entschieden (D-007, docs/DEPLOY.md).
//
// Aufruf: pnpm build:pages            (Standard: https://valitino.github.io/luescherwohnen-ch)
//         PAGES_URL=https://<user>.github.io/<repo> pnpm build:pages
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTrailingSlashes } from '../packages/config/src/sites.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist-pages');

const raw = stripTrailingSlashes(
  process.env.PAGES_URL || 'https://valitino.github.io/luescherwohnen-ch',
);
const parsed = new URL(raw);
const basePath = stripTrailingSlashes(parsed.pathname);
// Hostnamen sind klein geschrieben, der Pfad behält die Schreibweise des Repos.
const pagesUrl = `${parsed.protocol}//${parsed.host.toLowerCase()}${basePath}`;

const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  PUBLIC_WEB_URL: pagesUrl,
  PUBLIC_CONTACT_ENDPOINT: 'mock',
  PUBLIC_PREVIEW: 'true',
};

console.log(`Vorschau-Build für ${pagesUrl}`);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

execFileSync('pnpm', ['--filter', '@luescher/web', 'build'], { cwd: root, env, stdio: 'inherit' });
cpSync(resolve(root, 'apps/web/dist'), out, { recursive: true });

// Ohne Jekyll ausliefern (Ordner mit Unterstrich wie _astro bleiben erhalten).
writeFileSync(resolve(out, '.nojekyll'), '');

if (!existsSync(resolve(out, 'index.html'))) {
  throw new Error('dist-pages/index.html fehlt: Build von apps/web prüfen.');
}
console.log(`\nFertig: ${out}`);
console.log(`Lokal ansehen: node scripts/serve.mjs dist-pages --base ${basePath || '/'}`);
console.log('Achtung: apps/web/dist ist jetzt der Vorschau-Build. Vor Tests wieder «pnpm build».');
