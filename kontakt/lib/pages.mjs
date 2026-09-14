// Seiteninhalte des Dienstes (Bestätigung, Danke, Fehler). Alle Werte werden
// beim Einsetzen HTML-kodiert.
import { esc } from "./render.mjs";

const FELDER = ["name", "email", "telefon", "nachricht"];

function hiddenFields(values, extra = {}) {
  return [...FELDER.map((feld) => [feld, values[feld] ?? ""]), ...Object.entries(extra)]
    .map(([name, value]) => `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`)
    .join("\n      ");
}

export function formular(html, { titel = "Anfrage senden", hinweis = "" } = {}) {
  return {
    title: `${titel} – Lüscher Wohnen AG`,
    description: "Kontaktformular der Lüscher Wohnen AG.",
    body: `      <h1>${esc(titel)}</h1>\n${hinweis ? `      <p class="hinweis" role="status">${esc(hinweis)}</p>\n` : ""}${html}`,
  };
}

export function bestaetigung(values, token, basePath) {
  const zeile = (label, wert) => `        <dt>${label}</dt>\n        <dd>${wert ? esc(wert) : "keine Angabe"}</dd>`;
  const nachricht = esc(values.nachricht).replaceAll("\n", "<br>");
  return {
    title: "Anfrage prüfen – Lüscher Wohnen AG",
    description: "Bitte prüfen Sie Ihre Angaben, bevor Sie die Anfrage senden.",
    body: `      <h1>Anfrage prüfen</h1>
      <p>Bitte prüfen Sie Ihre Angaben. Mit «Anfrage senden» schicken Sie uns die Nachricht per E-Mail.</p>
      <dl class="zusammenfassung">
${zeile("Name", values.name)}
${zeile("E-Mail", values.email)}
${zeile("Telefon", values.telefon)}
        <dt>Nachricht</dt>
        <dd class="zusammenfassung__nachricht">${nachricht}</dd>
      </dl>
      <form method="post" action="${basePath}/senden" class="formular-aktionen">
      ${hiddenFields(values, { token })}
        <button class="btn btn-primary btn-lg" type="submit">Anfrage senden</button>
      </form>
      <form method="post" action="${basePath}/aendern" class="formular-aktionen">
      ${hiddenFields(values)}
        <button class="btn btn-outline-dark" type="submit">Angaben ändern</button>
      </form>`,
  };
}

export function danke() {
  return {
    title: "Vielen Dank – Lüscher Wohnen AG",
    description: "Ihre Anfrage ist bei uns eingegangen.",
    body: `      <h1>Vielen Dank für Ihre Anfrage</h1>
      <p>Wir haben Ihre Nachricht erhalten und melden uns bei Ihnen.</p>
      <p><a class="btn btn-primary" href="/">Zur Startseite</a></p>`,
  };
}

export function fehler(text, { titel = "Das hat leider nicht geklappt" } = {}) {
  return {
    title: `${titel} – Lüscher Wohnen AG`,
    description: "Die Anfrage konnte nicht verarbeitet werden.",
    body: `      <h1>${esc(titel)}</h1>
      <p>${esc(text)}</p>
      <p><a class="btn btn-primary" href="/#kontakt">Zurück zum Kontakt</a></p>`,
  };
}

export function nichtGefunden() {
  return fehler("Diese Seite gibt es nicht.", { titel: "Seite nicht gefunden" });
}
