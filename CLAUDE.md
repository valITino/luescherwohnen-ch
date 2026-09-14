# luescherwohnen.ch - Projektorchestrator

Diese Datei ist die verbindliche Arbeitsanweisung für Claude Code in diesem
Repository. Ziel ist ein sicherer, barrierearmer und wartbarer Relaunch für
Lüscher Wohnen. Der Auftraggeber entscheidet fachliche und geschäftliche
Fragen; das Team liefert belegbare Vorschläge und setzt nur Freigegebenes um.

## 1. Quellenhierarchie und Wahrheitsgebot

1. Der aktuelle Auftrag des Menschen hat Vorrang.
2. `docs/homepage-anforderungen.md` ist die fachliche Primärquelle.
3. `docs/requirements-analysis.md` präzisiert diese Quelle, ersetzt aber keine
   offene Entscheidung des Auftraggebers.
4. Angenommene Architecture Decision Records (ADR) sind für die Umsetzung
   verbindlich.
5. `docs/project-plan.md` beschreibt Reihenfolge, Gates und Nachweise.

`docs/bestandsinventar.md` und `docs/entscheidungsvorlage-kickoff.md` sind
Arbeitsdokumente der Discovery: Sie belegen Fakten und formulieren
Empfehlungen, treffen aber keine Entscheidung. Das Material der alten Website
liegt unter `old/`; es ist Beleg und Referenz, nie Anforderungsquelle. Fakten,
die nur aus `old/` stammen, werden in `docs/content-freigabe.md` geführt, bis
der Auftraggeber sie bestätigt.

Niemals fehlende Angaben erfinden. Fakten im Repository belegen. Veränderliche
externe Fakten in Primärquellen verifizieren, Quelle und Abrufdatum festhalten.
Annahmen sind nur als `ANNAHME - ZU BESTAETIGEN` zulässig und dürfen keine
irreversible Entscheidung oder Produktionsfreigabe tragen. Widersprüche und
Lücken kommen in das Entscheidungsregister der Anforderungsanalyse.

## 2. Aktuelle Phase und Liefergrenze

Das Projekt befindet sich in **Phase 0: Discovery und Freigabe**. In dieser
Phase sind Team-, Anforderungs-, Planungs- und ADR-Dokumente erlaubt. Es wird
noch kein Produktivcode, kein Shop und keine Deployment-Automation gebaut.
Phase 1 beginnt erst, wenn die offenen Blocker `D-001` bis `D-008` aus
`docs/requirements-analysis.md` beantwortet und Architektur, Datenschutzweg
sowie MVP-Umfang vom Auftraggeber schriftlich freigegeben wurden.

Ausnahme auf Anweisung des Repository-Eigentümers vom 14.09.2026: Das
MVP-Grundgerüst unter `web/` wird vor Gate G0 gebaut, damit der Auftraggeber
einen prüfbaren Stand erhält. Dabei gilt: nur Inhalte aus der Primärquelle und
belegte, in `docs/content-freigabe.md` gekennzeichnete Fakten; ADRs bleiben
`Vorgeschlagen`, bis sie angenommen sind; kein Deployment ohne Freigabe.

Vor jeder Arbeit:

1. `git status --short --branch` ausführen und fremde Änderungen erhalten.
2. Diese Datei, die Primäranforderungen und für die Aufgabe relevante ADRs lesen.
3. Ziel, Nicht-Ziele, Akzeptanzkriterien und betroffene Dateien benennen.
4. Nur die kleinste abgeschlossene Arbeitseinheit bearbeiten.

## 3. Team und Delegation

Die Rollendefinitionen liegen in `.claude/agents/`. Der Orchestrator zerlegt die
Arbeit, delegiert nur bei klarer Zuständigkeit und integriert die Ergebnisse.
Eine Rolle darf keine fachliche Freigabe simulieren.

| Bedarf | Federführung | Unabhängige Prüfung |
|---|---|---|
| Umfang, Priorität, Akzeptanz | `product-requirements-lead` | Auftraggeber |
| Informationsarchitektur, UI, Barrierefreiheit | `ux-accessibility-designer` | `qa-engineer` |
| Stack, Schnittstellen, ADR | `software-architect` | `security-reviewer` |
| Frontend und Backend | `full-stack-engineer` | `code-reviewer`, `qa-engineer` |
| Docker, GitHub Actions, Betrieb | `devops-platform-engineer` | `security-reviewer` |
| Datenschutz und Recht | `privacy-legal-reviewer` | Auftraggeber/externe Fachperson |
| Tests und Qualitätsnachweise | `qa-engineer` | `code-reviewer` |
| Bedrohungsmodell und Security-Audit | `security-reviewer` | nicht die implementierende Rolle |
| Inhalte, lokale Auffindbarkeit, SEO | `content-seo-specialist` | Auftraggeber |

Duplikate wurden bewusst zusammengeführt: Frontend, Backend und Full Stack in
`full-stack-engineer`; DevOps, Docker/Kubernetes und SecDevOps-Betrieb in
`devops-platform-engineer`; statische und dynamische Tests in `qa-engineer`;
Datenschutz, Legal und GRC in `privacy-legal-reviewer`. Security Review bleibt
für die notwendige Unabhängigkeit separat. Scrum-Rollen werden für dieses kleine
Projekt nicht nachgebildet; Planung und Requirements sind eine schlanke Rolle.

Relevante, lokal versionierte Fachanleitungen liegen in `.claude/skills/`.
Eine Rolle lädt nur die für ihre Aufgabe benötigten Skills und Referenzen.
Bestand, Zuständigkeiten, zusammengeführte Ursprungsrollen und bewusst nicht
übernommene Rollen sind in `.claude/README.md` nachvollziehbar dokumentiert.

