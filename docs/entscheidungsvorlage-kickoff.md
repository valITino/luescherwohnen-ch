# Entscheidungsvorlage für den Kick-off

**Stand:** 14.09.2026
**Zweck:** Alle offenen Entscheidungen aus dem Entscheidungsregister
(`docs/requirements-analysis.md`) mit Belegen, Optionen und einer Empfehlung des
Teams, damit der Auftraggeber sie im Kick-off beantworten kann.
**Entscheider:** Andreas Längle (Briefing, Abschnitt 9)
**Regel:** Empfehlungen sind Vorschläge. Eine Entscheidung gilt erst mit Datum,
Entscheider und Wortlaut im Freigabeprotokoll der Anforderungsanalyse.

Für jede Entscheidung gilt: `Entscheid:` bleibt leer, bis der Auftraggeber
entschieden hat.

## Gate G0: Blocker für Phase 1

### D-001 Firmenangaben für Impressum, Kontakt und strukturierte Daten

- **Frage:** Sind die folgenden Angaben aktuell und so zu veröffentlichen?
- **Belege:** `old/Homepage.docx` (Impressum der alten Website): Lüscher
  Wohnen AG, Weite Gasse 9, 5400 Baden; Telefon +41 56 222 78 52; Fax
  +41 56 222 32 75; `info@luescherwohnen.ch`; Geschäftsleiter Michael Längle;
  Handelsregister Kanton Aargau; MwSt-Nr. CHE 116.367.369.
  `old/index.html`: Telefon und E-Mail identisch.
- **Empfehlung:** Angaben gegen den aktuellen Handelsregisterauszug prüfen,
  Faxnummer nur behalten, wenn sie noch bedient wird; verantwortliche Person
  für die Website benennen.
- **Entscheid:** offen

### D-002 Sprache

- **Frage:** Deutsch als einzige Sprache des MVP?
- **Belege:** Briefing wählt keine Mehrsprachigkeit; alle Bestandstexte sind
  Deutsch in Schweizer Schreibweise.
- **Empfehlung:** Deutsch (`de-CH`) als einzige Sprache; keine
  Übersetzungsstruktur vorbereiten, solange kein Bedarf belegt ist.
- **Entscheid:** offen

### D-003 Kontaktkanal

- **Frage:** Formular, E-Mail-Link, Telefon oder eine Kombination? Empfänger,
  Pflichtfelder, Aufbewahrung, Löschung?
- **Belege:** Briefing wünscht ein Kontaktformular; Empfängeradresse laut
  Bestand `info@luescherwohnen.ch` (`D-001`). Zielgruppe ist wenig
  technikaffin und nutzt Desktop und Mobile.
- **Optionen:** (A) Telefon und E-Mail-Link, kein Formular; (B) schlankes
  Formular mit Name, Rückrufnummer oder E-Mail, Anliegen; Zustellung per
  E-Mail, keine Speicherung auf dem Server; Spam-Schutz ohne Drittanbieter;
  (C) Formular mit Datei-Upload oder Terminwunsch.
- **Empfehlung:** (B) plus gut sichtbare Telefonnummer und E-Mail-Link als
  Fallback ohne JavaScript. Aufbewahrung nur im E-Mail-Postfach des
  Unternehmens; Löschfrist im Datenschutzhinweis nennen.
- **Entscheid:** offen

### D-004 Standort, Öffnungszeiten und Karte

- **Frage:** Sind Adresse und Öffnungszeiten aktuell, und welche Kartenlösung
  ist gewünscht?
- **Belege:** Adresse siehe `D-001`; Öffnungszeiten laut `old/index.html`:
  Montag geschlossen, Dienstag bis Freitag 10:00 bis 18:30 Uhr, Samstag 10:00
  bis 16:00 Uhr. Alte Website hatte "Firmenstandorte" (Mehrzahl) und
  "Kontakt und Anfahrt".
