// Container-Smoke-Test: startet das Image gehärtet (nur lesbar, ohne Zusatzrechte, ohne root),
// wartet auf den Healthcheck und prüft Security-Header, Caching, Adressen, 404 und Methoden.
// Danach wird der Container wieder entfernt.
//
// Aufruf: pnpm check:headers [--image luescherwohnen:local] [--port 8089] [--keep]
// Vorher: pnpm docker:build
import { execFileSync } from 'node:child_process';
import { connect } from 'node:net';
import { securityHeaders } from '../packages/config/src/security.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const image = flag('--image', 'luescherwohnen:local');
const port = Number(flag('--port', '8089'));
const name = `luescher-check-${process.pid}`;
const base = `http://127.0.0.1:${port}`;

const docker = (dockerArgs, options = {}) =>
  String(execFileSync('docker', dockerArgs, { encoding: 'utf8', ...options }) ?? '').trim();

const failures = [];
const check = (condition, message) => {
  if (condition) console.log(`  ✓ ${message}`);
  else {
    console.log(`  ✗ ${message}`);
    failures.push(message);
  }
};

async function waitHealthy() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    let status;
    try {
      status = docker(['inspect', '--format', '{{.State.Health.Status}}', name], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return false;
    }
    if (status === 'healthy') return true;
    if (status === 'unhealthy') return false;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

/** fetch ohne Proxy: Der Container läuft lokal. */
const get = (path, init = {}) => fetch(`${base}${path}`, { redirect: 'manual', ...init });

/**
 * Roher Request, Pfad unverändert: fetch würde `/../` schon im Client auflösen, und der Server
 * bekäme den Angriff nie zu sehen. Gibt Status, Kopfzeilen und Inhalt zurück.
 */
const rawGet = (path) =>
  new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(`GET ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
    });
    let data = '';
    socket.setEncoding('latin1');
    socket.on('data', (chunk) => (data += chunk));
    socket.on('end', () => {
      const [head = '', ...rest] = data.split('\r\n\r\n');
      const [statusLine = '', ...lines] = head.split('\r\n');
      const headers = Object.fromEntries(
        lines.map((line) => {
          const index = line.indexOf(':');
          return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
        }),
      );
      resolve({ status: Number(statusLine.split(' ')[1]), headers, body: rest.join('\r\n\r\n') });
    });
    socket.on('error', reject);
  });

docker([
  'run',
  '--detach',
  '--name',
  name,
  '--publish',
  `127.0.0.1:${port}:8080`,
  '--read-only',
  '--tmpfs',
  '/tmp:size=16m',
  '--cap-drop',
  'ALL',
  '--security-opt',
  'no-new-privileges:true',
  '--health-interval',
  '1s',
  image,
]);

try {
  console.log(`Container ${name} aus ${image}`);
  const healthy = await waitHealthy();
  check(healthy, 'Healthcheck meldet «healthy»');
  if (!healthy) {
    console.error(docker(['logs', name], { stdio: ['ignore', 'pipe', 'pipe'] }));
    throw new Error('Container startet nicht');
  }
  check(docker(['exec', name, 'id', '-u']) !== '0', 'nginx läuft nicht als root');
  const inspect = JSON.parse(docker(['inspect', name]))[0];
  check(inspect.HostConfig.ReadonlyRootfs === true, 'Dateisystem nur lesbar');
  check(
    inspect.HostConfig.CapDrop?.includes('ALL') && !inspect.HostConfig.CapAdd,
    'keine Linux-Capabilities',
  );

  console.log('\nStartseite');
  const home = await get('/', { headers: { 'Accept-Encoding': 'gzip' } });
  check(home.status === 200, `/ antwortet 200 (${home.status})`);
  check(home.headers.get('content-type')?.startsWith('text/html'), 'Content-Type text/html');
  check(home.headers.get('content-encoding') === 'gzip', 'HTML wird komprimiert ausgeliefert');
  for (const [header, value] of securityHeaders()) {
    check(home.headers.get(header) === value, `${header}: ${value.slice(0, 60)}`);
  }
  check(
    home.headers.get('cache-control') === 'public, max-age=300, must-revalidate',
    'HTML kurz cachen',
  );
  check(!/\d/.test(home.headers.get('server') ?? ''), 'Server-Header ohne Versionsnummer');
  const html = await home.text();
  check(html.includes('content-security-policy'), 'CSP-Meta-Tag mit Hashes im HTML');

  console.log('\nAssets');
  const css = /href="(\/_astro\/[^"]+\.css)"/.exec(html)?.[1];
  const asset = css ? await get(css) : null;
  check(asset?.status === 200, `gehashtes Asset ${css ?? '(fehlt)'} antwortet 200`);
  check(
    asset?.headers.get('cache-control') === 'public, max-age=31536000, immutable',
    'gehashte Assets ein Jahr unveränderlich',
  );
  check(
    asset?.headers.get('x-content-type-options') === 'nosniff',
    'Security-Header auch auf Assets',
  );
  const og = await get('/og/luescher.png');
  check(og.status === 200, 'Vorschaubild /og/luescher.png');
  check(
    og.headers.get('cross-origin-resource-policy') === 'cross-origin',
    'Vorschaubild darf fremd eingebunden werden',
  );
  const listing = await get('/_astro/');
  check(listing.status === 404 || listing.status === 403, 'kein Verzeichnis-Listing');

  console.log('\nAdressen');
  for (const path of ['/impressum', '/datenschutz', '/robots.txt', '/.well-known/security.txt']) {
    const response = await get(path);
    check(response.status === 200, `${path} antwortet 200 (${response.status})`);
  }
  const styleguide = await get('/styleguide');
  check(
    styleguide.headers.get('x-robots-tag') === 'noindex, nofollow',
    '/styleguide trägt X-Robots-Tag noindex',
  );
  const shortcut = await get('/security.txt');
  check(
    shortcut.status === 301 && shortcut.headers.get('location') === '/.well-known/security.txt',
    '/security.txt leitet auf /.well-known/security.txt weiter',
  );
  check(
    shortcut.headers.get('x-frame-options') === 'DENY',
    'Security-Header auch auf der Weiterleitung',
  );
  const missing = await get('/gibt-es-nicht');
  check(missing.status === 404, `unbekannte Adresse antwortet 404 (${missing.status})`);
  check((await missing.text()).includes('Diese Seite gibt es nicht'), '404 zeigt die eigene Seite');
  check(
    missing.headers.get('content-security-policy') !== null,
    'Security-Header auch auf der 404-Seite',
  );
  check(
    (await get('/docs/homepage-anforderungen.md')).status === 404,
    'keine Projektdateien im Image',
  );
  for (const path of ['/../etc/passwd', '/..%2f..%2fetc/passwd', '/_astro/../../etc/passwd']) {
    const traversal = await rawGet(path);
    check(
      traversal.status >= 400 && !traversal.body.includes('root:'),
      `kein Pfad ausserhalb des Web-Verzeichnisses: ${path} (${traversal.status})`,
    );
    check(
      traversal.headers['x-content-type-options'] === 'nosniff',
      `Security-Header auch auf der Fehlerantwort für ${path}`,
    );
  }

  console.log('\nMethoden');
  const post = await get('/', { method: 'POST', body: 'x' });
  check(post.status === 405, `POST wird abgelehnt (${post.status})`);
  check(post.headers.get('allow') === 'GET, HEAD', 'Allow-Header nennt GET und HEAD');
  check(
    post.headers.get('content-security-policy') !== null &&
      post.headers.get('x-frame-options') === 'DENY',
    'Security-Header auch auf der 405-Antwort',
  );
  const remove = await get('/', { method: 'DELETE' });
  check(remove.status === 405, `DELETE wird abgelehnt (${remove.status})`);
  const health = await get('/healthz');
  check(health.status === 200 && (await health.text()).trim() === 'ok', '/healthz antwortet «ok»');

  console.log('\nBetrieb');
  const logs = docker(['logs', name], { stdio: ['ignore', 'pipe', 'pipe'] });
  const accessLines = logs.split('\n').filter((line) => /"(GET|HEAD|POST|DELETE) /.test(line));
  check(accessLines.length > 0, `Zugriffslog vorhanden (${accessLines.length} Zeilen)`);
  check(
    !accessLines.some((line) => /\b\d{1,3}(\.\d{1,3}){3}\b|Mozilla|node|undici/.test(line)),
    'Zugriffslog ohne IP-Adresse und User-Agent',
  );
  const writable = docker([
    'exec',
    name,
    'sh',
    '-c',
    'test -w /etc/nginx/conf.d/default.conf || test -w /etc/nginx/conf.d && echo ja || echo nein',
  ]);
  check(writable === 'nein', 'nginx-Konfiguration für den nginx-Benutzer nicht beschreibbar');
} finally {
  if (args.includes('--keep')) console.log(`\nContainer läuft weiter: ${base}`);
  else docker(['rm', '--force', name], { stdio: 'ignore' });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log('\nAlle Prüfungen bestanden.');
