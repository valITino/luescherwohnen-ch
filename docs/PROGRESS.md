# Stand je Phase

## 20.11.2026: Bewegungssystem

Auftrag des Repository-Inhabers: Bewegung der Demo vereinheitlichen und verfeinern
(`docs/DECISIONS.md` 37, `docs/DESIGN.md` Abschnitt 6). Umgesetzt in neun Schritten:
gemeinsame Tokens für CSS und GSAP, Hero-Blende, Menü-Vorhang, Kapsel, die sich auffaltet,
Bild-Enthüllung, Überschriften mit Kicker, Auftritte, die Sprünge überstehen, Seitenwechsel mit
stillstehendem Header und ein Durchgang nach den Regeln (nur `transform`, `opacity`,
`clip-path`, kein Überschwingen). Neue Wächter: `packages/ui/test/motion-tokens.test.ts` und
`scripts/motion-guard.test.ts`; neue und verschärfte e2e-Tests für Hero, Menü, Kapsel,
Auftritte, Pause, Sprünge und Seitenwechsel. Kein zusätzliches Paket, JavaScript 59,3 KB von
120 KB.

Vier unabhängige Prüfungen (Leistung, Zustände und Barrierefreiheit, Code, Gestaltung) fanden
danach u. a.: Milchglas der Kapsel weg, Kapsel beim Seitenwechsel aufgeblasen, Header-Wechsel
träge und kurz leer, Lead im Hero zu spät (LCP auf dem Handy schlechter), Bild-Enthüllung teuer
beim Wischen, Auftritte nach dem Fortsetzen doppelt. Behoben in zwei Schritten
(`docs/DECISIONS.md` 38), gemessen gegen den Stand davor (`db2ca8b`, Chromium ohne Grafikchip):

- LCP Handy 1292 → 76 ms (4-fach gedrosselt 1392 → 188 ms), Desktop unverändert um 100 ms.
- Header-Wechsel: erste Reaktion nach 20–40 statt rund 100 ms, ruhig nach 520–580 statt
  630–760 ms, leer höchstens 2–3 Bilder wie zuvor.
- Wischen auf dem Handy (4-fach gedrosselt): 26–40 ausgefallene Bilder statt 55–63.
- Drei neue und ein erweiterter e2e-Test (Desktop und Handy); alle schlagen auf `db2ca8b` fehl
  und laufen auf dem neuen Stand.

Zweite Prüfrunde gegen `72b5b36` (vier Blickwinkel, sechs Befunde ab «mittel» je zweimal
gegengeprüft, `docs/DECISIONS.md` 39). Behoben: aufgeblasene Kapsel beim Seitenwechsel zu einer
Marke (hoch), Bilder, die wegen des Clips nicht vorluden (mittel), Bewegungsschalter ohne Wirkung
auf Header und Menü, Fokus fiel beim Formwechsel auf `<body>`, Sprünge endeten bei stockender
Darstellung zu früh, Lenis blockierte jede Berührung auf dem Handy; dazu neun kleinere Punkte.
Fünf neue e2e-Tests (Seitenwechsel zu einer Marke, Vorladen beim allmählichen Scrollen, Fokus,
Schalter, Sprung aus dem Hero); die ersten vier schlagen auf `72b5b36` fehl. Gemessen beim
allmählichen Scrollen: Abruf der Bilder rund 1200 px vor dem Bild statt 150 px darin.

Dritte Prüfrunde gegen `f1173cc` (fünf Blickwinkel, `docs/DECISIONS.md` 40). Behoben: Header ohne
`checkVisibility()` (Safari vor 17.4) eingefroren, ein graues Bild im stehenden Header beim
Seitenwechsel, Schalter ohne Wirkung auf Lenis, Hero und Haltung; dazu sichtbare Bild-Enthüllung
ab einem Viertel, kein Aufsteigen über ein fehlendes Foto, Überschriften ohne Sprung im Umbruch,
genaue Landung nach Sprüngen aus der Leiste, Fokus in der Navigation. Acht neue e2e-Tests (fünf
auf Desktop und Handy, drei nur am Desktop), zwei bestehende geschärft.

Vierte Prüfrunde gegen `3bcbbd6` (fünf Blickwinkel, `docs/DECISIONS.md` 41). Die neuen Tests der
dritten Runde schlagen auf `f1173cc` alle aus dem beabsichtigten Grund fehl. Behoben: zwei
Befunde «mittel» zur Bild-Enthüllung (Wartezeit am Rand 700 → 250 ms, hohe Rahmen ab 12 % der
Fensterhöhe), dazu Anhalten mitten im Sprung, stiller Hero bei angehaltener Bewegung, Header beim
Seitenwechsel zu einer Marke und zurück, spätes Foto blendet ein und weitere kleine Punkte. Drei
neue e2e-Tests (einer auf Desktop und Handy, zwei nur am Desktop), sechs bestehende geschärft
(berichtigt in der fünften Runde).

