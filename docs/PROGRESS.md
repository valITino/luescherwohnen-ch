# Stand je Phase

## 20.11.2026: Demo nach dem PSYber-System

Auftrag des Repository-Inhabers: Stil, Design, Format und Logik von `valITino/PsySec`
übernehmen, Demo auf GitHub Pages, Docker zum Testen. Auf Rückfrage: helles Farbschema.

Erledigt:

- Bestand inventarisiert: Texte aller Bildschirmfotos in `docs/Homepage.docx`, 148 Originalbilder
  in `docs/ressources/`; 19 Widersprüche und Lücken gesammelt (`docs/TODO.md`).
- **Sicherheitsbefund**: zwei WordPress-Hintertüren als ZIP im Bildbestand (`docs/TODO.md`).
- Monorepo wie PSYber (`apps/web`, `packages/ui`, `packages/config`), Astro 7, pnpm 12.
- Designsystem hell übertragen, Kontraste berechnet (alle Texte ≥ 4,5:1, Bedienelemente ≥ 3:1).
- Logo vektorisiert, Favicons, App-Icons und Vorschaubild erzeugt; 17 Fotos ohne Metadaten
  übernommen.
- Startseite: Hero mit Uhrzeit und Öffnungsstatus, Besuch, Sortiment, Band, Haltung, Service,
  Projekte (nur Vorschau), Aktuell, Über uns mit Firmengeschichte, Kontakt. Dazu Impressum,
  Datenschutz (Entwurf), Styleguide, 404, robots.txt, security.txt, humans.txt, Sitemap.
- Kontaktformular mit Inline-Validierung (in der Vorschau simuliert, in Produktion aus).
- Container: nginx ohne root, nur lesbar, Security-Header aus einer Quelle, Healthcheck.
- CI: Dispatcher mit wiederverwendbaren Workflows, Pages-Workflow, Dependabot.
- Fehler aus den Tests behoben: Header zu breit bei 320 px, Footer-Umbrüche bei 768 px, E-Mail-
  Umbruch, Lenis-Sprung an veraltete Seitenlänge (auch in PSYber angelegt), Rechte im Image.

Unabhängige Reviews (Rollen `code-reviewer` und `security-reviewer`): im neuen Code kein
Critical und kein High. Alle Medium- und Low-Befunde sind behoben (`docs/DECISIONS.md` 28–36),
offen bleibt der Critical-Befund im Altbestand (Schadcode, `docs/TODO.md`).

Prüfungen am Schluss (alle grün, exakte Befehle in der Abschlussmeldung):

- `pnpm lint`, `pnpm lint:md`, `pnpm typecheck`, `pnpm test` (48 Unit-Tests), `pnpm audit`
- `pnpm build:pages && pnpm build`, `pnpm budgets`: 58,5 KB JS (Budget 120 KB)
- `pnpm e2e`: 99 Tests auf Desktop und Mobile, darunter axe WCAG 2.2 AA auf allen Seiten,
  Layout bei acht Breiten, Menü und Fokus, Formular, Basis-Pfad-Links, SEO
- `pnpm check:headers`: 49 Container-Prüfungen (Header auf allen Antworten, Traversal, 405, Log)
- Trivy Image und Repository inklusive Dev-Abhängigkeiten: 0 Schwachstellen, 0 Secrets,
  0 Fehlkonfigurationen; SBOM (CycloneDX, 725 Komponenten); hadolint, actionlint ohne Befund
- `node scripts/check-forbidden-files.mjs`, `python scripts/validate_claude_config.py` und
  Python-Tests

Offen: siehe `docs/TODO.md`. Gate G0 (D-001 bis D-008) ist weiterhin offen; die Demo ist keine
Produktionsfreigabe.
