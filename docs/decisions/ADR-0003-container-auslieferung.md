# ADR-0003: Auslieferung als rootless nginx-Container

**Status:** Vorgeschlagen
**Datum:** 14.09.2026
**Entscheider:** offen (Auftraggeber: Andreas Längle)
**Bezug:** WEB-Q-004; `D-007`, `D-008`, `D-018`; ADR-0001

## Kontext

`CLAUDE.md` verlangt reproduzierbare, möglichst rootless und read-only
betriebene Docker-Images mit gepinnten Basen, Healthcheck, `.dockerignore`,
SBOM und Schwachstellen-Scan. Das Hosting-Angebot bei Green und der
Registry-Namensraum sind noch nicht bestätigt; der Sicherheitsvorfall der alten
Website ist offen. Die Website ist vollständig statisch (ADR-0001).

## Optionen

| Option | Vorteile | Nachteile | Betrieb und Sicherheit |
|---|---|---|---|
| A: nginx-unprivileged (Alpine, slim) mit `web/dist` und eigener Konfiguration | Kleines Image, Prozess ohne Root, read-only lauffähig, Header und 404 zentral konfiguriert, überall lauffähig, wo Container laufen | nginx-Konfiguration muss gepflegt werden | Bekanntes, gut gescanntes Basisimage; keine Laufzeitabhängigkeiten |
| B: Caddy | Automatisches TLS | TLS-Terminierung liegt voraussichtlich beim Hoster; grösseres Image | wie A, mehr Funktionen als nötig |
| C: Node.js-Server im Container | Formular-Backend später im selben Prozess | Laufzeit mit Abhängigkeiten, die es für statische Seiten nicht braucht | Grössere Angriffsfläche |
| D: Kein Container, Upload von `web/dist` auf klassisches Webhosting | Einfachster Betrieb, falls Green nur Webhosting bietet | Sicherheits-Header und 404 hängen vom Hoster ab | Kein Image-Scan möglich |

## Entscheidung

Option A als Liefer-Artefakt. `web/dist` bleibt zusätzlich als reine
Dateiablage nutzbar (Option D als Rückfallebene, falls `D-007` keinen
Container-Betrieb ergibt).

- Mehrstufiges `Dockerfile`: Build mit Node.js, Laufzeit mit
  `nginxinc/nginx-unprivileged` (Alpine, slim), beide per Digest gepinnt.
- nginx läuft als Benutzer 101 auf Port 8080; `/tmp` ist der einzige
  beschreibbare Pfad, das Image läuft mit `--read-only`.
- Sicherheits-Header in `web/docker/security-headers.conf`: strikte
  Content-Security-Policy (`default-src 'none'`, nur eigene Bilder und Styles),
  `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy,
  Cross-Origin-Policies; `server_tokens off`; eigene 404-Seite; `/healthz`.
- HSTS wird an der TLS-terminierenden Stelle gesetzt (`D-007`).
- CI-Modul `_container-quality.yml`: hadolint, Build ohne Push, SBOM (Syft),
  Trivy-Scan mit Abbruch bei Critical/High, Smoke-Test read-only.
- Kein Registry-Push und kein Deployment, bis `D-008` und `D-018` entschieden
  sind.

## Folgen

- Das Formular-Inkrement (ADR-0002) braucht eine zusätzliche kleine Laufzeit;
  sie wird als eigener Container neben nginx geplant, nicht im nginx-Image.
- Dependabot hält Digests, Actions und Werkzeuge aktuell.
- Rückbau: `Dockerfile`, `web/docker/` und das Modul löschen; die Website
  bleibt als statische Dateien nutzbar.

## Verifikation

- `make image` und `make smoke` lokal (benötigt Docker) beziehungsweise das
  CI-Modul: Status 200 für Startseite, Pflichtseiten und Assets, 404 mit
  eigener Seite, `/healthz`, alle Sicherheits-Header auf Seiten, Assets und
  Fehlerseite, keine nginx-Version im `Server`-Header.
- Trivy ohne Critical/High-Befunde; SBOM als Artefakt des CI-Laufs.
