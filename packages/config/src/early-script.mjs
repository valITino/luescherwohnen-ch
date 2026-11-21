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
const STATIC_IMPORT =
  /(?:^|[;}\s])(?:import\s*(?:[\w${}*,\s]+from\s*)?|export\s*[\w${}*,\s]*from\s*)["'](\.{1,2}\/[^"']+)["']/g;

/**
 * Die Module, die eine Datei statisch einbindet (relative Pfade wie "./header.js").
 * Dynamische Importe (`import("./scroll.js")`) zählen nicht: Sie laden erst bei Bedarf.
 * @param {string} code
 * @returns {string[]}
 */
export function staticImports(code) {
  return [...new Set([...code.matchAll(STATIC_IMPORT)].map((match) => match[1] ?? ''))];
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
