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
| Nächster Schritt | Kick-off mit dem Auftraggeber anhand der Entscheidungsvorlage |
| Sicherheitsbefund | Alt-Website vermutlich kompromittiert, siehe Hinweis unten |

## Wichtiger Sicherheitshinweis

Im Export der alten Website unter `docs/ressources/2026/08/` liegen zwei
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
| [`docs/project-plan.md`](docs/project-plan.md) | Phasen, Gates und Nachweise |
| [`docs/decisions/README.md`](docs/decisions/README.md) | Architecture Decision Records: Prozess und Vorlage |
| [`.claude/README.md`](.claude/README.md) | Teamrollen und lokale Skills für Claude Code |

## Qualitätsprüfungen

Voraussetzungen: Node.js 20 oder neuer, Python 3.11 oder neuer, `curl`, `make`.

```bash
make install   # npm ci und ruff (Hash-gepinnt) in .venv
make check     # Markdown-Lint, ruff, Konfigurationsvalidierung, Unit-Tests, Secret-Scan
make links     # Link-Prüfung, benötigt das lychee-Binary
```

In GitHub Actions ist `.github/workflows/ci.yml` der Dispatcher: der Secret-Scan
läuft immer, Dokumentations- und Python-Prüfungen nur bei betroffenen Pfaden.
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
