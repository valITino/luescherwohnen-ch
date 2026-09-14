import assert from "node:assert/strict";
import { test } from "node:test";
import { istFalleGefuellt, validateAnfrage } from "../lib/validate.mjs";

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);

test("gültige Anfrage mit E-Mail", () => {
  const r = validateAnfrage({ name: "Maria Muster", email: "maria@example.com", nachricht: "Ich brauche eine Beratung." });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
  assert.equal(r.values.telefon, "");
});

test("E-Mail oder Telefon ist Pflicht", () => {
  const r = validateAnfrage({ name: "Maria Muster", nachricht: "Ich brauche eine Beratung." });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email);
  assert.ok(r.errors.telefon);
});

test("zu kurze und zu lange Werte", () => {
  const r = validateAnfrage({ name: "M", telefon: "056 222 78 52", nachricht: "x".repeat(2001) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.nachricht);
});

test("Zeilenumbrüche im Namen und Steuerzeichen werden abgelehnt", () => {
  const r = validateAnfrage({
    name: `Maria${LF}Bcc: x@y.z`,
    email: "maria@example.com",
    nachricht: `Hallo, ich habe eine Frage${String.fromCharCode(7)} an Sie.`,
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.nachricht);
});

test("ungültige E-Mail und Telefonnummer", () => {
  const r = validateAnfrage({ name: "Maria Muster", email: "keine adresse", telefon: "abc", nachricht: "Ich brauche eine Beratung." });
  assert.equal(r.ok, false);
  assert.ok(r.errors.email);
  assert.ok(r.errors.telefon);
});

test("Windows-Zeilenumbrüche in der Nachricht werden normalisiert", () => {
  const r = validateAnfrage({ name: "Maria Muster", email: "maria@example.com", nachricht: `Zeile eins${CR}${LF}Zeile zwei ist lang genug.` });
  assert.equal(r.ok, true);
  assert.equal(r.values.nachricht, `Zeile eins${LF}Zeile zwei ist lang genug.`);
});

test("Honeypot erkennt gefüllte Falle", () => {
  assert.equal(istFalleGefuellt({ firma_website: "http://spam.example" }), true);
  assert.equal(istFalleGefuellt({ firma_website: "" }), false);
  assert.equal(istFalleGefuellt({}), false);
});
