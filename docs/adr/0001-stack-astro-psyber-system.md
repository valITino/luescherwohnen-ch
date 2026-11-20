# ADR-0001: Statische Website mit Astro nach dem PSYber-System

- **Status:** Vorgeschlagen, in der Demo umgesetzt; Freigabe durch den Auftraggeber offen (G1)
- **Datum:** 20.11.2026
- **Bezug:** WEB-F-001 bis WEB-F-006, WEB-Q-001 bis WEB-Q-003, D-015

## Kontext

Der Repository-Inhaber hat verlangt, Stil, Design, Format und Logik von `valITino/PsySec`
vollständig zu übernehmen. PSYber ist ein pnpm-Monorepo mit Astro 7, Tailwind 4 (nur Reset und
Utilities), eigenem Designsystem, GSAP und Lenis für Bewegung sowie Playwright- und
Vitest-Tests. CLAUDE.md verlangt die einfachste Lösung: statische bzw. serverseitig gerenderte
Seiten und Vanilla JavaScript vor einem SPA-Framework. Das Briefing wünscht Bootstrap bei einer
Eigenentwicklung ohne CMS.

## Entscheidung

- Astro 7 mit `output: 'static'`; jede Seite ist reines HTML und ohne JavaScript lesbar.
  Browser-Code ist Vanilla TypeScript in kleinen Modulen, kein SPA-Framework, keine Islands.
- Monorepo wie PSYber, beschränkt auf `apps/web`, `packages/ui` (Designsystem) und
  `packages/config` (Lint, TypeScript, Sites, Security-Header).
- Designsystem von PSYber mit hellem Farbschema (`docs/DESIGN.md`); kein Bootstrap.
- Laufzeit-Abhängigkeiten im Browser: GSAP und Lenis (nachgeladen, nicht bei reduzierter
  Bewegung), selbst gehostete Schriften. Alles andere ist Build-Werkzeug.

## Folgen

- Eine Abweichung vom Briefing (Bootstrap) bleibt als D-015 offen und ist dem Auftraggeber zur
  Entscheidung vorzulegen. Ein Wechsel zu Bootstrap hiesse, das Designsystem neu aufzubauen.
- Pflege ohne CMS: Inhalte stehen in Astro-Komponenten und `apps/web/src/config/site.ts`;
  Änderungen laufen über Pull Requests mit CI.
- JS-Budget wie PSYber 120 KB gzip (derzeit 58,9 KB), geprüft mit `pnpm budgets`.
