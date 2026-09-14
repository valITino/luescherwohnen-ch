# ADR-0001: Minimal-Stack als statische Website mit reduziertem Bootstrap

**Status:** Vorgeschlagen (Umsetzung auf Anweisung des Repository-Eigentümers vom 14.09.2026 begonnen; Annahme durch den Auftraggeber offen)
**Datum:** 14.09.2026
**Entscheider:** offen (Auftraggeber: Andreas Längle)
**Bezug:** WEB-F-001, WEB-F-005, WEB-F-007, WEB-Q-001 bis WEB-Q-004; `D-012`, `D-015`, `D-016`

## Kontext

Das Briefing verlangt wenige Seiten, lieber Scrollen, einfache Navigation,
Barrierefreiheit, kein CMS, kein Tracking, Bootstrap bei einer
Eigenentwicklung, hell und gut lesbar für eine wenig technikaffine Zielgruppe
über 40 auf Desktop und Mobile. `CLAUDE.md` verlangt die einfachste Lösung,
progressive Enhancement, semantisches HTML und einen belegten Bedarf für jede
Laufzeitabhängigkeit. Inhalte pflegt der Auftraggeber selbst (`D-016`).

## Optionen

| Option | Vorteile | Nachteile | Betrieb und Sicherheit |
|---|---|---|---|
| A: Statische HTML-Seiten, Bootstrap 5 als reduzierter Sass-Build, selbst gehostet, kein JavaScript zur Laufzeit | Kleinste Angriffsfläche, schnell, ohne JavaScript vollständig nutzbar, Bootstrap-Wunsch erfüllt, Inhalte als Textdateien pflegbar | Gemeinsame Teile (Kopf, Fuss) brauchen einen kleinen Build-Schritt | Beliebiger statischer Webserver oder Container; keine Laufzeit-Updates |
| B: Statische Seiten mit eigenem CSS ohne Framework | Noch kleiner | Widerspricht dem ausdrücklichen Bootstrap-Wunsch; Grid und Reset selbst pflegen | wie A |
| C: Static Site Generator (z. B. Eleventy, Astro) | Vorlagen, Inhalte in Markdown | Zusätzliche Abhängigkeitsbäume und Konzepte für drei Seiten | wie A, grössere Lieferkette |
| D: Single-Page-Anwendung mit Framework | Interaktive Oberfläche | Ohne JavaScript leer, schlechter für SEO und Pflichtseiten, unnötig für Informationsseiten | JavaScript-Lieferkette zur Laufzeit |
| E: CMS (WordPress oder anderes) | Redaktion im Browser | Vom Briefing ausgeschlossen; laufende Sicherheitsupdates; die alte Website wurde in dieser Form kompromittiert | Datenbank, PHP-Laufzeit, Plugins |

## Entscheidung

Option A.

- Seiten liegen als HTML unter `web/src/pages/`, gemeinsame Teile unter
  `web/src/partials/`. Ein abhängigkeitsfreies Skript (`scripts/build.mjs`)
  fügt sie zusammen und kopiert Assets nach `web/dist/`.
- Bootstrap 5.3 wird als Sass-Teilmenge (Reboot, Typografie, Container, Grid,
  Tabellen, Buttons, Utilities) mit projekteigenen Design-Tokens kompiliert und
  selbst gehostet. Kein CDN, kein Bootstrap-JavaScript.
- Design-Tokens: Text `#272727`, Hintergrund `#ffffff` und `#f7f6f2`, Grün
  `#9cb703` nur als Fläche mit dunkler Schrift (Kontrast 6.54:1), Links
  `#5c6b00` (5.90:1 auf Weiss), Systemschrift, Grundschriftgrösse 18 px,
  Zeilenhöhe 1.6, Interaktionsflächen mindestens 44 px.
- Kein JavaScript in Inkrement 1. Progressive Enhancement bleibt Regel für
  spätere Inkremente (Formular, Bildgalerie).
- Werkzeuge: `html-validate` für HTML, Playwright mit axe-core für
  Barrierefreiheit, Tastatur, Responsivität und Drittanbieter-Freiheit.

## Folgen

- Inhalte sind einfache HTML-Dateien; Änderungen laufen über Pull Requests mit
  automatischer Prüfung (`D-016`, Option A der Entscheidungsvorlage).
- Kontaktformular, Karte und Suche sind in ADR-0002 geregelt; Container und
  Hosting folgen in ADR-0003 nach `D-007`.
- Rückbau: `web/` löschen; keine Daten, keine Dienste.

## Verifikation

- `npm run build` erzeugt `web/dist/` reproduzierbar aus dem Lockfile.
- `npm run lint:html` ohne Befund.
- `npm run test:web`: eine H1 und Landmarken je Seite, Navigation zu jedem
  Bereich, Skip-Link, keine Drittanbieter-Anfragen, kein horizontales
  Scrollen ab 320 px, Nutzbarkeit ohne JavaScript, axe-core ohne Verstösse
  gegen WCAG 2.x A/AA.
