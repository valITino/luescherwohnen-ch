# Betrieb, Vorschau und Container

Stand: November 2026. Die produktive Zielplattform (Green), Domain/DNS und Docker Hub sind
noch nicht entschieden (D-007, D-008). Eingerichtet sind die Vorschau auf GitHub Pages und ein
geprüftes Container-Image, das ohne Push gebaut wird.

## 1. Vorschau auf GitHub Pages (Demo)

Workflow `.github/workflows/pages.yml`: Nach jeder **erfolgreichen CI** eines Pushs auf `main`
(oder von Hand unter Actions → «Vorschau auf GitHub Pages» → Run workflow) wird genau der
geprüfte Stand mit `pnpm build:pages` gebaut, kurz geprüft und veröffentlicht. Schlägt die CI
fehl, bleibt die bisherige Vorschau stehen.

- Adresse: `https://<owner>.github.io/<repo>/`, für den Fork
  `https://valitino.github.io/luescherwohnen-ch/`.
- Einmalig im Repository: Settings → Pages → Source «GitHub Actions».
- In der Vorschau: Hinweisleiste oben, alle Seiten `noindex`, robots.txt sperrt alles, das
  Formular antwortet simuliert (nichts wird gesendet), der Bereich «Projekte» ist sichtbar.
- Das Environment `github-pages` erlaubt standardmässig nur den Default-Branch. Änderungen auf
  einem Feature-Branch erscheinen darum erst nach dem Merge in `main`.

Lokal ansehen:

```bash
pnpm build:pages
node scripts/serve.mjs dist-pages --base /luescherwohnen-ch
```

`build:pages` überschreibt `apps/web/dist`. Vor Tests danach wieder `pnpm build`.

## 2. Container-Image

Multi-Stage-Build (`Dockerfile`): Node 22 baut die Website, `nginxinc/nginx-unprivileged`
(Mainline, Alpine, per Digest gepinnt) liefert sie aus. Im Laufzeit-Stage holt `apk upgrade`
Sicherheitsupdates, die nach dem Basis-Image erschienen sind. nginx läuft als Benutzer 101 auf
Port 8080; Konfiguration und Inhalte gehören root und sind nur lesbar.

```bash
pnpm docker:build                 # Produktion (ohne Formular, im Index)
node scripts/docker.mjs build --preview   # wie die Vorschau (Formular simuliert, noindex)
pnpm docker:run                   # http://localhost:8080, gehärtet
node scripts/docker.mjs stop
docker compose up --build         # Alternative mit compose.yaml
```

Build-Argumente: `PUBLIC_WEB_URL`, `PUBLIC_CONTACT_ENDPOINT` (`mock`, https-Adresse oder leer),
`PUBLIC_PREVIEW`, `PUBLIC_HSTS_PRELOAD`. Hinter einem TLS-Proxy reicht `scripts/docker.mjs` den
Proxy und das CA-Zertifikat als Build-Secret durch; das Zertifikat landet nicht im Image.

Empfohlene Laufzeit-Härtung (so auch in `compose.yaml` und `scripts/docker.mjs`): nur lesbares
Dateisystem mit `tmpfs` für `/tmp`, `--cap-drop ALL`, `no-new-privileges`, nur an `127.0.0.1`
oder hinter einem TLS-Reverse-Proxy veröffentlichen. Healthcheck: `GET /healthz`.

### Prüfen

```bash
pnpm check:headers   # startet das Image gehärtet und prüft 38 Punkte (Header, 404, Methoden …)
```

Scans wie in der CI (lokal mit Docker):

```bash
docker save luescherwohnen:local -o image.tar
docker run --rm -v "$PWD":/scan anchore/syft:v1.57.2 /scan/image.tar -o cyclonedx-json=/scan/sbom.cdx.json
docker run --rm -v "$PWD":/scan aquasec/trivy:0.76.2 image --input /scan/image.tar --severity CRITICAL,HIGH
```

## 3. Docker in der Claude-Code-Cloud-Umgebung

Docker ist im Image der Umgebung installiert, der Daemon läuft aber nicht von selbst.
`scripts/docker-up.sh` startet ihn idempotent, übernimmt den Proxy der Umgebung und trägt den
Mirror `mirror.gcr.io` ein (Docker Hub drosselt anonyme Pulls über geteilte Adressen).

```bash
bash scripts/docker-up.sh
```

## 4. CI/CD

`.github/workflows/ci.yml` ist der Dispatcher (CLAUDE.md, Abschnitt 5). Er klassifiziert die
geänderten Pfade mit `scripts/ci-changes.mjs` und startet nur die betroffenen Module:

