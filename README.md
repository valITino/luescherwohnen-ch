# luescherwohnen.ch

Website der Lüscher Wohnen AG in Baden: Möbel, Polstermöbel, Betten, Bodenbeläge, Teppiche,
Vorhänge und Beleuchtung, Beratung im Geschäft und zu Hause, Lieferung und Montage.

**Stand:** Demo nach dem Designsystem von [PSYber](https://github.com/valITino/PsySec), hell
und warm umgesetzt. Vorschau: <https://valitino.github.io/luescherwohnen-ch/> (nach dem Merge in
`main`). Die Demo ist keine Produktionsfreigabe; offene Entscheidungen stehen in
[`docs/TODO.md`](docs/TODO.md) und [`docs/requirements-analysis.md`](docs/requirements-analysis.md).

| Teil              | Zweck                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `apps/web`        | Astro-Website: One-Pager, Impressum, Datenschutz, Styleguide, 404      |
| `packages/ui`     | Designsystem: Tokens, Schrift, Logo-Kit, Bausteine, Motion-Helfer      |
| `packages/config` | ESLint- und TypeScript-Basis, Basis-Pfad, CSP- und Header-Helfer       |
| `e2e/`            | Playwright: Funktion, Layout, SEO, Barrierefreiheit (axe, WCAG 2.2 AA) |
| `docker/`         | nginx-Konfiguration für das Container-Image                            |

Keine Cookies, kein Tracking, keine Schriften oder Skripte von Dritten.

## Loslegen

Voraussetzung: Node 22.23 oder neuer.

```bash
corepack enable
pnpm install
pnpm dev                 # http://localhost:4321  (Styleguide: /styleguide)
```

## Prüfen

```bash
pnpm lint && pnpm lint:md && pnpm typecheck && pnpm test
pnpm build:pages && pnpm build   # Vorschau (dist-pages) und Produktion (apps/web/dist)
pnpm e2e                         # Playwright gegen beide Builds
pnpm budgets                     # JS-Budget 120 KB (gzip)
```

Container (Docker):

```bash
bash scripts/docker-up.sh        # nur in der Claude-Code-Cloud-Umgebung nötig
pnpm docker:build
pnpm check:headers               # gehärteter Smoke-Test: Header, 404, Methoden
pnpm docker:run                  # http://localhost:8080
```

## Vorschau

```bash
pnpm build:pages
node scripts/serve.mjs dist-pages --base /luescherwohnen-ch   # http://localhost:4321/luescherwohnen-ch/
```

Auf GitHub Pages veröffentlicht der Workflow `pages.yml` denselben Stand bei jedem Push auf
`main` (einmalig: Settings → Pages → Source «GitHub Actions»).

## Doku

- [`CLAUDE.md`](CLAUDE.md): verbindliche Arbeitsanweisung
- [`docs/homepage-anforderungen.md`](docs/homepage-anforderungen.md): Briefing (Primärquelle)
- [`docs/requirements-analysis.md`](docs/requirements-analysis.md): Anforderungen und Entscheidungsregister
- [`docs/project-plan.md`](docs/project-plan.md): Phasen und Gates
- [`docs/DESIGN.md`](docs/DESIGN.md): Designsystem
- [`docs/DECISIONS.md`](docs/DECISIONS.md): Entscheidungen und Gründe
- [`docs/DEPLOY.md`](docs/DEPLOY.md): Vorschau, Container, CI/CD
- [`docs/PROGRESS.md`](docs/PROGRESS.md): Stand
- [`docs/TODO.md`](docs/TODO.md): offene Angaben, Sicherheitsbefund im Bestand
- [`docs/adr/`](docs/adr/README.md): Architekturentscheide

Schriften: [Manrope](https://github.com/sharanda/manrope) und
[Geist Mono](https://github.com/vercel/geist-font) (SIL Open Font License). Icons:
[Lucide](https://lucide.dev) (ISC License). Herkunft übernommener Teile:
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
