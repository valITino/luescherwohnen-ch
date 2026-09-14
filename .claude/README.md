# Claude-Team und lokale Skills

## Zweck

Das Verzeichnis enthält die ausführbaren Projektrollen und nur die Skills, die
für den bestätigten bzw. absehbaren Website-Scope relevant sind. `CLAUDE.md`
bleibt die übergeordnete Arbeitsanweisung. Ein Skill ist Fachhilfe, keine
Freigabe und keine zusätzliche autonome Rolle.

## Rollenmodell ohne Duplikate

| Projektrolle | Abgedeckte Ausgangsrollen aus R3cOSINT | Grund |
|---|---|---|
| `product-requirements-lead` | Product Owner, Requirements Engineer | Schlanke Planung ohne Scrum-Prozess; Auftraggeber bleibt Freigabeinstanz |
| `ux-accessibility-designer` | UX/UI Designer | Ergänzt um explizite Accessibility-Verantwortung |
| `software-architect` | Software Architect | Eigenständige Architekturentscheide und ADRs |
| `full-stack-engineer` | Frontend, Backend, Full Stack Engineer | Kleine Website; schichtübergreifende Übergaben wären unnötig |
| `devops-platform-engineer` | DevOps, SecDevOps, Docker/Kubernetes Expert | Eine Lieferplattform; Security Review bleibt unabhängig |
| `qa-engineer` | Static und Dynamic Software Tester | Gemeinsame Teststrategie, weiterhin getrennt von Implementierung |
| `security-reviewer` | Pentester, Vulnerability Manager, Security Specialist | Ein unabhängiger Review-Kanal; aktive Tests nur mit Freigabe |
| `privacy-legal-reviewer` | Datenschutzexperte, Legal Reviewer, GRC-Anteile | Gemeinsamer Daten-/Rechtsreview ohne vorgetäuschte Rechtsberatung |
| `code-reviewer` | kein direktes Duplikat | Unabhängige Korrektheits- und Wartbarkeitsprüfung |
| `content-seo-specialist` | kein direktes Duplikat | Website-spezifische Inhalts- und Migrationsverantwortung |

Nicht übernommen wurden Scrum Master (kein Scrum-Prozess), Digital Forensics,
Protocol Master und IT Support, weil deren R3cOSINT-Aufträge keinen belegten
Bezug zum aktuellen Website-Scope besitzen. Falls eine bestätigte Anforderung
eine solche Zuständigkeit erzeugt, wird sie mit Begründung ergänzt statt im
Voraus simuliert.

## Skill-Auswahl

| Skill | Verwendet durch |
|---|---|
| `architecture-designer` | `software-architect` |
| `fullstack-guardian`, `javascript-pro`, `secure-code-guardian` | `full-stack-engineer` |
| `devops-engineer` | `devops-platform-engineer` |
| `test-master`, `playwright-expert` | `qa-engineer` |
| `code-reviewer` | `code-reviewer` |
| `security-reviewer`, `secure-code-guardian` | `security-reviewer` |

Die Upstream-Herkunft und Lizenz stehen in `THIRD_PARTY_NOTICES.md`. Nicht
ausgewählte Skills werden nicht vendort; das hält Kontext, Updatefläche und
Supply-Chain-Prüfung klein. Am 14.09.2026 wurde der Bestand gegen den dort
genannten Upstream-Commit geprüft: alle neun Skill-Verzeichnisse sind
byte-identisch (`diff -r`), und der Lizenztext stimmt mit der Upstream-Datei
`LICENSE` überein.

## Prüfung

Nach jeder Änderung ausführen:

```bash
make validate test-py
# oder direkt:
python scripts/validate_claude_config.py
python -m unittest discover -s tests -p 'test_*.py'
```

Der Validator prüft Agentenschema, eindeutige Namen, erlaubte Werkzeuge,
vorhandene Skills, die Übereinstimmung von Skill-Ordner und Skill-Name sowie,
dass `CLAUDE.md` und diese Datei jede Rolle und jeden Skill referenzieren.
Unabhängige Prüfrollen müssen eine explizite Werkzeugliste ohne `Edit` und
`Write` deklarieren. In der CI läuft dieselbe Prüfung im Modul
`.github/workflows/_python-quality.yml`.
