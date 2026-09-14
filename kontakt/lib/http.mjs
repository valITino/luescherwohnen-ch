// HTTP-Hilfsfunktionen: Sicherheits-Header, Formular-Body, Client-IP, Origin.
export const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
};

export function sendHtml(res, status, html) {
  res.writeHead(status, { ...SECURITY_HEADERS, "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

export function sendText(res, status, text) {
  res.writeHead(status, { ...SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

export function redirect(res, location) {
  res.writeHead(303, { ...SECURITY_HEADERS, location });
  res.end();
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function readForm(req, maxBytes) {
  const type = String(req.headers["content-type"] ?? "").toLowerCase();
  if (!type.startsWith("application/x-www-form-urlencoded")) {
    throw new HttpError(415, "Nur Formulardaten werden angenommen.");
  }
  const declared = Number.parseInt(req.headers["content-length"] ?? "0", 10);
  if (declared > maxBytes) {
    throw new HttpError(413, "Die Anfrage ist zu gross.");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new HttpError(413, "Die Anfrage ist zu gross.");
    }
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return Object.fromEntries(new URLSearchParams(body));
}

export function clientIp(req, trustProxy) {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim() !== "") {
      return forwarded.split(",")[0].trim();
    }
  }
  return req.socket?.remoteAddress ?? "unbekannt";
}

export function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin || origin === "null") return true;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "";
  try {
    return new URL(origin).host === String(host).split(",")[0].trim();
  } catch {
    return false;
  }
}
