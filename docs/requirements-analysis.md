# Anforderungsanalyse und Entscheidungsregister

**Stand:** 14.09.2026 (Erstfassung 12.09.2026)
**Status:** Entwurf für Auftraggeber-Review; keine Produktfreigabe
**Primärquelle:** `docs/homepage-anforderungen.md`
**Ergänzende Belege:** `old/Homepage.docx`, `old/index.html`, `docs/bestandsinventar.md`

## 1. Verstandener Auftrag

Lüscher Wohnen benötigt einen hellen, freundlichen und seriösen Relaunch. Die
Website soll das Unternehmen, sein Sortiment und seine persönliche Beratung
vorstellen, Vertrauen schaffen, Kontakt und Standort leicht auffindbar machen
und ausgeführte Projekte zeigen. Die Hauptzielgruppe ist über 40, eher wenig
technikaffin und nutzt vor allem Desktop und Mobile. Daher haben Orientierung,
Lesbarkeit, grosse Interaktionsflächen und ein unkomplizierter Kontaktweg
Vorrang vor visuellen Effekten.

Der erste Release ist eine Informations- und Lead-Website. Ein kleiner
Online-Shop ist als zweite Ausbaustufe genannt und wird wegen Zahlungs-, Rechts-,
Betrugs-, Betriebs- und Datenschutzfolgen nicht stillschweigend in das MVP
gezogen.

Rahmenbedingungen aus dem Briefing:

- Entscheider und Freigabeinstanz ist Andreas Längle (Abschnitt 9); er pflegt
  auch die Inhalte langfristig (Abschnitt 6) und hat die alte Website
  konzipiert und umgesetzt (Impressum in `old/Homepage.docx`).
- Kein festes Launch-Datum, Wunsch "möglichst schnell" (Abschnitte 1 und 9).
  Das spricht für ein kleines MVP und den Shop als getrennte Phase.
- Kein Redaktionssystem gewünscht (Abschnitt 6); der Pflegeprozess ohne CMS
  ist zu klären (`D-016`).
- Keine Anbindung an bestehende Systeme, kein Analytics oder Tracking
  (Abschnitt 7).

## 2. Konsolidierter MVP-Vorschlag (noch freizugeben)

| ID | Ergebnis | Quelle | Prüfbarkeit |
|---|---|---|---|
| WEB-F-001 | Eine lange Startseite führt zu Firma, Sortiment, Services, Projekten, Standort und Kontakt. | Abschnitte 1, 4, 10 | Alle Bereiche sind per Navigation und Tastatur erreichbar. |
| WEB-F-002 | Sortiment umfasst Möbel, Polstermöbel, Betten, Bodenbeläge, Teppiche, Vorhang- und Beleuchtungssysteme. | Abschnitt 1 | Jeder genannte Bereich ist sichtbar und verständlich beschrieben. |
| WEB-F-003 | Services umfassen Innenarchitektur, Beratung im Geschäft und vor Ort sowie Lieferung und Montage durch eigene Mitarbeitende. | Abschnitt 1 | Alle Services sind auf der Seite auffindbar. |
| WEB-F-004 | Ein Kontaktweg und eine Standortansicht werden angeboten. | Abschnitte 4, 5 | Erfolgs-, Fehler-, Datenschutz- und Tastaturfluss sind getestet. |
| WEB-F-005 | Impressum und Datenschutz sind eigene, direkt erreichbare Seiten. | Abschnitt 4 | Beide URLs sind ohne JavaScript erreichbar und im Footer verlinkt. |
| WEB-F-006 | Referenzprojekte werden als optional aktivierbarer Bereich vorgesehen. | Abschnitte 1, 4 | Bereich wird nur mit freigegebenen Inhalten veröffentlicht. |
| WEB-F-007 | Kein Tracking, keine Cookies und keine Drittanbieter-Abrufe beim Seitenaufruf ohne belegten Bedarf. | Abschnitt 7 | Netzwerkprotokoll eines Seitenaufrufs zeigt nur die eigene Domain. |
| WEB-Q-001 | Kernflüsse erfüllen WCAG 2.2 AA. | Abschnitte 2, 7 | Automatisierter Scan plus manueller Tastatur-/Screenreader-Check. |
| WEB-Q-002 | Oberfläche funktioniert responsiv auf Mobile und Desktop. | Abschnitt 2 | Definierte Viewports ohne horizontalen Inhaltsverlust. |
| WEB-Q-003 | Lösung minimiert Frameworks und Betriebsaufwand. | Auftrag 12.09.2026 | Jede Laufzeitabhängigkeit ist im ADR begründet. |
| WEB-Q-004 | Änderungen werden risikobasiert geprüft und als Docker-Image lieferbar gebaut. | Auftrag 12.09.2026 | Pfadbasierte CI, reproduzierbarer Build, SBOM und Scan sind belegt. |

