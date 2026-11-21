import { describe, expect, it } from 'vitest';
import { moveModuleToHead, staticImports } from '../src/early-script.mjs';

describe('Modul vor dem ersten Bild (early-script)', () => {
  it('findet statische Importe, nicht die dynamischen', () => {
    const code =
      'const m=()=>i.map(i=>d[i]);import{a as e,i as t}from"./header.C3d.js";' +
      'import"./side.js";export{x}from"../shared/y.js";' +
      'const s=()=>import("./scroll.D.js");';
    expect(staticImports(code)).toEqual(['./header.C3d.js', './side.js', '../shared/y.js']);
  });

  it('kennt jede Form des statischen Imports, so wie der Bundler sie schreibt', () => {
    const forms: [string, string[]][] = [
      ['import"./a.js";', ['./a.js']],
      ["import './a.js'", ['./a.js']],
      ['import a from"./a.js";', ['./a.js']],
      ['import*as a from"./a.js";', ['./a.js']],
      ['import a,{b as c}from"./a.js";', ['./a.js']],
      ['import {\n  a,\n  b\n} from\n  "./a.js";', ['./a.js']],
      ['export*from"./a.js";', ['./a.js']],
      ['export{a as default}from"../b/a.js";', ['../b/a.js']],
      // Mehrere, auch ohne Strichpunkt dazwischen, jeder Pfad einmal.
      ['let x=1\nimport"./a.js"\nimport{b}from"./b.js";import"./a.js";', ['./a.js', './b.js']],
      ['export let a\nimport"./a.js"', ['./a.js']],
      ['function f(){}import{a}from"./a.js";', ['./a.js']],
    ];
    for (const [code, expected] of forms) {
      expect(staticImports(code), code).toEqual(expected);
    }
  });

  it('lässt aus, was kein statischer Import eines eigenen Moduls ist', () => {
    const none = [
      // Dynamisch: lädt erst bei Bedarf.
      'const s=()=>import("./scroll.js");',
      'await import(`./scroll.js`)',
      // Pakete und Adressen: keine Datei neben dem Modul.
      'import"gsap";import{a}from"gsap/SplitText";',
      'import a from"https://example.com/a.js";import"/abs.js";',
      // Ein Name, der auf «import» endet, und ein Text mit «from».
      'reimport"./a.js";',
      'const t="von from";const u="./a.js";',
      // Kein Pfad nach dem Schrägstrich, kein schliessendes Anführungszeichen.
      'import"./";import"../";',
      'import"./a.js',
    ];
    for (const code of none) {
      expect(staticImports(code), code).toEqual([]);
    }
  });

  it('braucht für lange Läufe von Leerraum keine quadratische Zeit', () => {
    // Als regulärer Ausdruck brauchte diese Suche hier Minuten (CodeQL js/polynomial-redos).
    const spaces = '\t'.repeat(400_000);
    const start = performance.now();
    expect(staticImports(`\timport${spaces}`)).toEqual([]);
    expect(staticImports(`\texport${spaces}`)).toEqual([]);
    expect(staticImports(`import${spaces}"./a.js"`)).toEqual(['./a.js']);
    expect(staticImports(`${'import '.repeat(60_000)}x`)).toEqual([]);
    expect(performance.now() - start).toBeLessThan(2_000);
  });

  it('setzt das Modul blockierend in den Kopf, die Importe davor', () => {
    const html =
      '<html><head><meta charset="utf-8"><meta http-equiv="content-security-policy" content="x">' +
      '</head><body><main>Inhalt</main>' +
      '<script type="module" src="/base/_astro/page.js"></script></body></html>';
    const moved = moveModuleToHead(html, (src) =>
      src === '/base/_astro/page.js' ? ['/base/_astro/header.js'] : [],
    );
    expect(moved).toBe(
      '<html><head><meta charset="utf-8"><meta http-equiv="content-security-policy" content="x">' +
        '<link rel="modulepreload" href="/base/_astro/header.js">' +
        '<script type="module" blocking="render" src="/base/_astro/page.js"></script></head>' +
        '<body><main>Inhalt</main></body></html>',
    );
    // Nach der CSP im Kopf: Sie gilt auch für das Modul.
    expect(moved.indexOf('blocking="render"')).toBeGreaterThan(moved.indexOf('http-equiv'));
  });

  it('lässt Seiten ohne Modul und Skripte mit Inhalt unverändert', () => {
    const plain = '<html><head></head><body><p>x</p></body></html>';
    expect(moveModuleToHead(plain, () => [])).toBe(plain);
    const json =
      '<html><head><script type="application/ld+json">{}</script></head><body></body></html>';
    expect(moveModuleToHead(json, () => [])).toBe(json);
  });
});
