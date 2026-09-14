#!/usr/bin/env node
// Fügt die Seiten aus web/src zusammen und kopiert Assets nach web/dist.
// Unterstützt <!--#include file="partials/name.html" --> und {{year}}.
// Keine Abhängigkeiten ausser Node.js.
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "web/src";
const DIST = "web/dist";
const INCLUDE = /<!--#include file="([^"]+)" -->/g;
const MAX_DEPTH = 5;

async function render(file, depth = 0) {
  if (depth > MAX_DEPTH) {
    throw new Error(`Include-Verschachtelung zu tief in ${file}`);
  }
  const source = await readFile(path.join(SRC, file), "utf8");
  const parts = [];
  let last = 0;
  for (const match of source.matchAll(INCLUDE)) {
    const target = match[1];
    if (target.includes("..") || path.isAbsolute(target)) {
      throw new Error(`Unzulässiger Include-Pfad ${target} in ${file}`);
    }
    parts.push(source.slice(last, match.index));
    parts.push((await render(target, depth + 1)).trimEnd());
    last = match.index + match[0].length;
  }
  parts.push(source.slice(last));
  return parts.join("");
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(path.join(DIST, "assets"), { recursive: true });
  await cp(path.join(SRC, "assets"), path.join(DIST, "assets"), { recursive: true });

  const year = String(new Date().getFullYear());
  const pages = (await readdir(path.join(SRC, "pages"))).filter((name) => name.endsWith(".html"));
  for (const page of pages) {
    const html = (await render(path.join("pages", page)))
      .replaceAll("{{year}}", year)
      // Formular-Platzhalter: statisch leer, der Kontakt-Dienst füllt sie bei Fehlern.
      .replaceAll("{{formular_titel}}", "<h3>Anfrage senden</h3>")
      .replace(/\{\{(?:wert|fehler|aria)_[a-z_]+\}\}|\{\{fehler_liste\}\}/g, "")
      .replace(/ +>/g, ">")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n");
    if (INCLUDE.test(html) || html.includes("{{")) {
      throw new Error(`Unaufgelöste Platzhalter in ${page}`);
    }
    await writeFile(path.join(DIST, page), html);
  }
  console.log(`build: ${pages.length} Seiten nach ${DIST} geschrieben`);
}

main().catch((error) => {
  console.error(`build: ${error.message}`);
  process.exitCode = 1;
});
