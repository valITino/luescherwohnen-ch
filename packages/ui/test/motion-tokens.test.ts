import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUR, EASE, STAGGER } from '../src/motion/tokens.ts';

/**
 * Wächter für die Motion-Tokens: CSS (`styles/tokens.css`) und Skripte (`motion/tokens.ts`)
 * beschreiben dieselbe Bewegung. Weicht eine Seite ab, passen Übergänge in CSS und Zeitgeber in
 * Skripten nicht mehr zusammen. Geprüft wird darum Wert für Wert in beide Richtungen.
 */

const tokensCss = readFileSync(
  join(import.meta.dirname, '..', 'src', 'styles', 'tokens.css'),
  'utf8',
);

/** Eigenschaften im `:root`-Block, ohne Kommentare und mit einheitlichen Leerzeichen */
function rootProperties(source: string): Map<string, string> {
  const plain = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = /:root\s*\{([^}]*)\}/.exec(plain)?.[1] ?? '';
  return new Map(
    [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [
      match[1] as string,
      (match[2] as string).replace(/\s+/g, ' ').trim(),
    ]),
  );
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
/** Sekunden als CSS-Millisekunden; Rundungsreste der Gleitkommazahl fallen weg, Tippfehler nicht */
const ms = (seconds: number) => `${Number((seconds * 1000).toFixed(6))}ms`;

/** Was tokens.css laut tokens.ts enthalten muss */
function expectedCss(): Record<string, string> {
  const expected: Record<string, string> = { '--ease': 'var(--ease-out)' };
  for (const [name, curve] of Object.entries(EASE)) expected[`--ease-${kebab(name)}`] = curve.css;
  for (const [name, seconds] of Object.entries(DUR))
    expected[`--dur-${name.slice(1)}`] = ms(seconds);
  for (const [name, seconds] of Object.entries(STAGGER)) {
    expected[name === 'base' ? '--stagger' : `--stagger-${kebab(name)}`] = ms(seconds);
  }
  return expected;
}

/** Kontrollpunkte aus `cubic-bezier(x1, y1, x2, y2)` */
function controlPoints(value: string): [number, number, number, number] {
  const match = /^cubic-bezier\(([^)]*)\)$/.exec(value.trim());
  if (!match) throw new Error(`keine cubic-bezier-Kurve: ${value}`);
  const points = (match[1] as string).split(',').map(Number);
  if (points.length !== 4 || points.some(Number.isNaN)) throw new Error(`ungültig: ${value}`);
  return points as [number, number, number, number];
}

describe('Motion-Tokens', () => {
  const css = rootProperties(tokensCss);
  const motion = Object.fromEntries(
    [...css].filter(([name]) => /^--(ease|dur|stagger)(-|$)/.test(name)),
  );

  it('liest den Motion-Block aus tokens.css', () => {
    expect(css.get('--ease-out')).toBeDefined();
    expect(css.get('--dur-5')).toBeDefined();
    expect(css.get('--stagger')).toBeDefined();
  });

  it('CSS und Skripte kennen dieselben Kurven, Dauern und Versätze', () => {
    const squeeze = (record: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(record).map(([name, value]) => [name, value.replace(/\s/g, '')]),
      );
    // Beide Richtungen: kein Token nur auf einer Seite, kein abweichender Wert.
    expect(squeeze(motion)).toEqual(squeeze(expectedCss()));
  });

  it('Dauern und Versätze steigen an und bleiben zwischen 0 und 1,2 s', () => {
    const durations = Object.values(DUR);
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    for (const seconds of [...durations, ...Object.values(STAGGER)]) {
      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(1.2);
    }
    expect(STAGGER.tight).toBeLessThan(STAGGER.base);
  });

  it.each(Object.entries(EASE))('Kurve «%s» bremst ohne Überschwingen', (_name, curve) => {
    for (const point of controlPoints(curve.css)) {
      expect(point).toBeGreaterThanOrEqual(0);
      expect(point).toBeLessThanOrEqual(1);
    }
  });
});
