import assert from "node:assert/strict";
import { test } from "node:test";
import { createRenderer, esc } from "../lib/render.mjs";

const partialsDir = new URL("../../web/src/partials/", import.meta.url).pathname;

test("esc kodiert HTML-Sonderzeichen", () => {
  assert.equal(esc(`<a href="x">'&`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
});

test("Formular übernimmt Werte kodiert und markiert Fehler", async () => {
  const render = await createRenderer({ partialsDir });
  const html = render.formularHtml({
    values: { name: "<script>alert(1)</script>", nachricht: "Zeile" },
    errors: { name: "Bitte Namen angeben." },
  });
  assert.ok(html.includes('value="&lt;script&gt;alert(1)&lt;/script&gt;"'));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes('aria-invalid="true" aria-describedby="fehler-name"'));
  assert.ok(html.includes('role="alert"'));
  assert.ok(!html.includes("{{"));
});

test("Layout enthält Kopf, Navigation und Fusszeile der Website", async () => {
  const render = await createRenderer({ partialsDir });
  const html = render.layout({ title: "Test", description: "Beschreibung", body: "<h1>Test</h1>" });
  assert.ok(html.includes('<html lang="de-CH">'));
  assert.ok(html.includes('aria-label="Hauptnavigation"'));
  assert.ok(html.includes("<footer"));
  assert.ok(!html.includes("{{year}}"));
});
