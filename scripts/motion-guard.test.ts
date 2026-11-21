import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Wächter für die Bewegungsregeln (docs/DESIGN.md, Abschnitt Motion): Bewegt werden nur
 * transform, opacity und clip-path, dazu kurze Farbwechsel bei Hover und Fokus. Kein Übergang
 * und keine Keyframe-Animation darf Lage, Grösse, Abstände, Schatten, Filter oder die Lage eines
 * Hintergrunds ändern: Das zwänge den Browser in jedem Bild zu neuem Layout oder neuem Zeichnen.
 * Kurven kommen nur aus tokens.css und schwingen nie über (kein Federn, kein Zurückprallen),
 * gleichmässig (`linear`) läuft nur, was dafür vorgesehen ist, und keine Keyframe-Animation dreht
 * etwas. Geprüft wird gegen eine Positivliste: Was nicht ausdrücklich erlaubt ist, fällt auf.
 *
 * Was beim Scrollen ins Bild kommt, hängt an der Scrollposition (`animation-timeline`). Solche
 * Regeln stehen nur in den beiden scroll.css, gelten nicht bei angehaltener Bewegung, und ihre
 * Kurzschreibweise `animation` enthält immer eine Variable: Ohne sie legt der CSS-Minifier sie
 * mit `animation-timeline` zu einer Angabe zusammen, die kein Browser annimmt.
 *
 * Geprüft werden alle Stylesheets und die <style>-Blöcke aller Astro-Komponenten unter apps/ und
 * packages/. Am Ende prüft ein Selbsttest, dass der Wächter Verstösse auch wirklich erkennt.
 */

const root = join(import.meta.dirname, '..');
const TOKENS = 'packages/ui/src/styles/tokens.css';

/**
 * Eigenschaften, die übergehen oder in Keyframes stehen dürfen: Lage über transform, Deckkraft,
 * Ausschnitt, Farben (Hover und Fokus) und diskrete Schalter, die ein Ein- oder Ausblenden
 * begleiten. Alles andere (Layout, Schatten, Filter, Hintergrundlage, `all`) fällt auf.
 */
const ALLOWED =
  /^(?:opacity|transform|translate|scale|clip-path|(?:background-|border-|outline-|text-decoration-)?color|fill|stroke|visibility|display|overlay)$/;
const forbidden = (property: string) => !ALLOWED.test(property);

/**
 * Das Wort `linear` steht nur beim Abtauchen im Header und im Token `--scrub` (docs/DESIGN.md).
 * Was an der Scrollposition hängt, läuft gleichmässig über dieses Token.
 */
const LINEAR_ALLOWED = ['apps/web/src/components/Header.astro', TOKENS];

/** Nur hier darf Bewegung an der Scrollposition hängen. */
const SCROLL_FILES = ['packages/ui/src/styles/scroll.css', 'apps/web/src/styles/scroll.css'];

/** Jede Regel (Selektor und Inhalt) der innersten Ebene, also ohne umgebende @-Blöcke */
function rules(source: string): { selector: string; body: string }[] {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: (match[1] ?? '').trim(),
    body: match[2] ?? '',
  }));
}

/** Regeln, die eine Animation an die Scrollposition hängen */
const scrollRules = (source: string) =>
  rules(source).filter(({ body }) => /animation-timeline\s*:/.test(body));
const usesLinear = (source: string) => /\blinear\b(?![-(])/.test(source);
/** Kurven als Schlüsselwort (ease, ease-out …) statt aus tokens.css */
const usesKeywordEase = (source: string) =>
  /(?<![-\w])ease(?:-in|-out|-in-out)?(?![-\w])/.test(source);

/** Wörter in einem Übergang, die keine Eigenschaft sind */
const NOT_A_PROPERTY =
  /^(?:none|ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|allow-discrete|normal|initial|inherit|unset|revert|revert-layer)$/;

function files(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('dist') || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...files(path));
    else if (name.endsWith('.css') || name.endsWith('.astro')) found.push(path);
  }
  return found;
}

