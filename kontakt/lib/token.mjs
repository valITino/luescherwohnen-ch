// Signierter Zeitstempel für den Bestätigungsschritt: verhindert direkte
// Maschinen-Posts ohne Wartezeit und schränkt die Gültigkeit ein.
import { createHmac, timingSafeEqual } from "node:crypto";

function sign(secret, timestamp) {
  return createHmac("sha256", secret).update(String(timestamp)).digest("hex");
}

export function createToken(secret, now = Date.now()) {
  return `${now}.${sign(secret, now)}`;
}

export function verifyToken(secret, token, { now = Date.now(), minAgeMs, maxAgeMs }) {
  if (typeof token !== "string") return { ok: false, reason: "fehlt" };
  const [timestampText, signature] = token.split(".");
  const timestamp = Number.parseInt(timestampText ?? "", 10);
  if (!Number.isFinite(timestamp) || !signature) return { ok: false, reason: "ungültig" };
  const expected = Buffer.from(sign(secret, timestamp));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "ungültig" };
  }
  const age = now - timestamp;
  if (age < minAgeMs) return { ok: false, reason: "zu schnell" };
  if (age > maxAgeMs) return { ok: false, reason: "abgelaufen" };
  return { ok: true };
}
