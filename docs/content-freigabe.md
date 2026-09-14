# Inhaltsfreigabe: Fakten auf der Website und ihre Quelle

**Stand:** 14.09.2026
**Zweck:** Jede Aussage auf der neuen Website ist entweder aus der Primärquelle
(`docs/homepage-anforderungen.md`) abgeleitet oder stammt aus dem
Bestandsmaterial unter `old/` und braucht die Bestätigung des Auftraggebers.
Ohne Bestätigung aller Zeilen mit Status `offen` erfolgt kein Deployment.

| Aussage oder Fakt | Ort auf der Website | Quelle | Status |
|---|---|---|---|
| Firmenname "Lüscher Wohnen AG" | alle Seiten, Impressum | `old/index.html`, `old/Homepage.docx` | offen (`D-001`) |
| Adresse Weite Gasse 9, 5400 Baden | Kontakt, Impressum, Fusszeile | `old/Homepage.docx` (Impressum) | offen (`D-001`, `D-004`) |
| Telefon +41 56 222 78 52 | Startseite, Kontakt, Impressum, Fusszeile | `old/index.html`, `old/Homepage.docx` | offen (`D-001`) |
| E-Mail `info@luescherwohnen.ch` | Kontakt, Impressum, Datenschutz | `old/index.html` (verschleiert), `old/Homepage.docx` | offen (`D-001`, `D-003`) |
| Fax +41 56 222 32 75 | nicht übernommen | `old/Homepage.docx` | offen: nur aufnehmen, wenn noch bedient |
| Öffnungszeiten Mo geschlossen, Di–Fr 10:00–18:30, Sa 10:00–16:00 | Kontakt | `old/index.html` | offen (`D-004`) |
| Geschäftsleiter Michael Längle | Impressum | `old/Homepage.docx` | offen (`D-001`) |
| Handelsregister Kanton Aargau, MwSt-Nr. CHE 116.367.369 | Impressum | `old/Homepage.docx` | offen (`D-001`); Schreibweise der UID prüfen |
| Sortiment: Möbel, Polstermöbel, Betten, Bodenbeläge, Teppiche, Vorhangsysteme, Beleuchtungssysteme, Inneneinrichtung | Sortiment | Briefing, Abschnitt 1 | aus Primärquelle |
| Bodenbeläge: Teppich, Parkett, Laminat, Vinyl, Kork | Sortiment | `old/Homepage.docx` (Services) | offen: Aufzählung bestätigen |
| Services: Innenarchitektur, Beratung im Geschäft und vor Ort, Lieferung und Montage durch eigene Mitarbeitende | Beratung & Service | Briefing, Abschnitt 1 | aus Primärquelle |
| Lieferung "zu einem Termin, der Ihnen passt" | Beratung & Service | `old/Homepage.docx` ("Lieferzeitpunkt ... Randzeit oder Wochenende") | offen (`D-006`) |
| Werte: persönliche Beratung, zuverlässiger Service, langjährige, vertrauensvolle Beziehung | Über uns | Briefing, Abschnitt 2 (Zielgruppe) | aus Primärquelle; Wortlaut bestätigen |
| Logo (PNG, 765 × 190 px) | Kopfzeile | `old/ressources/2021/02/Luescher_logo.png` | offen (`D-005`): Vektorlogo beschaffen |
| Grün `#9cb703` für Buttons, Text `#272727` | Gestaltung | Briefing, Abschnitt 3; `old/Homepage.docx` (Farbtabelle) | Farbwert belegt; Verwendung nur mit dunkler Schrift |
| Kartenlink zu OpenStreetMap | Kontakt | ADR-0002 | offen (`D-004`) |
| Datenschutzerklärung (Entwurf) | Datenschutz | Aufbau der Website, ADR-0002 | offen: Prüfung durch qualifizierte Fachperson; Betreiber des On-Prem-Servers und Aufbewahrung der Zugriffsprotokolle ergänzen (`D-007`) |
| Referenzprojekte, Teamfotos, Firmengeschichte | noch nicht auf der Website | `old/ressources/`, `old/Homepage.docx` | offen (`D-005`, WEB-F-006) |
| Social-Media-Links | noch nicht auf der Website | Briefing, Abschnitt 5 | offen (`D-010`) |

## Bewusst nicht übernommen

- "Rund um die Uhr" (Briefing, Abschnitt 2) bis `D-006` geklärt ist.
- Shop, Produkte, Preise, AGB und Widerrufsrecht der alten Website (Phase 2).
- Lieferanten- und Markennamen, Auszeichnungen, Presseartikel und
  Kundenzitate ohne belegte Rechte und Freigabe.
- Suchfunktion (`D-009`), eingebettete Karte (`D-004`), Kontaktformular
  (Folge-Inkrement gemäss ADR-0002).