### Nicht automatisch Teil des MVP

- Online-Shop (`Phase 2`; Produkte, Preise, Bestand, Zahlung und Recht offen)
- Blog/News und Referenzen sind im Briefing mit "Kann" priorisiert
- Newsletter, Login, Live-Chat, Terminbuchung, Video und Downloads sind nicht
  ausgewählt
- Analytics/Tracking ist ausdrücklich nicht gewünscht
- Mehrsprachigkeit ist nicht ausgewählt; die tatsächliche Sprache ist dennoch zu
  bestätigen

## 3. Informationsarchitektur-Vorschlag

1. **Startseite:** Hero mit klarer Positionierung und primärer Kontaktaktion
2. **Sortiment:** verständliche Kategorien statt technischer Filter
3. **Beratung & Service:** Ablauf von Erstkontakt bis Montage
4. **Projekte:** wenige, hochwertige und freigegebene Referenzen
5. **Über uns:** Erfahrung, Team, Vertrauen und lokale Verankerung
6. **Standort & Kontakt:** Adresse, Öffnungszeiten, Telefon, E-Mail/Formular
7. **Separate Pflichtseiten:** Impressum und Datenschutz

Dies setzt "so wenige Seiten wie möglich" als Multi-Section-Website um, ohne die
Nachteile einer JavaScript-SPA für Robustheit, SEO und Pflichtseiten einzuführen.
Es ist ein Vorschlag, keine bereits freigegebene Architektur. Die Vorbilder aus
dem Briefing stützen ihn: form-wohnen.ch wegen des einfachen Aufbaus, talamona.ch
als modern, aber unübersichtlich.

## 4. Offene Entscheidungen - Umsetzung blockiert

Die Vorlage für den Kick-off mit Belegen, Optionen und Empfehlungen steht in
`docs/entscheidungsvorlage-kickoff.md`.

| ID | Entscheidung durch Auftraggeber | Warum nötig |
|---|---|---|
| D-001 | Firmenbezeichnung/Rechtsform, UID, verantwortliche Person, Anschrift und Aktualität der vorhandenen Kontaktangaben bestätigen (Kandidatenwerte in Abschnitt 7) | Impressum, Schema.org und Kontakt |
| D-002 | Primärsprache sowie allfällige weitere Sprachen | Navigation, Inhalte, SEO, Tests |
| D-003 | Kontaktkanal: Formular, E-Mail-Link oder beides; Empfänger, Pflichtfelder, Aufbewahrung und Löschung | Backend, Datenschutz und Spam-Schutz |
| D-004 | Standort(e), Öffnungszeiten und gewünschte Kartenlösung; Einwilligung für externe Karten oder datensparsame Alternative | Inhalt und Datenschutz |
| D-005 | Freigegebenes Logo (Vektor fehlt), Bildmaterial, Bildrechte je Lieferant, Teamtexte, Referenzen und Kundeneinwilligungen | Design, Copyright und Datenschutz |
| D-006 | Bedeutung von "rund um die Uhr": Erreichbarkeit, Vor-Ort-Service oder Marketingaussage | Vermeidung einer falschen Leistungszusage |
| D-007 | On-Prem-Server: Betriebssystem, Docker-Version, CPU-Architektur, Zugang und Administration, Staging/Produktion, Backup und Monitoring (Hosting bei Green ist seit 14.09.2026 abgelöst, siehe Abschnitt 8) | belastbare Betriebsarchitektur |
| D-008 | Docker-Hub-Organisation/Image-Name, private/öffentliche Registry, Freigabebranch/-tags und benötigte GitHub Environments | sichere CI/CD-Veröffentlichung |

## 5. Weitere Discovery-Fragen

