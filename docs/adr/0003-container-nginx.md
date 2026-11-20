# ADR-0003: Container mit nginx ohne root

- **Status:** Vorgeschlagen; Zielplattform, Registry und Deployment offen (D-007, D-008)
- **Datum:** 20.11.2026
- **Bezug:** WEB-Q-004, CLAUDE.md Abschnitte 4 und 5

## Kontext

CLAUDE.md verlangt reproduzierbare, möglichst rootless und read-only laufende Images mit
gepinnten Basen, Healthcheck, `.dockerignore`, SBOM und Vulnerability-Scan. PSYber läuft auf
Cloudflare und hat kein Dockerfile.

## Entscheidung

- Multi-Stage: `node:22.23.5-alpine3.24` baut, `nginxinc/nginx-unprivileged:1.31.7-alpine3.24-slim`
  liefert aus; beide per Digest gepinnt. `apk upgrade` im Laufzeit-Stage holt Sicherheitsupdates.
- nginx als Benutzer 101 auf Port 8080; Konfiguration und Inhalte gehören root, nur lesbar.
  Betrieb mit nur lesbarem Dateisystem, `tmpfs` für `/tmp`, ohne Capabilities,
  `no-new-privileges`.
- Security-Header aus `packages/config/src/security.mjs`, beim Build als nginx-Include erzeugt.
- Nur GET und HEAD; `/healthz` für Healthcheck und Orchestrierung.
- CI baut ohne Push, prüft mit `scripts/check-headers.mjs`, erzeugt eine CycloneDX-SBOM und
  bricht bei Critical/High-Schwachstellen mit Fix ab.

## Folgen

- Mainline statt stabiler Linie: Die stabile 1.30.6 hatte behobene kritische Lücken ohne
  verfügbares unprivileged-Image 1.30.7. Dependabot hält die Digests aktuell.
- `apk upgrade` macht den Laufzeit-Layer zeitabhängig; dafür sind veröffentlichte Fixes immer
  enthalten. Unveränderliche Images entstehen durch Tags auf dem Digest, sobald eine Registry
  entschieden ist.
- TLS terminiert vor dem Container (Reverse Proxy der Zielplattform).
