#!/usr/bin/env node
// Kleiner statischer Server für Vorschau und Tests: node scripts/serve.mjs [port] [dir]
// Nur 127.0.0.1, keine Verzeichnislisten, kein Zugriff ausserhalb des Ordners.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const [port = "4173", dir = "web/dist"] = process.argv.slice(2);
const root = path.resolve(dir);
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

function notFound(res) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
}

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) {
      return notFound(res);
    }
    const info = await stat(file);
    if (!info.isFile()) {
      return notFound(res);
    }
    res.writeHead(200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(await readFile(file));
  } catch {
    notFound(res);
  }
}).listen(Number(port), "127.0.0.1", () => {
  console.log(`serve: ${root} unter http://127.0.0.1:${port}/`);
});
