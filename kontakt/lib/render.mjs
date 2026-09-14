// Rendert die Seiten des Dienstes mit denselben Kopf-, Fuss- und
// Formular-Teilen wie die statische Website (web/src/partials).
import { readFile } from "node:fs/promises";
import path from "node:path";

const INCLUDE = /<!--#include file="([^"]+)" -->/g;
const FELDER = ["name", "email", "telefon", "nachricht"];

export function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

async function loadPartial(dir, name, depth = 0) {
  if (depth > 5) throw new Error("Include-Verschachtelung zu tief");
  const source = await readFile(path.join(dir, name), "utf8");
  const parts = [];
  let last = 0;
  for (const match of source.matchAll(INCLUDE)) {
    const target = match[1].replace(/^partials\//, "");
    if (target.includes("..") || path.isAbsolute(target)) {
      throw new Error(`Unzulässiger Include-Pfad ${target}`);
    }
    parts.push(source.slice(last, match.index));
    parts.push((await loadPartial(dir, target, depth + 1)).trimEnd());
    last = match.index + match[0].length;
  }
  parts.push(source.slice(last));
  return parts.join("");
}

export async function createRenderer({ partialsDir }) {
  const [head, header, footer, formular] = await Promise.all(
    ["head.html", "header.html", "footer.html", "kontakt-formular.html"].map((name) =>
      loadPartial(partialsDir, name),
    ),
  );

  function layout({ title, description, body }) {
    const year = String(new Date().getFullYear());
    return [
      "<!DOCTYPE html>",
      '<html lang="de-CH">',
      "<head>",
      `  <title>${esc(title)}</title>`,
      `  <meta name="description" content="${esc(description)}">`,
      '  <meta name="robots" content="noindex">',
      head.trimEnd(),
      "</head>",
      "<body>",
      header.trimEnd(),
      '  <main id="inhalt" tabindex="-1" class="section">',
      '    <div class="container container--text">',
      body.trimEnd(),
      "    </div>",
      "  </main>",
      footer.replaceAll("{{year}}", year).trimEnd(),
      "</body>",
      "</html>",
      "",
    ].join("\n");
  }

  function formularHtml({ values = {}, errors = {} } = {}) {
    let html = formular.replaceAll("{{formular_titel}}", "");
    // Gleiche Meldung für mehrere Felder (E-Mail oder Telefon) nur einmal auflisten.
    const liste = [];
    for (const feld of FELDER) {
      if (errors[feld] && !liste.some((eintrag) => eintrag.text === errors[feld])) {
        liste.push({ feld, text: errors[feld] });
      }
    }
    const summary =
      liste.length === 0
        ? ""
        : `<div class="formular-fehler" role="alert" id="formular-fehler" tabindex="-1">` +
          `<p><strong>Bitte prüfen Sie Ihre Angaben:</strong></p><ul>` +
          liste.map(({ feld, text }) => `<li><a href="#${feld}">${esc(text)}</a></li>`).join("") +
          `</ul></div>`;
    html = html.replaceAll("{{fehler_liste}}", summary);
    for (const feld of FELDER) {
      html = html.replaceAll(`{{wert_${feld}}}`, esc(values[feld] ?? ""));
      html = html.replaceAll(
        `{{fehler_${feld}}}`,
        errors[feld] ? `<p class="feld__fehler" id="fehler-${feld}">${esc(errors[feld])}</p>` : "",
      );
      html = html.replaceAll(
        `{{aria_${feld}}}`,
        errors[feld] ? `aria-invalid="true" aria-describedby="fehler-${feld}"` : "",
      );
    }
    return html;
  }

  return { layout, formularHtml, esc };
}
