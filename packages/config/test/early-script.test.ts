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