- **Optionen:** (A) eigene, statische Kartengrafik mit Link zu einem
  Kartendienst, keine Datenübertragung an Dritte beim Seitenaufruf; (B)
  eingebettete Karte eines Drittanbieters erst nach Klick und Einwilligung;
  (C) direkt eingebettete Karte (überträgt Daten an den Anbieter, braucht
  Einwilligungslösung).
- **Empfehlung:** (A); Anfahrtsbeschreibung in Text (ÖV, Parkplätze) ergänzen.
  Klären, ob es mehr als einen Standort gibt.
- **Entscheid:** offen

### D-005 Logo, Bilder, Bildrechte, Teamtexte, Referenzen

- **Frage:** Welche Medien dürfen verwendet werden, und wer gibt sie frei?
- **Belege:** Inventar in `docs/bestandsinventar.md`: Logo nur als PNG
  765 × 190 Pixel; Porträts von drei Personen; Referenzfotos aus
  Kundenwohnungen; Lieferantenbilder (de Sede, Ligne Roset, Création
  Baumann, Giroflex, Intertime, Naturokork, Keralux). Impressum der alten
  Website: Fotos von Lüscher Wohnen AG oder von Lieferanten.
- **Empfehlung:** Vektorlogo (SVG, PDF oder AI) vom Gestalter oder der
  Druckerei beschaffen; pro Lieferant schriftliche Nutzungserlaubnis für die
  neue Website einholen; Einwilligung der abgebildeten Personen und der
  Kundschaft der Referenzprojekte dokumentieren; Teamtexte neu schreiben.
- **Entscheid:** offen

### D-006 Aussage "rund um die Uhr"

- **Frage:** Was bedeutet "Wir kommen auch rund um die Uhr zum Kunden nach
  Hause" (Briefing, Abschnitt 2)?
- **Belege:** Alte Website formuliert "wann und wo Sie es wünschen" und
  Lieferung "auch an einer Randzeit oder am Wochenende".
- **Empfehlung:** Formulierung "Beratung und Lieferung nach Vereinbarung, auch
  abends und am Wochenende" verwenden; keine 24-Stunden-Zusage.
- **Entscheid:** offen

### D-007 Betrieb auf dem eigenen On-Prem-Server

- **Entschieden am 14.09.2026 (Repository-Eigentümer):** Die neue Website
  läuft auf dem eigenen On-Prem-Server, nicht bei Green. Der DNS-A-Record ist
  ein separater, späterer Auftrag.
- **Noch zu klären:** Betriebssystem und Docker-Version des Servers,
  CPU-Architektur (das Image wird für `linux/amd64` gebaut), wer den Server
  administriert, ob es eine Staging-Umgebung gibt, wie Backups (nur
  Konfiguration, keine Daten) und Monitoring laufen.
- **Belege:** Anweisung im Freigabeprotokoll der Anforderungsanalyse;
  Sicherheitsbefund zur alten Website bei Green
  (`docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`).
- **Empfehlung:** Antworten in `docs/betrieb-on-prem.md` festhalten; die alte
  Website bei Green nach `D-018` behandeln und erst nach dem Domain-Umzug
  abschalten.
- **Entscheid:** Plattform entschieden; Betriebsdetails offen

### D-008 Docker Hub und Veröffentlichung

- **Frage:** Welche Docker-Hub-Organisation und welcher Image-Name, privat oder
  öffentlich, welcher Branch oder Tag darf publizieren, welche GitHub
  Environments sind nötig?
- **Belege:** `CLAUDE.md`, Abschnitt 5: Publish nur aus geschützten Branches
  oder Tags, Deployment getrennt und umgebungsgeschützt.
- **Stand:** Docker Hub als Registry ist bestätigt (Auftrag an Codex). Der
  Publish-Workflow `.github/workflows/publish-image.yml` liest den Namensraum
  aus der Repository-Variablen `DOCKERHUB_NAMESPACE` und die Zugangsdaten aus
  den Secrets `DOCKERHUB_USERNAME` und `DOCKERHUB_TOKEN`; ohne diese Werte
  publiziert er nichts.
