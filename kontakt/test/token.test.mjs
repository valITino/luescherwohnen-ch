import assert from "node:assert/strict";
import { test } from "node:test";
import { createToken, verifyToken } from "../lib/token.mjs";

const secret = "geheim-nur-fuer-tests-0123456789abcdef"; // gitleaks:allow synthetischer Testwert
const fenster = { minAgeMs: 2000, maxAgeMs: 3_600_000 };

test("gültiges Token nach Wartezeit", () => {
  const token = createToken(secret, 1_000_000);
  assert.equal(verifyToken(secret, token, { now: 1_003_000, ...fenster }).ok, true);
});

test("zu schnell, abgelaufen, manipuliert, fehlend", () => {
  const token = createToken(secret, 1_000_000);
  assert.equal(verifyToken(secret, token, { now: 1_000_500, ...fenster }).reason, "zu schnell");
  assert.equal(verifyToken(secret, token, { now: 1_000_000 + 3_600_001, ...fenster }).reason, "abgelaufen");
  assert.equal(verifyToken(secret, `${token.slice(0, -1)}0`, { now: 1_003_000, ...fenster }).reason, "ungültig");
  assert.equal(verifyToken("anderes-secret-0123456789abcdef0123456789", token, { now: 1_003_000, ...fenster }).reason, "ungültig");
  assert.equal(verifyToken(secret, undefined, { now: 1_003_000, ...fenster }).reason, "fehlt");
  assert.equal(verifyToken(secret, "abc", { now: 1_003_000, ...fenster }).reason, "ungültig");
});
