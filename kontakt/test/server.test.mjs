import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadConfig } from "../lib/config.mjs";
import { start } from "../server.mjs";

const gesendet = [];
let server;
let base;
const jetzt = { wert: 1_000_000 };

before(async () => {
  const config = loadConfig({
    HOST: "127.0.0.1",
    PORT: "0",
    MAIL_MODE: "log",
    KONTAKT_SECRET: "geheim-nur-fuer-tests-0123456789abcdef", // gitleaks:allow synthetischer Testwert
    KONTAKT_MIN_AGE_MS: "2000",
    RATE_LIMIT_PER_HOUR: "2",
    TRUST_PROXY: "1",
    PARTIALS_DIR: new URL("../../web/src/partials/", import.meta.url).pathname,
  });
  server = await start(config, {
    mailer: { send: async (values) => gesendet.push(values) },
    now: () => jetzt.wert,
    logger: { log() {} },
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

function post(pfad, daten, headers = {}) {
  return fetch(`${base}${pfad}`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "203.0.113.10", ...headers },
    body: new URLSearchParams(daten).toString(),
  });
}

const gueltig = { name: "Maria Muster", email: "maria@example.com", telefon: "", nachricht: "Bitte um eine Beratung zu Betten." };

test("healthz, Redirect und 404", async () => {
  assert.equal((await fetch(`${base}/kontakt/healthz`)).status, 200);
  const r = await fetch(`${base}/kontakt`, { redirect: "manual" });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get("location"), "/#kontakt");
  assert.equal((await fetch(`${base}/kontakt/gibt-es-nicht`)).status, 404);
});

test("Sicherheits-Header auf jeder Antwort", async () => {
  const r = await fetch(`${base}/kontakt/danke`);
  assert.equal(r.status, 200);
  assert.ok(r.headers.get("content-security-policy")?.includes("form-action 'self'"));
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
});

test("405, 415 und 413 werden abgewiesen", async () => {
  assert.equal((await fetch(`${base}/kontakt/senden`)).status, 405);
  const r415 = await fetch(`${base}/kontakt`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(r415.status, 415);
  const r413 = await post("/kontakt", { ...gueltig, nachricht: "x".repeat(20_000) });
  assert.equal(r413.status, 413);
});

test("fremder Origin wird abgelehnt, eigener Origin mit Port akzeptiert", async () => {
  const r = await post("/kontakt", gueltig, { origin: "https://boese.example" });
  assert.equal(r.status, 403);
  const host = new URL(base).host;
  const ok = await post("/kontakt", gueltig, { origin: `http://${host}`, host });
  assert.equal(ok.status, 200);
});

test("Honeypot: stille Danke-Weiterleitung ohne Versand", async () => {
  const r = await post("/kontakt/senden", { ...gueltig, firma_website: "spam" });
  assert.equal(r.status, 303);
  assert.equal(gesendet.length, 0);
});

test("ungültige Eingaben liefern 400 mit Fehlerliste", async () => {
  const r = await post("/kontakt", { name: "", nachricht: "kurz" });
  assert.equal(r.status, 400);
  const html = await r.text();
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('id="fehler-name"'));
});

test("zweistufiger Versand: Token zu schnell, dann gültig, dann Ratenlimit", async () => {
  const schritt1 = await post("/kontakt", gueltig);
  assert.equal(schritt1.status, 200);
  const html = await schritt1.text();
  const token = html.match(/name="token" value="([^"]+)"/)?.[1];
  assert.ok(token, "Token in der Bestätigungsseite");
  assert.ok(html.includes("Maria Muster"));

  const zuSchnell = await post("/kontakt/senden", { ...gueltig, token });
  assert.equal(zuSchnell.status, 400);
  assert.ok((await zuSchnell.text()).includes("sehr schnell"));

  jetzt.wert += 3000;
  const ok = await post("/kontakt/senden", { ...gueltig, token });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("location"), "/kontakt/danke");
  assert.equal(gesendet.length, 1);
  assert.equal(gesendet[0].name, "Maria Muster");

  const zweite = await post("/kontakt/senden", { ...gueltig, token });
  assert.equal(zweite.status, 303);
  const dritte = await post("/kontakt/senden", { ...gueltig, token });
  assert.equal(dritte.status, 429);
  assert.equal(gesendet.length, 2);
});

test("Angaben ändern zeigt das ausgefüllte Formular", async () => {
  const r = await post("/kontakt/aendern", gueltig);
  assert.equal(r.status, 200);
  assert.ok((await r.text()).includes('value="Maria Muster"'));
});
