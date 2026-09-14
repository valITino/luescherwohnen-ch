# Betrieb auf dem On-Prem-Server

**Stand:** 14.09.2026
**Status:** Runbook für den vorbereiteten Stand; Reverse-Proxy (`D-019`) und
Deployment-Automation (`D-020`) sind noch nicht entschieden
**Bezug:** ADR-0003, `D-007`, `D-008`, `D-019`, `D-020`

## 1. Ablauf von der Änderung bis zum Server

1. Jede Änderung läuft über einen Pull Request durch den CI-Dispatcher
   (`.github/workflows/ci.yml`); nur betroffene Module laufen, der
   Secret-Scan immer.
2. Ein Release ist ein Git-Tag `vX.Y.Z` auf `main`. Der Workflow
   `publish-image.yml` baut das Image, scannt es mit Trivy und publiziert es
   erst danach nach Docker Hub, mit Provenance und SBOM, unter den
   unveränderlichen Tags `X.Y.Z` und `sha-<commit>`. Es gibt kein `latest`.
3. Auf dem Server wird die gewünschte Version in `deploy/.env` eingetragen und
   der Stack aktualisiert (Abschnitt 4). Rollback ist derselbe Schritt mit der
   vorherigen Version.

## 2. Einmalige Einrichtung in GitHub

| Ort | Wert | Zweck |
|---|---|---|
| Settings, Variables | `DOCKERHUB_NAMESPACE` | Docker-Hub-Namensraum, z. B. Organisation oder Benutzer (`D-008`) |
| Settings, Secrets | `DOCKERHUB_USERNAME` | Docker-Hub-Benutzer, der das Token besitzt |
| Settings, Secrets | `DOCKERHUB_TOKEN` | Zugangstoken mit Schreibrecht nur für die Repositories `luescherwohnen-web` (später `luescherwohnen-kontakt`) |
| Settings, Environments | `docker-hub` | Freigabepflicht (required reviewers) für jeden Publish |

Ohne gesetzte Variable publiziert der Workflow nichts; Secrets stehen
Pull Requests aus Forks nie zur Verfügung. Zugangsdaten gehören nie in das
Repository.

## 3. Voraussetzungen auf dem Server (`D-007`)

- Linux mit Docker Engine und Compose-Plugin (`docker compose version`),
  Architektur `linux/amd64` (andere Architektur vorher melden, dann wird
  mehrplattformig gebaut).
- Ausgehender HTTPS-Zugang zu Docker Hub; kein eingehender Zugang nötig.
- Ein Reverse-Proxy, der `https://<domain>` auf `127.0.0.1:8080` weiterleitet,
  TLS terminiert und HSTS setzt (`D-019`). Bis dahin ist die Website nur lokal
  auf dem Server erreichbar.
- Ein Verzeichnis, z. B. `/opt/luescherwohnen`, mit `compose.yml` und `.env`
  aus `deploy/`.

## 4. Start, Update und Rollback

```bash
cd /opt/luescherwohnen
cp .env.example .env            # einmalig; WEB_IMAGE auf die freigegebene Version setzen
docker compose pull
docker compose up -d
curl -fsS http://127.0.0.1:8080/healthz   # erwartet: ok
docker compose ps                          # Status "healthy" nach wenigen Sekunden
```

Update: Version in `.env` ändern, dann `docker compose pull && docker compose up -d`.
Rollback: vorherige Version in `.env` eintragen, gleicher Befehl.
Logs: `docker compose logs --tail=200 web`. Es gibt keine persistenten Daten
und keine Datenbank; ein Backup umfasst nur `compose.yml` und `.env`.

## 5. Sicherheitsrahmen

- Container läuft ohne Root (Benutzer 101), read-only, ohne zusätzliche
  Capabilities und mit `no-new-privileges`.
- Sicherheits-Header setzt nginx im Image (`web/docker/security-headers.conf`);
  HSTS setzt der Reverse-Proxy, sobald TLS steht.
- Images werden vor dem Publish gescannt; auf dem Server nur Versionen aus dem
  eigenen Docker-Hub-Namensraum verwenden.
- Der Vorfall der alten Website (`docs/security/`) betrifft die alte Umgebung
  bei Green; Zugangsdaten von dort werden nirgends wiederverwendet.

## 6. Offen

- Reverse-Proxy und Zertifikate (`D-019`), Deployment-Automation (`D-020`),
  Staging-Umgebung, Monitoring und Log-Aufbewahrung (`D-007`).
- DNS-A-Record der Domain: separater Auftrag, nicht Teil dieses Runbooks.
