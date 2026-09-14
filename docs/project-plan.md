# Schlanker Projekt- und Nachweisplan

**Stand:** 14.09.2026 (Erstfassung 12.09.2026)
**Prinzip:** Kein Scrum-Zeremoniell; kleine, abgeschlossene Inkremente mit
menschlichen Freigabe-Gates und maschinellen Qualitätsnachweisen.

## Phase 0 - Discovery und Team (aktuell)

- [x] Primäranforderungen konsolidieren, ohne Lücken zu erfinden
- [x] Orchestrator, Rollenmodell und relevante Skills versionieren
- [x] MVP-Vorschlag, Nicht-Ziele und Entscheidungsregister anlegen
- [x] Repository-Bestand inventarisieren: HTML, Word-Dokument, Medien, Archive
      (`docs/bestandsinventar.md`)
- [x] Entscheidungsvorlage für den Kick-off mit Belegen und Empfehlungen
      (`docs/entscheidungsvorlage-kickoff.md`)
- [x] Qualitätspipeline für Dokumentation, Konfiguration und Secret-Scan
      einrichten (aus Phase 3 vorgezogen, weil `CLAUDE.md` Abschnitt 6 diese
      Prüfungen bereits für Dokumentationsänderungen verlangt)
- [x] ADR-Prozess und Vorlage anlegen (`docs/decisions/`)
- [ ] Sicherheitsvorfall der alten Website an Auftraggeber und Hosting-Anbieter
      übergeben; Massnahmen bestätigt (`D-018`)
- [ ] Antworten auf `D-001` bis `D-018` im Kick-off erfassen
- [ ] URL-Liste der alten Website vom Auftraggeber erhalten (`D-011`)
- [ ] Rechteinventar für Logo, Bilder, Porträts und Lieferantenmaterial
      abschliessen (`D-005`)
- [ ] Medienbestand und Historie gemäss `D-017` bereinigen (nur nach Auftrag)
- [ ] MVP und messbare Abnahmekriterien durch Auftraggeber freigeben

**Gate G0:** `D-001` bis `D-008` beantwortet; MVP schriftlich freigegeben;
Sofortmassnahmen zu `D-018` eingeleitet.

## Phase 1 - UX und Architektur

- Informationsarchitektur und zwei responsive Wireframes erstellen
- Design-Tokens mit freigegebenem Grün (`#9cb703`, nur mit dunkler Schrift)
  und geprüftem Kontrast definieren
- Content-Modell und redaktionellen Änderungsprozess ohne CMS festlegen
  (`D-016`)
- Threat Model für Kontakt, Drittanbieter, Build und Betrieb erstellen
- ADR für Minimal-Stack, Bootstrap, Suche, Karte und Formular schreiben
- ADR für Green-Deployment, Docker Hub, Umgebungen und Rollback schreiben
- Teststrategie inklusive Accessibility, Browser und Performance festlegen

**Gate G1:** UX, Inhalte, Datenschutzweg, Threat Model und ADRs freigegeben.

## Phase 2 - MVP-Umsetzung

- Semantisches, progressiv verbessertes Grundgerüst bauen
- Startseite und Pflichtseiten inkrementell implementieren
- Optimierte, lizenzierte Medien integrieren
- Kontakt-/Standortlösung gemäss ADR implementieren
- Security Header, CSP und sichere Fehlerbehandlung konfigurieren
- Unit-, Integrations-, E2E-, Accessibility- und Smoke-Tests ergänzen
- CI-Dispatcher um das Web-Modul erweitern (Format, Lint, Unit-Tests, Build,
  Accessibility, E2E)

**Gate G2:** Definition of Done erfüllt; Content und UX abgenommen.

## Phase 3 - Lieferkette und Staging

- Multi-Stage-Dockerfile und lokale Compose-Vorschau erstellen
- CI-Dispatcher um das Container-Modul erweitern (Lint, Policy, Build, SBOM,
  Image-Scan); PR-Prüfung von Image-Publish und Deployment trennen
- Docker-Hub-Publish mit SBOM, Signatur/Provenance und Image-Scan einrichten
- Geschütztes Staging mit Smoke Test, Concurrency Lock und Rollback ausrollen
- Restore-, Incident- und Update-Runbooks prüfen
- Voraussetzung: Vorfall `D-018` abgeschlossen; keine Übernahme von Code,
  Plugins oder Konfiguration der alten Website

**Gate G3:** Keine Critical/High-Befunde; Staging-Abnahme und Rollback-Test
erfolgreich; Produktionsfreigabe schriftlich dokumentiert.

## Phase 4 - Produktion und Betrieb

- Unveränderliches, freigegebenes Artefakt nach Produktion promoten
- DNS/TLS, Security Header, Formzustellung und Kernflüsse prüfen
- Redirects der alten URLs prüfen (`D-011`)
- Datenschutzfreundliches Uptime-Monitoring gemäss Freigabe aktivieren
- Abhängigkeiten, Basisimages und Zertifikate regelmässig aktualisieren
- Barrierefreiheit und Inhalte bei relevanten Änderungen regressionsprüfen

## Phase 5 - Shop (separater Auftrag)

Erst nach Produkt-, Rechts-, Zahlungs-, Liefer-, Retouren-, Support- und
Bedrohungsmodell-Discovery. Der Shop erhält ein eigenes Architektur- und
Produktionsfreigabe-Gate und wird nicht als verdeckte Erweiterung des MVP gebaut.

## Nachweis je Inkrement

Jede Übergabe enthält: Requirement-IDs, Diff-Umfang, Entscheidungen/Annahmen,
Testergebnisse mit exakten Befehlen, Scanberichte, verbleibende Risiken,
Rollback-Schritt und erforderliche menschliche Freigabe. Die Pull-Request-Vorlage
in `.github/pull_request_template.md` bildet diese Punkte ab.