| ID | Frage | Auswirkung |
|---|---|---|
| D-009 | Ist Suche im MVP trotz kleiner Seitenmenge zwingend, und welche Inhalte muss sie durchsuchen? | Suche kann unnötige Komplexität erzeugen. |
| D-010 | Welche Social-Media-Kanäle sind offiziell, und sind nur Links oder eingebettete Feeds gewünscht? | Embeds übertragen häufig Daten an Dritte. |
| D-011 | Welche bestehende Domain-/SEO-Struktur und welche Weiterleitungen müssen erhalten bleiben? | Ranking und fehlerfreie Migration. |
| D-012 | Welche messbaren Performance-Ziele und unterstützten Browser werden freigegeben? | Abnahmekriterien und Build-Budget. |
| D-013 | Wer bearbeitet Kontaktanfragen, in welcher Frist und über welchen Maildienst? | Zustellung, Monitoring und Datenschutzhinweis. |
| D-014 | Welche konkreten Produkte, Zahlungsarten, Liefergebiete, Retouren- und AGB-Prozesse gelten für Phase 2? | Shop-Architektur und Rechtsprüfung. |
| D-015 | Darf Bootstrap eingesetzt werden, falls semantisches HTML und kleines eigenes CSS nachweislich einfacher sind? | Die Quelle nennt Bootstrap als Wunsch, der Auftrag minimiert Frameworks. |
| D-016 | Wie pflegt Andreas Längle Inhalte ohne CMS (Dateien im Repository, Zuruf an das Team, anderes)? | Content-Modell, Pflegeprozess und Schulung. |
| D-017 | Welche Medien bleiben im Repository, und darf die Historie nach der Bereinigung neu geschrieben werden? | 287 MB Bestand verlangsamen Klone und CI; Bereinigung ist destruktiv. |
| D-018 | Wie wird der Sicherheitsvorfall der alten Website behandelt, und dürfen die schädlichen Archive aus Repository und Historie entfernt werden? | Betrifft die alte Website bei Green; der Relaunch läuft on-prem, Zugangsdaten und Domain-Umzug bleiben betroffen. |
| D-019 | Reverse-Proxy und TLS auf dem On-Prem-Server: vorhandener Proxy (welcher, wer pflegt Zertifikate) oder mitgelieferter Proxy im Compose-Stack? | HSTS, Zertifikate, Weiterleitung `/kontakt`, Erreichbarkeit von aussen. |
| D-020 | Deployment-Weg vom Docker Hub auf den Server: self-hosted GitHub-Runner (nur ausgehende Verbindung), Pull-Skript auf dem Server oder SSH aus GitHub Actions? | Sicherheit der Zugänge, Automatisierungsgrad, Rollback. |

## 6. Risiken und Nicht-Annahmen

- "DSGVO-/Datenschutz-Besonderheiten: keine" hebt geltendes Schweizer
  Datenschutzrecht und gegebenenfalls die DSGVO nicht auf. Die konkrete
  Rechtslage muss eine qualifizierte Person freigeben.
- Barrierefreiheit ist verlangt; WCAG 2.2 AA ist der vorgeschlagene technische
  Abnahmestandard, bis der Auftraggeber einen anderen verbindlichen Standard
  nennt.
- Es gibt kein bestätigtes Corporate Design. Das erwähnte Grün ist als
  `#9cb703` belegt, erreicht auf Weiss aber nur 2.29:1 Kontrast und eignet sich
  nicht als Text- oder Linkfarbe (Abschnitt 7). Buttons brauchen dunkle
  Beschriftung.
- Die vorhandenen HTML-Dateien unter `docs/` sind Bestandsmaterial. Ihr Status,
  ihre Inhalte und Bildrechte werden geprüft; sie sind nicht automatisch die
  Produktionsbasis.
- Docker Hub ist als Registry bestätigt, der Betrieb erfolgt auf einem eigenen
  On-Prem-Server. Namensraum, Zugangstoken, Server-Fähigkeiten, Reverse-Proxy,
  Deployment-Weg und Secret-Verwaltung sind noch nicht dokumentiert.
- Die alte Website ist nach dem Befund vom 14.09.2026 vermutlich kompromittiert
  (`docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`).
  Server-seitiges Material der alten Website wird nicht übernommen; ein Betrieb
  des Relaunchs auf einer nicht bereinigten Umgebung ist ausgeschlossen.
- Der Medienbestand (287 MB, 1 038 Dateien) enthält Lieferanten- und
  Personenbilder ohne dokumentierte Rechte. Nichts davon wird ohne Freigabe
  veröffentlicht.

## 7. Verifizierter Repository-Bestand

