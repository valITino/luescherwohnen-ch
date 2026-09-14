# luescherwohnen.ch – Relaunch

Relaunch der Website von Lüscher Wohnen AG, Baden: hell, freundlich, seriös,
barrierearm und mit möglichst wenig Technik. Das Repository enthält in Phase 0
ausschliesslich Anforderungen, Entscheidungen, Planung, Teamrollen und die
Qualitätswerkzeuge. Produktivcode entsteht erst nach der schriftlichen Freigabe
des Auftraggebers (Gate G0).

## Status

| Punkt | Stand 14.09.2026 |
|---|---|
| Phase | 0 – Discovery und Freigabe |
| Nächstes Gate | G0: `D-001` bis `D-008` beantwortet, MVP schriftlich freigegeben |
| Website | Inkrement 1 unter `web/` (Startseite, Impressum, Datenschutz-Entwurf), auf Anweisung vom 14.09.2026 vor G0 gebaut; Inhalte gemäss `docs/content-freigabe.md` zu bestätigen |
| Betrieb | Eigener On-Prem-Server (Entscheid 14.09.2026), Images auf Docker Hub; Reverse-Proxy und Deployment-Weg offen (`D-019`, `D-020`) |
| Nächster Schritt | Kick-off mit dem Auftraggeber anhand der Entscheidungsvorlage; Prüfung des Website-Stands |
| Sicherheitsbefund | Alt-Website vermutlich kompromittiert, siehe Hinweis unten |

## Wichtiger Sicherheitshinweis

Im Export der alten Website unter `old/ressources/2026/08/` liegen zwei
ZIP-Archive mit PHP-Schadcode (WordPress-Backdoor). Sie dürfen nicht entpackt,
ausgeführt oder auf einen Webserver kopiert werden. Befund, Belege und
Sofortmassnahmen stehen in
[`docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`](docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md).

## Dokumente

| Dokument | Zweck |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Verbindliche Arbeitsanweisung: Phasen, Leitplanken, Definition of Done |
| [`docs/homepage-anforderungen.md`](docs/homepage-anforderungen.md) | Briefing des Auftraggebers, fachliche Primärquelle |
| [`docs/requirements-analysis.md`](docs/requirements-analysis.md) | Anforderungsanalyse, MVP-Vorschlag und Entscheidungsregister |
| [`docs/entscheidungsvorlage-kickoff.md`](docs/entscheidungsvorlage-kickoff.md) | Kick-off-Vorlage: jede offene Entscheidung mit Belegen, Optionen und Empfehlung |
| [`docs/bestandsinventar.md`](docs/bestandsinventar.md) | Inventar des Bestandsmaterials: HTML, Word-Dokument, Medien, Archive |
| [`docs/content-freigabe.md`](docs/content-freigabe.md) | Jede Aussage auf der Website mit Quelle und Freigabestatus |
| [`docs/project-plan.md`](docs/project-plan.md) | Phasen, Gates und Nachweise |
| [`docs/decisions/README.md`](docs/decisions/README.md) | Architecture Decision Records: ADR-0001 Minimal-Stack, ADR-0002 Kontakt, Karte, Suche, ADR-0003 Container |
| [`old/README.md`](old/README.md) | Bestandsmaterial der alten Website: Referenz, keine Anforderungsquelle |
| [`.claude/README.md`](.claude/README.md) | Teamrollen und lokale Skills für Claude Code |

## Website bauen und ansehen

Die Website ist statisch: Seiten und gemeinsame Teile liegen unter `web/src/`,
das Build-Ergebnis entsteht unter `web/dist/` (nicht versioniert). Bootstrap wird
als reduzierter Sass-Build selbst gehostet; es gibt kein JavaScript zur Laufzeit
und keine Abrufe von Drittanbietern (ADR-0001, ADR-0002).

```bash
make build     # web/src -> web/dist (Seiten zusammenfügen, Sass kompilieren)
make preview   # lokale Vorschau unter http://127.0.0.1:4173/
```

| Pfad | Inhalt |
|---|---|
| `web/src/pages/` | `index.html`, `impressum.html`, `datenschutz.html` |
| `web/src/partials/` | Kopf, Kopfzeile mit Navigation, Fusszeile |
| `web/src/styles/site.scss` | Design-Tokens und Bootstrap-Teilmenge |
| `web/src/assets/` | Logo und weitere statische Dateien |
| `web/tests/` | Playwright-Tests: Struktur, Tastatur, axe-core, Responsive, ohne JavaScript, keine Drittanbieter |
| `web/docker/` | nginx-Konfiguration und Sicherheits-Header für das Container-Image |

## Container-Image

`Dockerfile` baut die Website in ein rootless nginx-Image (ADR-0003): Basen per
Digest gepinnt, Port 8080, read-only lauffähig, strikte Sicherheits-Header,
eigene 404-Seite und `/healthz`. Es wird nicht publiziert, bis Registry und
Hosting entschieden sind (`D-007`, `D-008`).

```bash
make image     # docker build --tag luescherwohnen-ch:local .
make smoke     # startet das Image read-only und prüft Seiten, 404 und Header
```

## Qualitätsprüfungen

Voraussetzungen: Node.js 20 oder neuer, Python 3.11 oder neuer, `curl`, `make`.

```bash
make install           # npm ci und ruff (Hash-gepinnt) in .venv
make install-browsers  # Chromium für Playwright (einmalig)
make check             # Markdown-Lint, ruff, Validator, Unit-Tests, HTML-Validierung, Playwright, Secret-Scan
make links             # Link-Prüfung, benötigt das lychee-Binary
```

In GitHub Actions ist `.github/workflows/ci.yml` der Dispatcher: der Secret-Scan
läuft immer, Dokumentations-, Python-, Website- und Container-Prüfungen nur bei
betroffenen Pfaden.
Alle Actions sind auf vollständige Commit-SHAs gepinnt; Dependabot hält die
Pins wöchentlich aktuell.

## Mitarbeit

- Nie direkt auf `main` entwickeln; kleine Conventional Commits.
- Keine Secrets, Kundendaten oder produktiven Formulareingaben committen.
- Pull Requests folgen der Vorlage in `.github/pull_request_template.md`.
- Projektdokumentation auf Deutsch in Schweizer Schreibweise.

## Lizenzen

Die vendorten Skills unter `.claude/skills/` stehen unter MIT-Lizenz, siehe
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Für das Projekt selbst ist
noch keine Lizenz festgelegt (`private` in `package.json`).
