# Entscheidungen

Laufende Liste der Entscheidungen mit Grund, im Format von PSYber. Fachliche Freigaben trifft
der Auftraggeber; sie stehen im Freigabeprotokoll von `docs/requirements-analysis.md`.
Architekturentscheide mit grösserer Tragweite stehen zusätzlich als ADR in `docs/adr/`.

## Auftrag vom 20.11.2026 (Repository-Inhaber)

- **1.** **Demo-Website nach dem PSYber-System.** Stil, Design, Format und Logik von `valITino/PsySec`
  werden übernommen; die Demo läuft auf GitHub Pages des Forks. Das ist ein Auftrag des
  Repository-Inhabers, keine Produktionsfreigabe des Auftraggebers (Gate G0 bleibt offen).
- **2.** **Hell statt dunkel.** Auf Rückfrage entschieden: PSYber-System vollständig, aber helles,
  warmes Farbschema mit Lüscher-Grün; Cyber-Motive werden ersetzt. Grund: Briefing «hell und
  freundlich», Zielgruppe 40+.

## Technik

- **3.** **Astro 7, statisch, Vanilla TypeScript im Browser** wie bei PSYber (ADR-0001). Erfüllt
  CLAUDE.md «statisch bzw. serverseitig gerenderte Seiten und Vanilla JavaScript»: Jede Seite ist
  ohne JavaScript vollständig lesbar.
- **4.** **Kein Bootstrap.** Das PSYber-System bringt eigene Tokens und Bausteine (Tailwind nur als
  Reset und für Utilities). Der Bootstrap-Wunsch aus dem Briefing bleibt als offene Frage D-015.
- **5.** **Monorepo wie PSYber**, aber nur mit dem Nötigen: `apps/web`, `packages/ui`,
  `packages/config`. Nicht übernommen: Umfrage, Surprise-Seite, API, Turnstile, Zählung,
  Easter Eggs, Analyse-Skripte (kein Bedarf, Tracking ausgeschlossen).
- **6.** **Kontaktformular nur mit Empfänger.** Ohne `PUBLIC_CONTACT_ENDPOINT` zeigt die Produktion
  direkte Wege (Anrufen, E-Mail, Route); die Vorschau simuliert das Formular. Grund: Empfang,
  Aufbewahrung und Löschung sind offen (D-003, D-013). Ein künftiger Empfänger muss dieselben
  Regeln serverseitig prüfen (`apps/web/src/lib/contact-form.ts`).
- **7.** **Karte als Link statt Einbettung** (OpenStreetMap). Keine Daten an Dritte, bevor jemand
  klickt (D-004).
- **8.** **Container: nginx-unprivileged (Mainline 1.31.7, Alpine 3.24) mit `apk upgrade`** (ADR-0003).
  Die stabile Linie 1.30.6 hatte vier kritische, behobene Lücken, für die es noch kein
  unprivileged-Image 1.30.7 gibt; nginx.org empfiehlt ohnehin Mainline.
- **9.** **Security-Header aus einer Quelle** (`packages/config/src/security.mjs`): CSP-Meta mit Hashes
  für jede Seite, die übrigen Header als generiertes nginx-Include.
- **10.** **CI pfadbasiert ohne Fremd-Actions für Scanner.** Dispatcher `scripts/ci-changes.mjs`;
  Trivy, Syft, hadolint, actionlint und lychee laufen als per Digest gepinnte Container. Nur
  offizielle GitHub-Actions, per voller SHA gepinnt.
- **11.** **Kein Registry-Push, kein Deployment ausser Pages.** Docker Hub und Zielplattform sind offen
  (D-007, D-008).

## Gestaltung

- **12.** **Schrift eine Stufe grösser** als bei PSYber (Fliesstext 17–19 px, Labels 14 px).
- **13.** **Kicker «01 / Sortiment»** statt «0x01 // …»; Nummern in Mono und dunklem Grün.
- **14.** **Runde Bild-Bühne statt Globus** im Hero; Headline endet links davon.
- **15.** **Telefon-Knopf in Leiste und Kapsel**, weil Anrufen für die Zielgruppe der wichtigste Weg ist.
  Unter 360 px Breite steht er nur im Menü.
- **16.** **Öffnungsstatus im Hero und in der Besuchs-Bühne** (Zeitzone Europe/Zurich). Feiertage und
  Betriebsferien sind nicht bekannt; darum der Zusatz «laut Öffnungszeiten» im Kontakt.
