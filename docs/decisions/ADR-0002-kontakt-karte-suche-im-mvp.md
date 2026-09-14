# ADR-0002: Kontaktweg, Karte und Suche im MVP

**Status:** Vorgeschlagen (Inkremente 1 und 2 auf Anweisung des Repository-Eigentümers umgesetzt; Annahme durch den Auftraggeber offen)
**Datum:** 14.09.2026
**Entscheider:** offen (Auftraggeber: Andreas Längle)
**Bezug:** WEB-F-004, WEB-F-007; `D-003`, `D-004`, `D-009`, `D-013`

## Kontext

Das Briefing wünscht Kontaktformular, Landkarte und Suche. Die Zielgruppe ist
wenig technikaffin; Tracking und Drittanbieter ohne Bedarf sind ausgeschlossen.
Hosting und Formularempfänger sind noch nicht bestätigt (`D-003`, `D-007`).

## Optionen und Entscheidung

| Thema | Entscheidung für Inkrement 1 | Folge-Inkrement |
|---|---|---|
| Kontakt | Telefon (`tel:`), E-Mail (`mailto:`), Adresse und Öffnungszeiten als HTML; ohne JavaScript nutzbar | Umgesetzt als Dienst `kontakt/` (Node.js, eine Laufzeitabhängigkeit: nodemailer): zwei Schritte ohne JavaScript (prüfen, dann senden), serverseitige Validierung, Honeypot, signiertes Zeit-Token mit Mindestwartezeit, Ratenbegrenzung je Anschluss, Origin-Prüfung, Grössenlimit, kein Speichern, keine Personendaten im Log; Zustellung per SMTP an das Firmenpostfach (`D-003`, `D-013`). Läuft als eigener Container hinter nginx unter `/kontakt`. |
| Karte | Adresse als Text plus Link "Route planen" zu einem Kartendienst, der erst beim Klick aufgerufen wird; keine eingebettete Karte, keine Drittanbieter-Anfrage beim Seitenaufruf | Falls `D-004` eine eingebettete Karte verlangt: Zwei-Klick-Lösung mit Einwilligung |
| Suche | Keine Suchfunktion; Sprungmarken-Navigation und Browser-Suche genügen für eine lange Seite | Neu bewerten mit dem Shop (`D-009`, `D-014`) |

Verworfen: eingebettete Karten beim Seitenaufruf (Datenübertragung an Dritte,
Einwilligungslösung nötig), Formulardienste von Drittanbietern (Daten beim
Anbieter, Abhängigkeit), Suchdienste von Drittanbietern.

## Folgen

- Inkrement 1 hat keine serverseitige Logik und keine personenbezogene
  Datenverarbeitung ausser dem, was E-Mail und Telefon ohnehin bedeuten.
- Der Datenschutzhinweis beschreibt nur diese Verarbeitung und wird mit dem
  Formular erweitert.
- Der Kartendienst für den Link ist bis `D-004` OpenStreetMap, weil er ohne
  Konto und ohne Tracking beim Seitenaufruf funktioniert; Wechsel ist ein
  Einzeiler.

## Verifikation

- Test "keine Drittanbieter": Beim Aufruf jeder Seite gehen alle Anfragen an
  die eigene Domain.
- Test "Kontaktangaben": `tel:`- und `mailto:`-Links sind im Hauptinhalt
  vorhanden und erreichbar.
