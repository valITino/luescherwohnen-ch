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
- [x] Bestandsmaterial der alten Website nach `old/` verschoben; Anforderungen
      stammen allein aus `docs/homepage-anforderungen.md`
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

Auf Anweisung des Repository-Eigentümers vom 14.09.2026 teilweise vor Gate G0
begonnen; alle ADRs bleiben `Vorgeschlagen`, bis der Auftraggeber sie annimmt.

- [x] Informationsarchitektur als lange Startseite plus Pflichtseiten umgesetzt
      (Wireframes durch den lauffähigen Stand ersetzt; Abnahme offen)
- [x] Design-Tokens mit belegtem Grün (`#9cb703`, nur mit dunkler Schrift) und
      geprüftem Kontrast definiert (ADR-0001)
- [ ] Content-Modell und redaktionellen Änderungsprozess ohne CMS festlegen
      (`D-016`; Vorschlag: HTML-Dateien unter `web/src/` per Pull Request)
- [ ] Threat Model für Kontakt, Drittanbieter, Build und Betrieb erstellen
- [x] ADR für Minimal-Stack und Bootstrap (ADR-0001) sowie Kontakt, Karte und
      Suche (ADR-0002) geschrieben; Formular-Inkrement folgt nach `D-003`
- [ ] ADR für On-Prem-Deployment, Reverse-Proxy, Umgebungen und Rollback
      schreiben (nach `D-019`, `D-020`)
- [x] Teststrategie für Accessibility, Responsive und Drittanbieter-Freiheit als
      Playwright-Tests umgesetzt; Browserabdeckung und Performance-Budget nach
      `D-012`

**Gate G1:** UX, Inhalte, Datenschutzweg, Threat Model und ADRs freigegeben.

## Phase 2 - MVP-Umsetzung

- [x] Semantisches, progressiv verbessertes Grundgerüst gebaut (`web/`,
      Inkrement 1, ohne JavaScript zur Laufzeit)
- [x] Startseite, Impressum und Datenschutz-Entwurf implementiert; Inhalte
      gemäss `docs/content-freigabe.md` zu bestätigen
- [ ] Optimierte, lizenzierte Medien integrieren (nach `D-005`)
- [x] Kontakt- und Standortlösung für Inkrement 1 gemäss ADR-0002 (Telefon,
      E-Mail, Adresse, Öffnungszeiten, Kartenlink)
- [x] Kontaktformular mit serverseitiger Validierung, Spam-Schutz und
      SMTP-Zustellung als Dienst `kontakt/` (Inkrement 2); Empfänger und
      SMTP-Zugang folgen aus `D-003` und `D-013`
- [x] Security Header, CSP und eigene Fehlerseite im Container konfiguriert
      (ADR-0003)
- [x] E2E-, Accessibility-, Responsive- und Ohne-JavaScript-Tests ergänzt;
      HTML-Validierung im Build
- [x] CI-Dispatcher um das Web-Modul erweitert (Build, HTML-Validierung,
      Playwright)

**Gate G2:** Definition of Done erfüllt; Content und UX abgenommen.

## Phase 3 - Lieferkette und Staging

- [x] Multi-Stage-Dockerfile mit rootless nginx, gepinnten Digests,
      Sicherheits-Headern, 404-Seite und Healthcheck (ADR-0003, vorgezogen)
- [x] CI-Dispatcher um das Container-Modul erweitert (hadolint, Build ohne
      Push, SBOM, Trivy, Smoke-Test read-only)
- [ ] Security Header gegen das Threat Model abgleichen; HSTS an der
      TLS-terminierenden Stelle (`D-007`)
- [x] Docker-Hub-Publish per Release-Tag mit Scan vor dem Push, Provenance
      und SBOM eingerichtet; aktiv, sobald Namensraum und Token gesetzt sind
      (`D-008`)
- [x] Compose-Stack und Betriebs-Runbook für den On-Prem-Server
      (`deploy/`, `docs/betrieb-on-prem.md`)
- [ ] Deployment-Automation auf den Server (nach `D-020`) und geschütztes
      Staging mit Smoke Test, Concurrency Lock und Rollback
- [ ] Restore-, Incident- und Update-Runbooks prüfen
- Voraussetzung für Betrieb: Vorfall `D-018` abgeschlossen; keine Übernahme
  von Code, Plugins oder Konfiguration der alten Website

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