## 4. Architekturleitplanken

- Einfachste Lösung bevorzugen: statische bzw. serverseitig gerenderte Seiten
  und Vanilla JavaScript prüfen, bevor ein SPA-Framework eingeführt wird.
- Die Anforderung "wenige Seiten, lieber scrollen" bedeutet nicht automatisch
  eine clientseitige SPA. Impressum und Datenschutz bleiben eigenständig und
  direkt verlinkbar.
- Bootstrap ist laut Briefing bei einer Eigenentwicklung ohne CMS gewünscht.
  Seine Version, Anpassung und Notwendigkeit werden im Stack-ADR entschieden.
- Kein Framework, Dienst, Cookie, Tracker, CMS, Datenbank oder Kubernetes ohne
  belegten Bedarf. Der spätere Shop wird als getrennte Phase und Threat Model
  behandelt.
- Progressive Enhancement, semantisches HTML, mobile-first, lesbare Typografie,
  Tastaturbedienung und WCAG 2.2 AA sind Standard.
- Personenbezogene Formulardaten minimieren, serverseitig validieren, gegen CSRF,
  Spam, Header Injection und Missbrauch schützen; keine Secrets im Client/Repo.
- Docker-Images reproduzierbar, rootless/read-only soweit möglich, mit gepinnten
  Basen, Healthcheck, `.dockerignore`, SBOM und Vulnerability Scan bauen.
- Green-Hosting-Fähigkeiten, Zielplattform und Docker-Hub-Namensraum nicht raten;
  vor dem Deployment bestätigen.
- Code, Plugins, Archive und Konfiguration der alten Website werden nicht
  wiederverwendet. Die ZIP-Archive unter `old/ressources/2026/08/` enthalten
  Schadcode und dürfen weder entpackt noch ausgeführt werden
  (`docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`).

## 5. Situationsbasierte CI/CD

Jede Änderung durchläuft eine Pipeline, aber nur die betroffenen Module laufen:

- Ein zentraler Dispatcher klassifiziert Pfade und ruft wiederverwendbare
  Workflows auf; sicherheitskritische Basisscans laufen immer.
- Dokumentation: Markdown/Link/Secret-Scan, kein unnötiger Container-Build.
- Web-Code: Format, Lint, Unit-Tests, Build, Accessibility und E2E nach Umfang.
- Container/IaC/Workflow: Lint, Policy-Prüfung, Build, SBOM und Image-Scan.
- Pull Requests bauen und prüfen ohne Registry-Push. Nur geschützte, freigegebene
  Branches oder Tags dürfen unveränderliche Images in Docker Hub publizieren.
- Deployment ist vom Publish getrennt, umgebungsgeschützt und benötigt
  Concurrency Lock, Provenance, Rollback und Smoke Test.
- Actions nach vollständiger Commit-SHA pinnen; minimale `permissions`, OIDC wo
  möglich, keine Secrets in Fork-PRs und keine untrusted Inputs in Shell-Code.

Konkrete Trigger, Registry-Namen, Tags und Zielumgebungen werden erst nach den
Entscheidungen in `docs/requirements-analysis.md` implementiert.

## 6. Definition of Ready und Done

Eine Umsetzung ist **ready**, wenn Quelle, Scope, testbare Akzeptanzkriterien,
Abhängigkeiten, Datenschutz-/Security-Auswirkung, UX-Zustand und menschliche
Freigaben dokumentiert sind.

Eine Codeänderung ist **done**, wenn:

1. Unit-Tests, Lint und statische Typprüfung (falls vorhanden) erfolgreich sind.
2. Security-Scans für Source, Abhängigkeiten, Secrets und betroffene Container
   ohne kritischen Befund abgeschlossen sind.
3. Betroffene Integrations-/E2E- und Accessibility-Tests erfolgreich sind.
4. Build und lokaler Container-Smoke-Test erfolgreich sind, falls betroffen.
5. Anforderungen, ADR, Betrieb und Rollback dokumentiert sind.
6. Die Änderung unabhängig reviewed wurde und keine offenen Critical/High-
   Befunde besitzt.

Nur bei ausschliesslichen Änderungen an README, reiner Dokumentation oder
Code-Kommentaren dürfen Unit-Tests, Security-Scans und Lint entfallen. Dann sind
mindestens Diff-, Markdown- und Link-Prüfung auszuführen und die Auslassung im
Abschluss explizit zu nennen. Ein fehlendes Werkzeug gilt nicht als bestanden.
Die lokalen Prüfkommandos stehen in `README.md` (`make check`, `make links`)
und laufen identisch über den Dispatcher `.github/workflows/ci.yml`.

## 7. Git, Sprache und Dokumentation

- Nie direkt auf `main` entwickeln. Fremde Änderungen weder löschen noch
  überschreiben. Keine destruktiven Git-Befehle ohne ausdrücklichen Auftrag.
- Kleine Conventional Commits (`docs:`, `feat:`, `fix:`, `test:`, `ci:` usw.).
- Keine Secrets, Zugangsdaten, Kundendaten oder produktiven Formulareingaben
  committen. Beispielwerte klar als synthetisch kennzeichnen.
- Projektdokumentation auf Deutsch in Schweizer Schreibweise (`ss`, nicht `ß`).
  Code, technische Bezeichner und Commit-Titel dürfen Englisch sein.
- Jede Abschlussmeldung nennt geänderte Dateien, Entscheidungen, offene Punkte
  und die exakten ausgeführten Prüfkommandos samt Ergebnis.
- Nach Änderungen an Agenten oder Skills muss
  `python scripts/validate_claude_config.py` erfolgreich sein. Der Validator
  prüft auch, dass diese Datei und `.claude/README.md` jede Rolle und jeden
  Skill referenzieren.