Fünfte Prüfrunde gegen `ab7e9e9` (vier Blickwinkel, `docs/DECISIONS.md` 42). Die neuen Tests der
vierten Runde schlagen auf `3bcbbd6` aus dem beabsichtigten Grund fehl; einer davon war wackelig
(der Browser zeigt die neue Seite mitunter vor ihrem Skript). Behoben: Test und Dokumentation
zum Seitenwechsel, Kapsel bleibt von Seite zu Seite stehen, spät geladenes Foto blendet nach dem
Fortsetzen nicht nochmals ein, Bilder steigen an der Fensterkante auf und öffnen sich auch im
untersten Streifen, das Porträt am Desktop ohne leeres Band, dazu sieben kleinere Punkte. Sechs
neue e2e-Tests (vier auf Desktop und Handy, zwei nur am Desktop), drei bestehende geschärft;
der Test zum Seitenwechsel lief danach zwölfmal hintereinander grün.

Restposten (`docs/DECISIONS.md` 43): Menüpunkt am Desktop springt unter dem Vorhang, Leiste auf
ganzen Pixeln, Rahmen nebeneinander als eine Folge, Header ohne JavaScript, Bewegungswächter als
Positivliste, Testserver mit Cache-Regeln der Produktion. Ein neuer e2e-Test (ohne JavaScript).

Alles läuft (`docs/DECISIONS.md` 44): Kein e2e-Test wird mehr übersprungen; jeder läuft auf
Desktop und Handy mit dem, was das Gerät tut, die HTML-Prüfungen einmal im eigenen Projekt. Das
Skript jeder Seite läuft vor ihrem ersten Bild (Seitenwechsel zu einer Marke ohne Sprung,
Layoutverschiebung beim Laden 0, erstes Bild früher). Bewegungsschalter faltet sich über
`clip-path`, Fokus bleibt im Formwechsel sichtbar, Taste während des Ausgleitens ohne neues
Layout. Drei neue e2e-Tests, drei neue Unit-Tests.

## 20.11.2026: Demo nach dem PSYber-System

Auftrag des Repository-Inhabers: Stil, Design, Format und Logik von `valITino/PsySec`
übernehmen, Demo auf GitHub Pages, Docker zum Testen. Auf Rückfrage: helles Farbschema.

Erledigt:

- Bestand inventarisiert: Texte aller Bildschirmfotos in `docs/Homepage.docx`, 148 Originalbilder
  in `docs/ressources/`; 19 Widersprüche und Lücken gesammelt (`docs/TODO.md`).
- **Sicherheitsbefund**: zwei WordPress-Hintertüren als ZIP im Bildbestand (`docs/TODO.md`).
- Monorepo wie PSYber (`apps/web`, `packages/ui`, `packages/config`), Astro 7, pnpm 12.
- Designsystem hell übertragen, Kontraste berechnet (alle Texte ≥ 4,5:1, Bedienelemente ≥ 3:1).
- Logo vektorisiert, Favicons, App-Icons und Vorschaubild erzeugt; 17 Fotos ohne Metadaten
  übernommen.
- Startseite: Hero mit Uhrzeit und Öffnungsstatus, Besuch, Sortiment, Band, Haltung, Service,
  Projekte (nur Vorschau), Aktuell, Über uns mit Firmengeschichte, Kontakt. Dazu Impressum,
  Datenschutz (Entwurf), Styleguide, 404, robots.txt, security.txt, humans.txt, Sitemap.
- Kontaktformular mit Inline-Validierung (in der Vorschau simuliert, in Produktion aus).
- Container: nginx ohne root, nur lesbar, Security-Header aus einer Quelle, Healthcheck.
- CI: Dispatcher mit wiederverwendbaren Workflows, Pages-Workflow, Dependabot.
- Fehler aus den Tests behoben: Header zu breit bei 320 px, Footer-Umbrüche bei 768 px, E-Mail-
  Umbruch, Lenis-Sprung an veraltete Seitenlänge (auch in PSYber angelegt), Rechte im Image.

Unabhängige Reviews (Rollen `code-reviewer` und `security-reviewer`): im neuen Code kein
Critical und kein High. Alle Medium- und Low-Befunde sind behoben (`docs/DECISIONS.md` 28–36),
offen bleibt der Critical-Befund im Altbestand (Schadcode, `docs/TODO.md`).

Prüfungen am Schluss (alle grün, exakte Befehle in der Abschlussmeldung):

- `pnpm lint`, `pnpm lint:md`, `pnpm typecheck`, `pnpm test` (48 Unit-Tests), `pnpm audit`
- `pnpm build:pages && pnpm build`, `pnpm budgets`: 58,5 KB JS (Budget 120 KB)
- `pnpm e2e`: 99 Tests auf Desktop und Mobile, darunter axe WCAG 2.2 AA auf allen Seiten,
  Layout bei acht Breiten, Menü und Fokus, Formular, Basis-Pfad-Links, SEO
- `pnpm check:headers`: 49 Container-Prüfungen (Header auf allen Antworten, Traversal, 405, Log)
- Trivy Image und Repository inklusive Dev-Abhängigkeiten: 0 Schwachstellen, 0 Secrets,
  0 Fehlkonfigurationen; SBOM (CycloneDX, 725 Komponenten); hadolint, actionlint ohne Befund
- `node scripts/check-forbidden-files.mjs`, `python scripts/validate_claude_config.py` und
  Python-Tests

Offen: siehe `docs/TODO.md`. Gate G0 (D-001 bis D-008) ist weiterhin offen; die Demo ist keine
Produktionsfreigabe.
