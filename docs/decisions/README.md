# Architecture Decision Records

**Zweck:** Jede Architektur-, Betriebs- und Sicherheitsentscheidung wird als
kurzer, nummerierter Datensatz festgehalten. Angenommene ADRs sind für die
Umsetzung verbindlich (`CLAUDE.md`, Abschnitt 1).

## Regeln

- Dateiname: `ADR-NNNN-kurztitel.md`, fortlaufend nummeriert, nie umnummeriert.
- Status: `Vorgeschlagen`, `Angenommen`, `Abgelehnt` oder `Ersetzt durch ADR-NNNN`.
- Nur der Auftraggeber oder eine von ihm benannte Person setzt den Status auf
  `Angenommen`; Datum, Entscheider und Wortlaut werden im ADR und im
  Freigabeprotokoll der Anforderungsanalyse festgehalten.
- Ein ADR nennt die verglichenen Optionen, darunter immer die einfachste
  statische oder serverseitige Lösung, und begründet jede Laufzeitabhängigkeit.
- Ein ADR trägt keine `ANNAHME - ZU BESTAETIGEN` in den Entscheidungsteil.

## Vorlage

Siehe [`template.md`](template.md). Die erste ADR-Serie entsteht in Phase 1,
sobald Gate G0 erreicht ist (Minimal-Stack und Bootstrap, Kontaktweg, Karte,
Suche, On-Prem-Deployment, Docker Hub, Umgebungen und Rollback).

## Index

| ADR | Titel | Status |
|---|---|---|
| [ADR-0001](ADR-0001-minimal-stack-statische-website.md) | Minimal-Stack als statische Website mit reduziertem Bootstrap | Vorgeschlagen |
| [ADR-0002](ADR-0002-kontakt-karte-suche-im-mvp.md) | Kontaktweg, Karte und Suche im MVP | Vorgeschlagen |
| [ADR-0003](ADR-0003-container-auslieferung.md) | Auslieferung als rootless nginx-Container | Vorgeschlagen |
