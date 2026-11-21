// Das Skript einer Seite läuft vor ihrem ersten Bild (Astro-Integration, nur im Build).
//
// Astro setzt das gebündelte Modul einer Seite ans Ende des <body>. Der Browser zeigt eine
// Seite darum mitunter, bevor ihr Skript lief: beim ersten Besuch oft, mit Seitenübergang zu
// einer Marke (/#kontakt) besonders sichtbar. Dann stand die neue Seite erst oben und sprang
// danach zur Marke, und der Header wechselte mit ihr (docs/DECISIONS.md 44).
// Hier wandert das Modul in den <head> und hält das erste Bild an, bis es gelaufen ist
// (`blocking="render"`); was es statisch einbindet, lädt gleichzeitig (`modulepreload`).
// Gemessen ist das erste Bild so nicht später, sondern früher: Das Modul lädt schon mit dem
// Kopf statt erst am Ende des HTML. Browser ohne `blocking` laden es wie ein gewöhnliches
// Modul im Kopf (nach dem Parsen ausgeführt), es ändert sich nichts.
// Astro selbst erlaubt an gebündelten Skripten keine weiteren Attribute.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE = /<script type="module" src="([^"]+)"><\/script>/g;

/** Was zwischen `import` bzw. `export` und dem Pfad stehen kann: Namen, Klammern, Stern, Komma, Leerraum. */
const CLAUSE = /[\w${}*,\s]/;
const SPACE = /\s/;
/** Vor dem Schlüsselwort: Anfang der Datei, Ende einer Anweisung oder eines Blocks, Leerraum. */
const BEFORE_KEYWORD = /[;}\s]/;

/** @param {string | undefined} char */
const isQuote = (char) => char === '"' || char === "'";

/**
 * Steht `word` bei `at` als Schlüsselwort, also am Anfang oder nach `;`, `}` oder Leerraum?
 * @param {string} code
 * @param {number} at
 * @param {string} word
 */
const keywordAt = (code, at, word) =>
  code.startsWith(word, at) && (at === 0 || BEFORE_KEYWORD.test(code[at - 1] ?? ''));

/**
 * Endet der Lauf `code[start, end)` in einem statischen Import oder Export, dessen Pfad gleich
 * folgt? Zwei Formen: `import"./a.js"` und `import … from"./a.js"` bzw. `export … from"./a.js"`.
 * @param {string} code
 * @param {number} start
 * @param {number} end
 */
function endsInImport(code, start, end) {
  let tail = end;
  while (tail > start && SPACE.test(code[tail - 1] ?? '')) tail -= 1;
  // Nur der Pfad, ohne Namen: import"./a.js"
  if (tail - start >= 6 && keywordAt(code, tail - 6, 'import')) return true;
  if (tail - start < 4 || !code.startsWith('from', tail - 4)) return false;
  // … from: Davor steht im selben Lauf ein `export` oder ein `import` mit mindestens einem Zeichen
  // bis zum `from` (das Schlüsselwort ist sechs Zeichen lang, `from` vier).
  for (let at = start; at + 10 <= tail; at += 1) {
    if (keywordAt(code, at, 'export')) return true;
    if (at + 10 < tail && keywordAt(code, at, 'import')) return true;
  }
  return false;
}

/**
 * Die Module, die eine Datei statisch einbindet (relative Pfade wie "./header.js").
 * Dynamische Importe (`import("./scroll.js")`) zählen nicht: Sie laden erst bei Bedarf.
 *
 * Ein Durchgang von vorn nach hinten, jedes Zeichen wird höchstens zweimal angesehen. Als ein
 * einziger regulärer Ausdruck brauchte dieselbe Suche bei vielen Leerzeichen nach `import`
 * quadratische Zeit (CodeQL js/polynomial-redos, gemessen: doppelte Länge, vierfache Zeit).
 * @param {string} code
 * @returns {string[]}
 */
export function staticImports(code) {
  /** @type {Set<string>} */
  const found = new Set();
  let index = 0;
  while (index < code.length) {
    // Ein Lauf von Zeichen, wie sie zwischen Schlüsselwort und Pfad stehen können.
    const start = index;
    while (index < code.length && CLAUSE.test(code[index] ?? '')) index += 1;
    if (!isQuote(code[index]) || !endsInImport(code, start, index)) {
      index += 1;
      continue;
    }
    // Der Pfad reicht bis zum nächsten Anführungszeichen.
    let close = index + 1;
    while (close < code.length && !isQuote(code[close])) close += 1;
    const path = code.slice(index + 1, close);
    const relative =
      (path.startsWith('./') && path.length > 2) || (path.startsWith('../') && path.length > 3);
    if (close < code.length && relative) found.add(path);
    index = close + 1;
  }
  return [...found];
}

/**
 * Verschiebt das Modul der Seite in den Kopf, blockierend für das erste Bild, mit den Modulen,
 * die es einbindet, als `modulepreload` davor. Seiten ohne Modul bleiben unverändert.
 * @param {string} html
 * @param {(src: string) => string[]} importsOf  URLs der statisch eingebundenen Module
 * @returns {string}
 */
export function moveModuleToHead(html, importsOf) {
  const modules = [...html.matchAll(MODULE)];
  if (modules.length === 0 || !html.includes('</head>')) return html;
  let body = html;
  for (const [tag] of modules) body = body.replace(tag, '');
  const head = modules
    .map(([, src = '']) =>
      [
        ...importsOf(src).map((url) => `<link rel="modulepreload" href="${url}">`),
        `<script type="module" blocking="render" src="${src}"></script>`,
      ].join(''),
    )
    .join('');
  return body.replace('</head>', `${head}</head>`);
}

/** @param {string} dir */
async function htmlFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** @returns {import('astro').AstroIntegration} */
export function earlyScript() {
  let base = '/';
  return {
    name: 'luescher:early-script',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        /** @type {Map<string, string[]>} */
        const cache = new Map();
        /** @param {string} src */
        const importsOf = (src) => cache.get(src) ?? [];
        let changed = 0;
        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          for (const [, src = ''] of html.matchAll(MODULE)) {
            if (cache.has(src) || !src.startsWith(base)) continue;
            const code = await readFile(join(root, src.slice(base.length)), 'utf8');
            cache.set(
              src,
              staticImports(code).map((path) => posix.join(posix.dirname(src), path)),
            );
          }
          const moved = moveModuleToHead(html, importsOf);
          if (moved === html) continue;
          await writeFile(file, moved);
          changed++;
        }
        logger.info(`Modul vor dem ersten Bild: ${changed} Seiten`);
      },
    },
  };
}
