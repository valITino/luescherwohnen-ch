#!/usr/bin/env node
// Kleiner statischer Server für Vorschau und Tests: node scripts/serve.mjs [port] [dir]
// Nur 127.0.0.1, keine Verzeichnislisten, kein Zugriff ausserhalb des Ordners.
// Optional reicht er /kontakt an den Kontakt-Dienst weiter (KONTAKT_UPSTREAM,
// z. B. http://127.0.0.1:4174), so wie nginx im Container.
import { createServer, request as httpRequest } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const [port = "4173", dir = "web/dist"] = process.argv.slice(2);
const root = path.resolve(dir);
const upstream = process.env.KONTAKT_UPSTREAM ? new URL(process.env.KONTAKT_UPSTREAM) : null;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function notFound(res) {
  // Wie im Container (nginx error_page): eigene 404-Seite, wenn vorhanden.
  try {
    const page = await readFile(path.join(root, "404.html"));
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(page);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
}

function proxy(req, res) {
  const forwarded = httpRequest(
    {
      hostname: upstream.hostname,
      port: upstream.port,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, "x-forwarded-for": req.socket.remoteAddress ?? "" },
    },
    (answer) => {
      res.writeHead(answer.statusCode ?? 502, answer.headers);
      answer.pipe(res);
    },
  );
  forwarded.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("502 Kontakt-Dienst nicht erreichbar");
  });
  req.pipe(forwarded);
}

createServer(async (req, res) => {
  if (upstream && (req.url === "/kontakt" || req.url?.startsWith("/kontakt/"))) {
    return proxy(req, res);
  }
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) {
      return await notFound(res);
    }
    const info = await stat(file);
    if (!info.isFile()) {
      return await notFound(res);
    }
    res.writeHead(200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(await readFile(file));
  } catch {
    await notFound(res);
  }
}).listen(Number(port), "127.0.0.1", () => {
  console.log(`serve: ${root} unter http://127.0.0.1:${port}/`);
});
