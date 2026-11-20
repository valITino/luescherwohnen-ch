# ADR-0002: Demo auf GitHub Pages

- **Status:** Angenommen für die Demo (Auftrag des Repository-Inhabers vom 20.11.2026)
- **Datum:** 20.11.2026
- **Bezug:** D-007, D-011

## Kontext

Der Repository-Inhaber hat GitHub Pages für seinen Fork aktiviert und möchte die Website dort
als Demo zeigen. Die produktive Plattform (Green) ist offen.

## Entscheidung

- Workflow `pages.yml` baut bei Push auf `main` mit `pnpm build:pages` und veröffentlicht unter
  `https://<owner>.github.io/<repo>/` (Basis-Pfad über `PUBLIC_WEB_URL`).
- Die Vorschau ist vollständig `noindex`, ihre robots.txt sperrt alles, oben steht ein
  Hinweis. Das Formular antwortet simuliert. Es gibt keine Server-Header; die CSP steht als
  Meta-Tag mit Hashes in jeder Seite.

## Folgen

- Keine Konkurrenz zur späteren Domain in Suchmaschinen.
- `frame-ancestors`, HSTS und die übrigen Header fehlen auf Pages (Plattformgrenze). Für den
  produktiven Betrieb gilt ADR-0003.
