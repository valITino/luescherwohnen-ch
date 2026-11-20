// Sperrt ausführbare oder archivierte Dateien im Repository (PHP, Archive, Binärdateien).
// Anlass: Im Bildbestand der alten Website lagen WordPress-Hintertüren als ZIP (docs/TODO.md).
// Die beiden bekannten Archive stehen bis zur freigegebenen Entfernung mit Prüfsumme auf der
// Liste QUARANTINE: Ändert sich eine davon oder kommt eine neue Datei dazu, schlägt die CI fehl.
//
// Aufruf: node scripts/check-forbidden-files.mjs   (prüft `git ls-files`)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const FORBIDDEN =
  /\.(php\d?|phtml|phar|zip|rar|7z|tar|gz|exe|dll|so|jar|bat|cmd|ps1|htaccess)$/i;

/** Bekannte Schadcode-Archive, Entfernung offen (docs/TODO.md). SHA-256 als IOC. */
export const QUARANTINE = {
  'docs/ressources/2026/08/contact_1787305442-1.zip':
    '17e6a2e6cb6660dec14f34d5dd46ccfdd617c1147262b758928f8ecfe1bd8cc3',
  'docs/ressources/2026/08/f88a21ec.zip':
    'e8ce6ee3cb8a6c7aecbe82826ec3d6010fe671751e31704e64f413abb19fc5f0',
};

/**
 * @param {string[]} files
 * @param {(file: string) => string} hash
 */
export function forbiddenFiles(files, hash) {
  const problems = [];
  for (const file of files) {
    if (!FORBIDDEN.test(file) && !/(^|\/)\.htaccess$/.test(file)) continue;
    const known = QUARANTINE[file];
    if (known && hash(file) === known) continue;
    problems.push(known ? `${file} (Prüfsumme geändert)` : file);
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const problems = forbiddenFiles(files, sha256);
  const quarantined = Object.keys(QUARANTINE).filter((file) => files.includes(file));
  if (quarantined.length > 0) {
    console.warn(
      `Achtung: ${quarantined.length} bekannte Schadcode-Archive liegen noch im Repository (docs/TODO.md).`,
    );
  }
  if (problems.length > 0) {
    console.error(`Verbotene Dateien:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`Keine verbotenen Dateien (${files.length} geprüft).`);
}
