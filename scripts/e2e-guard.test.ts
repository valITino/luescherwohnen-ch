import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Wächter für die Regel «Kein e2e-Test wird übersprungen» (CLAUDE.md, Abschnitt 2b;
 * docs/DECISIONS.md 44 und 47): Jeder Test läuft auf Desktop und Handy und prüft dort, was das
 * Gerät tut. Ein Test mit `skip` oder `fixme` prüft nichts, und ein vergessenes `only` schaltet
 * alle anderen ab. Was nur einmal laufen soll (rohes HTML), bekommt ein eigenes Projekt in
 * playwright.config.ts statt einer Ausnahme im Test.
 */

const dir = join(import.meta.dirname, '..', 'e2e');
/** `test.skip(`, `test.describe.fixme(`, `it.only(` usw., auch über Zeilenumbrüche hinweg */
const SWITCHED_OFF = /\b(?:test|it|describe)(?:\s*\.\s*\w+)*\s*\.\s*(skip|fixme|only)\s*\(/g;

/** Ohne Kommentare: Eine Erklärung darf die Wörter nennen. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const found = (source: string) =>
  [...code(source).matchAll(SWITCHED_OFF)].map((match) => match[0].replace(/\s+/g, ''));

describe('e2e: kein Test wird übersprungen', () => {
  const files = readdirSync(dir).filter((name) => name.endsWith('.ts'));

  it('findet die Testdateien', () => {
    expect(files).toEqual(expect.arrayContaining(['web.spec.ts', 'seo.spec.ts', 'a11y.spec.ts']));
  });

  it('kein skip, fixme oder only in e2e/', () => {
    const problems = files.flatMap((name) =>
      found(readFileSync(join(dir, name), 'utf8')).map((call) => `e2e/${name}: ${call}`),
    );
    expect(problems).toEqual([]);
  });

  it('Selbsttest: erkennt abgeschaltete Tests und lässt Kommentare und Namen stehen', () => {
    const sample = `
      test.skip(isMobile, 'nur am Desktop');
      test.describe.fixme('später', () => {});
      test
        .only('nur dieser', async () => {});
      // test.skip(true) in einem Kommentar zählt nicht
      /* test.only('auch nicht') */
      test('Skip-Link führt zum Inhalt', async () => {});
      await page.locator('.skip-link').click();
      const origin = 'http://127.0.0.1:4321'; // Adresse bleibt
    `;
    expect(found(sample)).toEqual(['test.skip(', 'test.describe.fixme(', 'test.only(']);
  });
});