Diese Angaben sind im Repository belegt, aber noch nicht als aktuell oder zur
Veröffentlichung freigegeben. Sie reduzieren die Discovery-Fragen, ersetzen
jedoch keine Bestätigung durch den Auftraggeber. Das vollständige Inventar
steht in `docs/bestandsinventar.md`.

| Beleg | Beobachtung | Status |
|---|---|---|
| `old/index.html`, Zeile 8 und 31 | Firmenname "Lüscher Wohnen AG" | Aktualität und rechtliche Schreibweise bestätigen (`D-001`) |
| `old/index.html`, Zeile 34 | Verschleierte E-Mail-Adresse `info` bei der Projektdomain | Empfänger und gewünschter Kontaktweg bestätigen (`D-003`) |
| `old/index.html`, Zeile 35 | Telefonnummer `+41 56 222 78 52` | Aktualität und Veröffentlichungsfreigabe bestätigen (`D-001`) |
| `old/index.html`, Zeilen 36-49 | Montag geschlossen; Dienstag-Freitag 10:00-18:30; Samstag 10:00-16:00 | Aktualität bestätigen (`D-004`) |
| `old/index.html`, Zeile 3 | `lang="en"` bei deutschem Inhalt; `style.css`, `favicon.ico`, `index.js` fehlen | Bestandsmangel; nicht übernehmen |
| `old/index-new.html`, Zeilen 7-10 und 42-45 | Bootstrap 5.3.8 wird über jsDelivr mit SRI eingebunden | Nur Bestandsentwurf, keine Architekturfreigabe (`D-015`) |
| `old/Homepage.docx`, Impressum | Lüscher Wohnen AG, Weite Gasse 9, 5400 Baden; Telefon +41 56 222 78 52; Fax +41 56 222 32 75; `info@luescherwohnen.ch`; Geschäftsleiter Michael Längle; Handelsregister Kanton Aargau; MwSt-Nr. CHE 116.367.369 | Kandidatenwerte für Impressum und Kontakt (`D-001`, `D-004`) |
| `old/Homepage.docx`, Farbtabelle | Text `#272727`, Hintergrund `#ffffff`, Link und Akzent `#9cb703`; Kontrast Grün auf Weiss 2.29:1, Dunkelgrau auf Grün 6.54:1 | Grün belegt; nur als Fläche mit dunkler Schrift nutzbar (`D-005`, Design-Tokens Phase 1) |
| `old/Homepage.docx`, Seitenstruktur | HOME, Services, Virtuelle Showrooms, Über uns, Kontakt, Shop mit acht Produkten, Impressum, AGB (20.08.2023) | Grundlage für Redirect-Plan (`D-011`) und Shop-Discovery (`D-014`) |
| `old/Homepage.docx`, Services | "wann und wo Sie es wünschen"; Lieferung "auch an einer Randzeit oder am Wochenende" | Präzisiert die Aussage "rund um die Uhr" (`D-006`) |
| `old/ressources/`, Commit `dba9590` | 1 038 Dateien, 287 MB, WordPress-Upload-Struktur; Logo nur als PNG; Porträts, Referenzen, Lieferantenbilder | Rechteinventar offen (`D-005`); Bereinigung (`D-017`) |
| `old/ressources/2026/08/*.zip` | Zwei Archive mit PHP-Backdoor und verschleiertem PHP-Code | Sicherheitsvorfall (`D-018`) |

Ein Abruf von `https://luescherwohnen.ch/` am 12.09.2026 und am 14.09.2026
lieferte dieser Arbeitsumgebung HTTP 403 von einer Web Application Firewall.
Daraus wird weder der Produktionsinhalt noch die Hosting-Konfiguration
abgeleitet.

## 8. Freigabeprotokoll

Eine Entscheidung gilt erst als freigegeben, wenn Datum, Entscheider, Wortlaut
und betroffene IDs hier oder in einem ADR festgehalten sind. Mündliche oder aus
Kontext vermutete Freigaben reichen nicht.

| Datum | Entscheider | IDs | Entscheid/Wortlaut |
|---|---|---|---|
| 14.09.2026 | Repository-Eigentümer (valITino), dem Auftraggeber zur Kenntnis | D-007, D-008 | "We want to host the website on our on-prem server, not on Green. There will just be the configuration of the DNS A record ... but this is a different story, not for here and now." Docker Hub bleibt die Registry, in die die Pipeline publiziert (Auftrag an Codex). Der Wunsch "Green als Hosting Provider" aus dem Briefing ist damit abgelöst. |
