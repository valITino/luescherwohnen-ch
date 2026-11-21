import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { DUR, EASE, STAGGER } from '../src/motion/tokens.ts';

/**
 * Wächter für die Motion-Tokens: CSS (`styles/tokens.css`) und Skripte (`motion/tokens.ts`)
 * beschreiben dieselbe Bewegung. Weicht eine Seite ab, fühlen sich Hover, CSS-Auftritte und
 * GSAP-Auftritte verschieden an. Geprüft wird darum Wert für Wert in beide Richtungen und jede
 * GSAP-Kurve an ihrer CSS-Kurve.
 */

/** Grösste zulässige Abweichung zwischen CSS- und GSAP-Kurve (Fortschritt 0 bis 1) */
const MAX_GAP = 0.02;

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

/** CSS-Kurve als Funktion des Fortschritts x (0 bis 1), wie der Browser sie rechnet */
function cubicBezier(value: string): (x: number) => number {
  const [x1, y1, x2, y2] = controlPoints(value);
  const axis = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x) => {
    // x(t) steigt monoton (x1, x2 zwischen 0 und 1): Halbieren findet t sicher.
    let low = 0;
    let high = 1;
    for (let step = 0; step < 60; step += 1) {
      const middle = (low + high) / 2;
      if (axis(x1, x2, middle) < x) low = middle;
      else high = middle;
    }
    return axis(y1, y2, (low + high) / 2);
  };
}

/** Grösste Abweichung zweier Kurven, abgetastet in Schritten von 0,001 */
function maxGap(css: string, gsapName: string): number {
  const browser = cubicBezier(css);
  const library = gsap.parseEase(gsapName);
  if (typeof library !== 'function') throw new Error(`GSAP kennt die Kurve nicht: ${gsapName}`);
  let gap = 0;
  for (let step = 0; step <= 1000; step += 1) {
    const x = step / 1000;
    gap = Math.max(gap, Math.abs(browser(x) - library(x)));
  }
  return gap;
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

  it.each(Object.entries(EASE))('Kurve «%s»: GSAP folgt der CSS-Kurve', (_name, curve) => {
    expect(maxGap(curve.css, curve.gsap)).toBeLessThanOrEqual(MAX_GAP);
  });

  it('erkennt ein ungleiches Paar (das frühere: power3.out zu cubic-bezier(0.2, 0.7, 0.2, 1))', () => {
    expect(maxGap('cubic-bezier(0.2, 0.7, 0.2, 1)', 'power3.out')).toBeGreaterThan(MAX_GAP);
  });

  it('meldet unbekannte GSAP-Kurven statt still eine andere zu nehmen', () => {
    expect(() => maxGap(EASE.out.css, 'power9.out')).toThrow(/kennt die Kurve nicht/);
  });

  it('rechnet die CSS-Kurve wie der Browser (Endpunkte und lineare Kurve)', () => {
    const linear = cubicBezier('cubic-bezier(0, 0, 1, 1)');
    for (const x of [0, 0.25, 0.5, 0.75, 1]) expect(linear(x)).toBeCloseTo(x, 6);
    const out = cubicBezier(EASE.out.css);
    expect(out(0)).toBeCloseTo(0, 6);
    expect(out(1)).toBeCloseTo(1, 6);
  });
});