- **17.** **Band statt Phishing-Ticker**: Sortiment, Bodenbeläge und Service als Endlosband.
- **18.** **«Wir stehen für» statt Terminal** in «Über uns»; dazu Zeitleiste der Firmengeschichte und
  die beiden Standorte.
- **19.** **Keine Reichweitenzählung** (Briefing: kein Tracking).
- **20.** **Favicon «L» auf Lüscher-Grün** aus der Wortmarke abgeleitet (Vorschlag, D-005).

## Inhalte

- **21.** **Texte nur aus belegten Quellen**: `docs/homepage-anforderungen.md`, `docs/index.html`,
  `docs/Homepage.docx` (Bildschirmfotos der bisherigen Website). Kürzungen und Verbindungen sind
  als Entwurf zu verstehen und vom Auftraggeber freizugeben:
  - Hero: «Wohnen heisst leben. Und sich wohl fühlen.» aus den Slogans der bisherigen Website.
  - Sortiment-Texte aus «Unternehmen» und «Unsere Kompetenzen».
  - «Haltung», «Service», «Über uns», «Aktuell» aus den jeweiligen Seiten, gekürzt.
- **22.** **Samstag 10:00–16:00 Uhr** nach `docs/index.html` (neuester Stand im Repository); die
  frühere Website nannte 9:00 Uhr (W1). «Sonntag geschlossen» von der früheren Website.
- **23.** **Keine Generationenzählung, keine Funktion «Inhaber»/«Geschäftsführer»** (W2, W3):
  Michael Längle steht als «Geschäftsleiter» wie im Impressum.
- **24.** **Projekte ohne Ortsangaben**, nur in der Vorschau sichtbar (WEB-F-006); in Produktion erst mit
  `PUBLIC_SHOW_PROJECTS=true` nach Freigabe.
- **25.** **Interview nur als kurzes Zitat mit Quelle**, kein Nachdruck des Zeitschriftentexts.
- **26.** **Keine Shop-Inhalte, keine Preise, keine AGB** (Phase 2, separater Auftrag).
- **27.** **Mobilnummer 079 … und Fax** nicht auf der Startseite; das Fax steht nur im Impressum wie
  bisher (W9).

## Nach den unabhängigen Reviews (20.11.2026)

- **28.** **Formular-Regeln strenger:** Anliegen nur aus der eigenen Liste (`Object.hasOwn`, nicht
  `in`), Telefonnummer mit mindestens sechs Ziffern. Honeypot und Bestätigung reisen im Payload mit.
- **29.** **Dispatcher:** Änderungen an `_web.yml`/`_container.yml` lösen ihre Module aus, `ci.yml`
  alles; `docker-up.sh` zählt zum Container. Auf `main` prüft die CI immer den ganzen Stand, weil
  Pages ihn veröffentlicht; laufende Läufe werden dort nicht abgebrochen.
- **30.** **Pages nur nach erfolgreicher CI** (`workflow_run`), mit Prüfung des Artefakts vor der
  Veröffentlichung. Ausgecheckt wird nur `main` selbst und nur, wenn die CI genau diesen Commit
  geprüft hat; von Hand nur auf `main` (CodeQL-Befunde im ersten PR-Lauf auf GitHub).
- **31.** **Security-Header auf allen Antworten** des Containers (auch 301, 400, 405), Zugriffslog
  ohne IP und User-Agent, nginx-Konfiguration root-eigen.
- **32.** **HSTS vorsichtig:** ein Tag ohne Subdomains; ein Jahr mit Subdomains und Preload nur mit
  `PUBLIC_HSTS_PRELOAD=true`.
- **33.** **Band ohne JavaScript steht still** (WCAG 2.2.2), wie bei reduzierter Bewegung.
- **34.** **Öffnungsstatus** nennt den Abstand in Tagen («heute», «morgen», Wochentag, «nächsten …»).
- **35.** **Abhängigkeiten:** `markdownlint-cli2` auf 0.24 (behebt HIGH-Lücken in Parsern zur
  Build-Zeit), Override für KaTeX. `pnpm audit` ohne Befund.
- **36.** **CodeQL (SAST)** für JavaScript/TypeScript und Actions sowie eine Sperre für PHP-,
  Archiv- und Binärdateien in der CI.