| Modul     | Auslöser                                       | Prüfungen                                                                                                                      |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| immer     | jede Änderung                                  | Sperre für PHP und Archive, Trivy (Secrets, Konfiguration), Claude-Validator, Python-Tests; CodeQL (SAST) als eigener Workflow |
| Doku      | `*.md`, `docs/`                                | markdownlint, Links offline (lychee)                                                                                           |
| Website   | `apps/`, `packages/`, `e2e/`, Lockfile …       | audit, ESLint, Prettier, Typen, Vitest, Build, JS-Budget, Playwright + axe                                                     |
| Container | `Dockerfile`, `docker/`, und jede Web-Änderung | hadolint, Build ohne Push, Smoke-Test, SBOM (Syft), Trivy (Critical/High)                                                      |
| Workflows | `.github/`                                     | actionlint                                                                                                                     |

Pull Requests bauen und prüfen ohne Registry-Push. Ein Publish nach Docker Hub und ein Deployment
werden erst nach D-007 und D-008 eingerichtet: getrennt vom Build, nur von geschützten Branches
oder Tags, mit Environment-Schutz, Concurrency Lock, Provenance, Rollback und Smoke-Test.

## 5. Rollback

- Vorschau: früheren Lauf von «Vorschau auf GitHub Pages» erneut ausführen oder den Commit auf
  `main` zurücknehmen.
- Container: Images werden unveränderlich mit Digest betrieben; Rollback heisst, den vorherigen
  Digest wieder zu starten (sobald eine Registry entschieden ist).

## 6. Security-Header, HSTS und Protokolle

- Die Header kommen aus `packages/config/src/security.mjs` und gelten im Container für jede
  Antwort, auch für 301, 400, 404 und 405 (`pnpm check:headers` prüft das).
- **HSTS** startet vorsichtig mit `max-age=86400` und ohne Subdomains. Erst wenn alle
  Subdomains HTTPS können und der Betrieb stabil ist, mit `PUBLIC_HSTS_PRELOAD=true` bauen
  (ein Jahr, `includeSubDomains`, `preload`). HSTS wirkt nur hinter TLS; der Reverse Proxy der
  Zielplattform leitet HTTP auf HTTPS um und setzt HSTS nicht ein zweites Mal.
- **Zugriffslog** ohne IP-Adresse und User-Agent (Format `privacy` in `docker/nginx.conf`).
  Das Fehlerprotokoll von nginx nennt bei Fehlern die Client-Adresse; Aufbewahrung beider
  Protokolle mit der Zielplattform festlegen (Datenschutzerklärung, D-007).
- Die CSP für Skripte und Styles steht als Meta-Tag mit Hashes in jeder Seite. Auf GitHub Pages
  fehlen Server-Header (Plattformgrenze); für den produktiven Betrieb gilt der Container.

## 7. Künftiger Empfänger des Kontaktformulars (D-003, D-013)

Heute gibt es keinen Empfänger: In Produktion ist das Formular aus, in der Vorschau simuliert.
Wer einen Empfänger baut (eigene Bedrohungsanalyse und Datenschutzweg vorher), muss mindestens:

- die Regeln aus `apps/web/src/lib/contact-form.ts` serverseitig erneut anwenden (Längen vor
  jedem regulären Ausdruck), dem Browser nie vertrauen;
- nur `application/json` annehmen, Grösse auf etwa 10 KB begrenzen, CORS nur für die eigene
  Origin, Origin prüfen, Rate Limit je Adresse;
- Honeypot (`website`) und Bestätigung (`datenschutz`) auswerten, die der Browser mitsendet;
  zusätzlich ein Zeit- oder Challenge-Token gegen Bots;
- E-Mails mit festem Absender und festem Betreff senden, die Adresse der Person nur geprüft als
  `Reply-To`; keine automatische Antwort an die eingegebene Adresse (sonst Spam-Relay);
- Formularinhalte nie loggen, Aufbewahrung und Löschung festlegen, generische Fehlercodes;
- Secrets nur serverseitig; danach `PUBLIC_CONTACT_ENDPOINT` setzen (die CSP erlaubt dann genau
  diese Origin in `connect-src`).

## 8. Werkzeuge nur für kurzlebige Sandboxen

`scripts/docker-up.sh` läuft als root, installiert bei Bedarf Pakete, trägt den Mirror
`mirror.gcr.io` ein und startet `dockerd` neu. `scripts/docker.mjs build` baut hinter einem
Proxy mit `--network host`. Beides ist für die Claude-Code-Cloud-Umgebung und ähnliche
Wegwerf-Sandboxen gedacht, nicht für Arbeitsrechner oder Server. Die Basis-Images sind per Digest
gepinnt; ein Mirror kann darum keinen anderen Inhalt unterschieben.