- **Empfehlung:** Namensraum des Unternehmens oder des Betreibers, private
  Repositories `luescherwohnen-web` und `luescherwohnen-kontakt`, Zugangstoken
  mit Schreibrecht nur für diese Repositories, Publish nur per Release-Tag
  `vX.Y.Z` aus `main`, GitHub-Environment `docker-hub` mit Freigabepflicht.
- **Entscheid:** Namensraum und Token-Verantwortliche offen

## Weitere Discovery-Entscheidungen

### D-009 Suche

- **Belege:** Briefing kreuzt "Suche" an; die Website besteht im MVP aus einer
  langen Startseite plus Pflichtseiten.
- **Empfehlung:** Keine Suchfunktion im MVP; Navigation mit Sprungmarken,
  Browser-Suche und klare Überschriften erfüllen den Zweck. Suche erneut
  prüfen, wenn der Shop kommt.
- **Entscheid:** offen

### D-010 Social Media

- **Belege:** Briefing kreuzt "Integration Social Media" an; Kanäle nicht
  genannt.
- **Empfehlung:** Nur Links zu den offiziellen Profilen mit erkennbaren Icons;
  keine eingebetteten Feeds oder Share-Buttons (Datenübertragung an Dritte).
- **Entscheid:** offen; Kanäle und Profiladressen nennen.

### D-011 Bestehende URLs und Weiterleitungen

- **Belege:** Seitenstruktur der alten Website aus `old/Homepage.docx`
  (Inventar, Abschnitt 2); die tatsächlichen URLs sind nicht belegt, die
  Live-Website antwortet automatisierten Abrufen mit HTTP 403.
- **Empfehlung:** Auftraggeber exportiert die URL-Liste (Sitemap oder Menü
  der alten Website); das Team erstellt einen 301-Redirect-Plan für Haupt-
  und Produktseiten; Shop-URLs zeigen bis Phase 2 auf den Sortimentsbereich.
- **Entscheid:** offen

### D-012 Performance-Ziele und Browser

- **Empfehlung:** Core Web Vitals im Bereich "gut" auf Mobilgeräten (LCP
  höchstens 2.5 s, INP höchstens 200 ms, CLS höchstens 0.1); Startseite ohne
  Bilder unter 200 KB; Unterstützung der jeweils zwei letzten Versionen von
  Chrome, Firefox, Safari (macOS und iOS) und Edge; ohne JavaScript bleibt
  jeder Inhalt lesbar und jeder Kontaktweg nutzbar.
- **Entscheid:** offen

### D-013 Bearbeitung von Anfragen

- **Frage:** Wer bearbeitet Kontaktanfragen, in welcher Frist, über welchen
  Maildienst?
- **Belege:** AGB der alten Website versprechen Antworten innerhalb von fünf
  Werktagen (Shop-Kontext).
- **Empfehlung:** Zuständige Person und Stellvertretung benennen; Antwortziel
  von zwei Werktagen auf der Website nur nennen, wenn es eingehalten wird;
  Maildienst mitteilen, damit Zustellung und SPF/DKIM geprüft werden können.
- **Entscheid:** offen

### D-014 Shop (Phase 2)

- **Belege:** Alte Website hatte acht Produktseiten und AGB mit
  Widerrufsrecht vom 20.08.2023 (Inventar, Abschnitt 2); Zahlungsarten,
  Liefergebiete und Bestände sind nicht belegt.
- **Empfehlung:** Erst nach Produktionsstart des MVP als eigener Auftrag mit
  Produktliste, Zahlungsanbieter, Liefergebiet, Retouren, AGB-Prüfung durch
  eine Fachperson und eigenem Bedrohungsmodell.
- **Entscheid:** offen

### D-015 Bootstrap oder eigenes CSS

- **Belege:** Briefing wünscht Bootstrap bei Eigenentwicklung ohne CMS;
  `CLAUDE.md` verlangt belegten Bedarf für jede Laufzeitabhängigkeit;
  `old/index-new.html` bindet Bootstrap 5.3.8 ab CDN ein.