/** CSS einer Datei: ganze Stylesheets, bei Astro nur die <style>-Blöcke; ohne Kommentare */
function css(file: string): string {
  const text = readFileSync(file, 'utf8');
  const source = file.endsWith('.astro')
    ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n')
    : text;
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Teilt nur auf oberster Ebene, also nie innerhalb von var(…, …) oder cubic-bezier(…). */
function splitTop(value: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (depth === 0 && separator.test(char)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Alle Eigenschaften, die `transition` und `transition-property` übergehen lassen */
function transitioned(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(/(?:^|[\s;{])transition(-property)?\s*:\s*([^;{}]+)/g)) {
    for (const item of splitTop(match[2] ?? '', /,/)) {
      const words = splitTop(item.replace('!important', ''), /\s/);
      const property = match[1]
        ? words[0]
        : words.find((word) => /^-?[a-z][a-z-]*$/.test(word) && !NOT_A_PROPERTY.test(word));
      if (property && !NOT_A_PROPERTY.test(property)) found.push(property);
    }
  }
  return found;
}

/** Jede @keyframes-Regel mit Namen und Inhalt (geschweifte Klammern gezählt) */
function keyframes(source: string): { name: string; body: string }[] {
  const blocks: { name: string; body: string }[] = [];
  for (const match of source.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    const start = match.index + match[0].length;
    let depth = 1;
    let index = start;
    while (depth > 0 && index < source.length) {
      if (source[index] === '{') depth++;
      else if (source[index] === '}') depth--;
      index++;
    }
    blocks.push({ name: match[1] ?? '', body: source.slice(start, index - 1) });
  }
  return blocks;
}

/** Eigenschaften, die in einem Keyframe-Block gesetzt werden */
function declared(body: string): string[] {
  return [...body.matchAll(/(?:^|[{;])\s*(-?[a-z][a-z-]*)\s*:/g)].map((match) => match[1] ?? '');
}

/** Alle cubic-bezier-Kurven als Zahlen [x1, y1, x2, y2] */
function curves(source: string): number[][] {
  return [...source.matchAll(/cubic-bezier\(([^)]*)\)/g)].map((match) =>
    (match[1] ?? '').split(',').map(Number),
  );
}

/** Schwingt die Kurve über oder zurück (y ausserhalb von 0 bis 1)? */
const overshoots = ([, y1, , y2]: number[]) =>
  [y1, y2].some((y) => y === undefined || Number.isNaN(y) || y < 0 || y > 1);

/** Dreht die Keyframe-Animation etwas (rotate als Eigenschaft oder Funktion)? */
const rotates = (body: string) => /\brotate(?:[XYZ]|3d)?\s*[(:]/.test(body);

const sources = [...files(join(root, 'apps')), ...files(join(root, 'packages'))].map((file) => ({
  file: file.slice(root.length + 1),
  css: css(file),
}));

describe('Bewegung: nur transform, opacity und clip-path', () => {
  it('findet alle Stylesheets und Komponenten', () => {
    expect(sources.length).toBeGreaterThan(30);
    const names = sources.map(({ file }) => file);
    for (const file of [
      TOKENS,
      'packages/ui/src/styles/components.css',
      'apps/web/src/styles/global.css',
      'apps/web/src/components/Header.astro',
    ]) {
      expect(names).toContain(file);
    }
    // Es gibt wirklich etwas zu prüfen: Übergänge, Keyframes und die Kurven der Tokens.
    expect(sources.flatMap(({ css: source }) => transitioned(source)).length).toBeGreaterThan(20);
    expect(sources.flatMap(({ css: source }) => keyframes(source)).length).toBeGreaterThan(10);
  });

  it('Übergänge ändern weder Layout noch Schatten, Filter oder Hintergrundlage', () => {
    const found = sources.flatMap(({ file, css: source }) =>
      transitioned(source)
        .filter((property) => forbidden(property))
        .map((property) => `${file}: transition ${property}`),
    );
    expect(found).toEqual([]);
  });

  it('Keyframes ebenso, und keine dreht etwas', () => {
    const found = sources.flatMap(({ file, css: source }) =>
      keyframes(source).flatMap(({ name, body }) => [
        ...declared(body)
          .filter((property) => forbidden(property))
          .map((property) => `${file}: @keyframes ${name} ${property}`),
        ...(rotates(body) ? [`${file}: @keyframes ${name} rotate`] : []),
      ]),
    );
    expect(found).toEqual([]);
  });

  it('Gleichmässig (linear) läuft nur, was dafür vorgesehen ist', () => {
    const found = sources
      .filter(({ file, css: source }) => !LINEAR_ALLOWED.includes(file) && usesLinear(source))
      .map(({ file }) => file);
    expect(found).toEqual([]);
  });

  it('Bewegung an der Scrollposition: nur in scroll.css, abschaltbar und sicher vor dem Minifier', () => {
    const outside = sources
      .filter(({ file, css: source }) => !SCROLL_FILES.includes(file) && scrollRules(source).length)
      .map(({ file }) => file);
    expect(outside).toEqual([]);

    const found: string[] = [];
    let count = 0;
    for (const { file, css: source } of sources.filter(({ file }) => SCROLL_FILES.includes(file))) {
      // Alles steht in einem Block, der Unterstützung und gewünschte Bewegung voraussetzt.
      expect(source, file).toMatch(/@supports \(animation-timeline: view\(\)\)/);
      expect(source, file).toMatch(/@media screen and \(prefers-reduced-motion: no-preference\)/);
      for (const { selector, body } of scrollRules(source)) {
        count += 1;
        // Hält jemand die Bewegung an, gilt die Regel nicht (sonst fröre sie mitten im Weg ein).
        if (!selector.includes("html:not([data-motion='off'])")) {
          found.push(`${file}: ${selector} gilt auch bei angehaltener Bewegung`);
        }
        // Kurzschreibweise mit Variable, damit der Minifier sie nicht mit der Zeitleiste verschmilzt.
        const shorthand = /(?:^|[\s;])animation\s*:\s*([^;]+)/.exec(body)?.[1];
        const name = /(?:^|[\s;])animation-name\s*:/.test(body);
        if (!name && !(shorthand && shorthand.includes('var(--'))) {
          found.push(`${file}: ${selector} braucht «animation: name var(--…) both»`);
        }
        // Nach der Kurzschreibweise: Sie setzte die Zeitleiste sonst zurück.
        if (shorthand && body.indexOf('animation-timeline') < body.indexOf('animation:')) {
          found.push(`${file}: ${selector} setzt animation-timeline vor animation`);
        }
      }
    }
    expect(found).toEqual([]);
    expect(count).toBeGreaterThan(8);
  });

  it('Kurven stehen nur in tokens.css und schwingen nie über', () => {
    const elsewhere = sources
      .filter(
        ({ file, css: source }) =>
          file !== TOKENS && (curves(source).length > 0 || usesKeywordEase(source)),
      )
      .map(({ file }) => file);
    expect(elsewhere).toEqual([]);
    const tokens = curves(sources.find(({ file }) => file === TOKENS)?.css ?? '');
    expect(tokens.length).toBeGreaterThanOrEqual(4);
    expect(tokens.filter(overshoots)).toEqual([]);
  });

  it('Selbsttest: erkennt Verstösse und lässt Erlaubtes stehen', () => {
    const sample = `
      .a { transition: left var(--dur-3) var(--ease), width 1s; }
      .b { transition: opacity var(--dur-2) cubic-bezier(0.2, 1.5, 0.4, 1), box-shadow 0.2s ease; }
      .c { transition-property: filter, transform; }
      .d { transition: none !important; }
      .e { transition: display var(--dur-3) allow-discrete, clip-path 520ms var(--ease-expo); }
      .f { transition-duration: 0s; transition-delay: var(--bar-delay, 0s); }
      @keyframes spin { from { background-position: 0 0; transform: translateY(1em) rotate(-4deg); } }
      @keyframes fine { from { opacity: 0; translate: 0 1rem; clip-path: inset(100% 0 0 0); } }
    `;
    expect(transitioned(sample)).toEqual([
      'left',
      'width',
      'opacity',
      'box-shadow',
      'filter',
      'transform',
      'display',
      'clip-path',
    ]);
    expect(transitioned(sample).filter((property) => forbidden(property))).toEqual([
      'left',
      'width',
      'box-shadow',
      'filter',
    ]);
    const [spin, fine] = keyframes(sample);
    expect(declared(spin?.body ?? '')).toEqual(['background-position', 'transform']);
    expect(rotates(spin?.body ?? '')).toBe(true);
    expect(declared(fine?.body ?? '').filter((property) => forbidden(property))).toEqual([]);
    expect(rotates(fine?.body ?? '')).toBe(false);
    expect(curves(sample).filter(overshoots)).toEqual([[0.2, 1.5, 0.4, 1]]);
    // Positivliste: Unbekanntes fällt auf, Farben und Schalter nicht.
    expect(
      ['all', 'letter-spacing', 'border-radius', 'stroke-dashoffset'].filter(forbidden),
    ).toEqual(['all', 'letter-spacing', 'border-radius', 'stroke-dashoffset']);
    expect(['border-color', 'color', 'display', 'translate'].filter(forbidden)).toEqual([]);
    expect(usesLinear('.x { animation: a 1s linear; }')).toBe(true);
    expect(usesLinear('.x { background: linear-gradient(red, blue); }')).toBe(false);
    expect(usesLinear('.x { animation: a var(--scrub) both; }')).toBe(false);
    // Regeln der innersten Ebene, auch in verschachtelten @-Blöcken.
    const nested = `@supports (x: y) { @media screen { html:not([data-motion='off']) .a {
      animation: rise var(--scrub) both; animation-timeline: view(); } .b { color: red; } } }`;
    expect(scrollRules(nested).map(({ selector }) => selector)).toEqual([
      "html:not([data-motion='off']) .a",
    ]);
    expect(usesKeywordEase('.x { transition: opacity 1s ease-out; }')).toBe(true);
    expect(usesKeywordEase('.x { transition: opacity var(--dur-1) var(--ease-out); }')).toBe(false);
    expect(overshoots([0.16, 1, 0.3, 1])).toBe(false);
  });
});
