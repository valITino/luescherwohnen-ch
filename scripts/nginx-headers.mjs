// Schreibt die Security-Header für nginx (Include-Dateien) aus @luescher/config/security.
// Läuft im Docker-Build; dieselbe Quelle erzeugt auch das CSP-Meta-Tag der Seiten.
//
// Aufruf: node scripts/nginx-headers.mjs <zielverzeichnis>
//   → security-headers.inc (Standard) und security-headers-cross-origin.inc (/og/)
// Umgebung: PUBLIC_CONTACT_ENDPOINT (für connect-src), PUBLIC_HSTS_PRELOAD
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { nginxHeaders } from '../packages/config/src/security.mjs';
import { resolveContact } from '../packages/config/src/sites.mjs';

const target = process.argv[2];
if (!target) {
  console.error('Aufruf: node scripts/nginx-headers.mjs <zielverzeichnis>');
  process.exit(1);
}

const contact = resolveContact(process.env.PUBLIC_CONTACT_ENDPOINT ?? '');
const options = {
  connectOrigin: contact.origin,
  hstsPreload: process.env.PUBLIC_HSTS_PRELOAD === 'true',
};

mkdirSync(target, { recursive: true });
writeFileSync(join(target, 'security-headers.inc'), nginxHeaders(options));
writeFileSync(
  join(target, 'security-headers-cross-origin.inc'),
  nginxHeaders({ ...options, crossOriginResource: true }),
);
console.log(`nginx-Header → ${target}`);