- **Optionen:** (A) Bootstrap 5, selbst gehostet, auf benötigte Komponenten
  reduziert, ohne Bootstrap-JavaScript, ausser es wird nachweislich gebraucht;
  (B) eigenes, kleines CSS ohne Framework; (C) Bootstrap komplett ab CDN wie
  im Bestandsentwurf.
- **Empfehlung:** (A) erfüllt den Wunsch des Auftraggebers und hält
  Abhängigkeiten klein; (C) wird wegen Drittanbieter-Abruf bei jedem Seitenaufruf
  nicht empfohlen. Endgültig im Stack-ADR in Phase 1.
- **Entscheid:** offen

### D-016 Inhaltspflege ohne CMS

- **Belege:** Briefing: kein CMS, Inhalte pflegt Andreas Längle, der auch die
  alte Website konzipiert und umgesetzt hat.
- **Optionen:** (A) Inhalte als einfache Textdateien (Markdown oder JSON) im
  Repository, Änderung über GitHub mit Vorschau und Prüfung durch die
  Pipeline; (B) Änderungen nur durch das Entwicklungsteam auf Zuruf; (C)
  später ein kleines Redaktionssystem (widerspricht dem Briefing).
- **Empfehlung:** (A) mit einer kurzen Anleitung und einem Vier-Augen-Schritt
  vor der Veröffentlichung.
- **Entscheid:** offen

### D-017 Medienbestand und Repository-Grösse

- **Belege:** 1 038 Dateien, 287 MB; 890 davon reproduzierbare
  Grössenvarianten; drei GIF mit 98.6 MB (Inventar, Abschnitt 3 und 6).
- **Empfehlung:** Grössenvarianten und Archive entfernen, Originale kuratieren
  und mit Git LFS oder ausserhalb des Repositories verwalten, Historie einmalig
  bereinigen. Ausführung nur nach Auftrag.
- **Entscheid:** offen

### D-019 Reverse-Proxy und TLS auf dem On-Prem-Server

- **Frage:** Gibt es auf dem Server bereits einen Reverse-Proxy mit
  TLS-Zertifikaten (z. B. nginx, Traefik, Caddy), oder soll der Compose-Stack
  einen mitbringen?
- **Belege:** `deploy/compose.yml` bindet die Website nur an `127.0.0.1:8080`
  und erwartet einen vorgelagerten Proxy; HSTS gehört an diese Stelle.
- **Empfehlung:** Vorhandenen Proxy wiederverwenden, falls einer gepflegt
  wird; sonst Caddy im Compose-Stack mit automatischen Let's-Encrypt-
  Zertifikaten, sobald die Domain auf den Server zeigt.
- **Entscheid:** offen

### D-020 Deployment-Weg vom Docker Hub auf den Server

- **Frage:** Wie kommt ein freigegebenes Image auf den Server?
- **Optionen:** (A) self-hosted GitHub-Runner auf dem Server, nur ausgehende
  Verbindung, Deployment-Job im geschützten Environment `production`; (B)
  Pull-Skript oder Timer auf dem Server, das die freigegebene Version zieht;
  (C) SSH aus GitHub Actions (braucht eingehenden Zugang und Schlüssel als
  Secret).
- **Empfehlung:** (A) mit `docker compose pull` und `up -d`, Rollback über
  die vorherige Version in `deploy/.env`; bis dahin manuell nach
  `docs/betrieb-on-prem.md`.
- **Entscheid:** offen

### D-018 Sicherheitsvorfall Alt-Website

- **Belege:** `docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`.
- **Frage:** Wer informiert Green, wer wechselt Zugangsdaten, wird die alte
  Website abgeschaltet oder neu aufgesetzt, wer prüft die Meldepflicht, und
  dürfen die Archive aus Repository und Historie entfernt werden?
- **Empfehlung:** Sofort: Green informieren, Zugangsdaten wechseln, alte
  Website durch die Platzhalterseite aus sauberem Stand ersetzen; Archive nach
  Sicherung des Beweismaterials entfernen. Blockiert den Betrieb des Relaunchs
  auf demselben Hosting, bis der Vorfall abgeschlossen ist.
- **Entscheid:** offen
