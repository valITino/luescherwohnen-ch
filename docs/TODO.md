# Offene Angaben und Aufgaben

Was fehlt oder zu bestätigen ist, bevor die Website produktiv gehen kann. Nichts davon wurde
erfunden; Annahmen sind als `ANNAHME - ZU BESTAETIGEN` markiert. Die IDs D-… verweisen auf das
Entscheidungsregister in `docs/requirements-analysis.md`, W… auf Widersprüche im Bestand.

## Sofort: Sicherheitsbefund im Bestand

- [ ] **Schadcode in `docs/ressources/2026/08/` (Critical, Altbestand).** Die Archive enthalten
      WordPress-Hintertüren aus dem Upload-Ordner der alten Website (August 2026, Commit
      `dba9590`). `contact_1787305442/abilities/page_template_1787305442.php` führt PHP-Code aus
      einem Request-Parameter aus (Remote Code Execution ohne Anmeldung); `f88a21ec.zip` ist ein
      stark verschleiertes Fake-Plugin. Prüfsummen (SHA-256) als Erkennungsmerkmal:
  - `contact_1787305442-1.zip`: `17e6a2e6cb6660dec14f34d5dd46ccfdd617c1147262b758928f8ecfe1bd8cc3`
  - `f88a21ec.zip`: `e8ce6ee3cb8a6c7aecbe82826ec3d6010fe671751e31704e64f413abb19fc5f0`

  Empfohlene Schritte (Entscheid beim Auftraggeber):

  1. Auftraggeber und Hoster der alten Website sofort informieren.
  2. Die alte Website forensisch sichern, dann offline nehmen oder bereinigen; nach weiteren
     Webshells, fremden Admin-Konten und Cronjobs suchen.
  3. Alle Zugangsdaten wechseln (WordPress, Hosting-Panel, SFTP, Datenbank, gegebenenfalls Mail).
  4. Danach die Archive mit Freigabe entfernen und prüfen, ob die Git-History bereinigt werden
     soll. `scripts/check-forbidden-files.mjs` lässt bis dahin nur genau diese zwei Dateien mit
     unveränderter Prüfsumme zu und meldet jede neue PHP-, Archiv- oder Binärdatei.

  Die Dateien gelangen in kein Build-Artefakt (`docs/` ist im Docker-Kontext und im Pages-Build
  ausgeschlossen; geprüft in `dist`, `dist-pages` und im Image).

## Vor Produktion (Gate G0/G1)

- [ ] D-001 Firma, Rechtsform, UID/MwSt-Nr. (bisher «CHE 116.367.369»), verantwortliche Person
      und Kontaktangaben bestätigen; Funktion von Michael Längle (W3).
- [ ] D-002 Sprache: nur Deutsch (Schweiz)? Die Website ist einsprachig gebaut.
- [ ] D-003 Kontaktweg: Formular, E-Mail oder beides; Empfänger, Pflichtfelder, Aufbewahrung,
      Löschung. Danach Empfänger bauen (serverseitige Prüfung, Spam-Schutz, Rate Limit).
- [ ] D-004 Öffnungszeiten bestätigen, besonders Samstag 9:00 oder 10:00 Uhr (W1; die aktuelle
      Website nennt am 21.11.2026 «Samstag 9:00 bis 16:00 Uhr», die Demo zeigt 10:00); Feiertage und
      Betriebsferien; Kartenlösung (derzeit Link zu OpenStreetMap).
- [ ] D-005 Team (Entscheid 46): Einwilligung von Michael Längle, Iris Längle, Christina Stahl und
      Vlavono Macoso für Name, Aufgabe und Foto auf der neuen Website; Fotos von Christina Stahl
      und Vlavono Macoso (bis dahin Initialen); Funktion von Michael Längle (W3: Impressum
      «Geschäftsleiter», aktuelle Website «Geschäftsführer»).
- [ ] D-005 Bildrechte: Herstellerbilder (Slider, Creation Baumann, Baltensweiler,
      Klangboxen-Fotograf), eigene Referenzfotos (Einwilligung der Kundschaft), Porträts von Hans
      Lüscher, Bruno Längle und Michael Längle; Freigabe des Favicons «L».
- [ ] D-005 Offizielle Logodatei (SVG/AI/EPS) liefern; Claim «Leben und wohnen Sie schön» aus der
      RIETZ-Einladung verwenden oder nicht (W14).
- [ ] D-006 «Rund um die Uhr»: Die Website sagt nur «Sehr gerne beraten oder besuchen wir Sie auch
      ausserhalb der Öffnungszeiten» (wörtlich von der bisherigen Website).
- [ ] D-007 Hosting (Green), Container-Schnittstelle, Domain/DNS, Staging. Danach Hosting-Anbieter
      in der Datenschutzerklärung eintragen (Platzhalter `[TODO …]`).
- [ ] D-008 Docker Hub (Organisation, Image-Name, Tags, Freigabe-Branches); erst dann Publish-
      und Deploy-Workflow.
- [ ] D-010 Social-Media-Kanäle (nur Links, keine Einbettungen).
- [ ] D-011 Bestehende URLs der WordPress-Website und Weiterleitungen.
- [ ] D-015 Bootstrap: Die Demo nutzt das PSYber-System ohne Bootstrap (DECISIONS 4).
- [ ] Datenschutzerklärung und Impressum rechtlich prüfen lassen (beide als Entwurf markiert).
- [ ] Texte freigeben (DECISIONS 21), Rechtschreibung des Bestands korrigieren dürfen (W18).
- [ ] Aktualität der Beiträge unter «Aktuell» (3D-Druck-Möbel, Klangboxen, Interview Ausgabe 125).
- [ ] Projekte (Referenzen): Titel und Freigabe; in Produktion `PUBLIC_SHOW_PROJECTS=true` (W16).
- [ ] Fläche und Etagen «6 Etagen, rund 1200 m²» bestätigen (W19).
- [ ] Kürzungen und Verschiebungen der Texte freigeben (Entscheid 45), besonders: Zitat aus dem
      Interview bei «Über uns», der gestrichene Satz zum Schlafen, Lieferung als ein Satz.
- [ ] SEO zum Start (Entscheid 45): Weiterleitungen der alten WordPress-Adressen und von
      `www.luescherwohnen.ch` auf `luescherwohnen.ch` (D-011, D-007); Google Business Profile
      übernehmen, Name, Adresse, Telefon und Öffnungszeiten wie auf der Seite (W1: Samstag);
      Koordinaten der Weiten Gasse 9 aus amtlicher Quelle (swisstopo, mindestens fünf
      Nachkommastellen) für die strukturierten Daten; Fotos des Geschäfts in 1:1, 4:3 und 16:9
      (Rechte, D-005); Haltung zu KI-Crawlern (Training sperren oder nicht, Entscheid beim
      Auftraggeber); nach dem Start Search Console bestätigen und die Sitemap einreichen.
- [ ] `ANNAHME - ZU BESTAETIGEN`: security.txt nennt vorerst `info@luescherwohnen.ch` als Kontakt.
- [ ] `ANNAHME - ZU BESTAETIGEN`: Tage ohne Zeile in der Öffnungszeiten-Tabelle gelten als
      geschlossen (betrifft nur den Live-Status).

## Prüfungen, die noch Menschen brauchen

- [ ] Manueller Tastatur- und Screenreader-Test (NVDA/VoiceOver) der Kernflüsse (WEB-Q-001); axe
      deckt nur einen Teil von WCAG 2.2 AA ab.
- [ ] Sichtprüfung auf echten Geräten (iOS Safari, Android Chrome, Windows/Edge).
- [ ] Repository-Einstellungen (nur mit Admin-Recht, von hier nicht prüfbar): Pages-Quelle
      «GitHub Actions»; Environment `github-pages` nur für `main` (`docs/DEPLOY.md`, Abschnitt 1).
- [ ] Freigabe des Designs durch den Auftraggeber.
- [ ] Bewegung auf einem echten Mittelklasse-Android messen (Chrome DevTools, Leistung): Menü-
      Vorhang und Bild-Enthüllung beim Wischen, Wischen ohne Lenis (Entscheid 39), gelegentliche
      Stockung von 83 ms beim Wischen. In der Cloud-Umgebung ohne Grafikchip lief der Vorhang am
      Desktop mit halber Bildrate; das sagt über echte Geräte wenig aus.
- [ ] Auf einem iPhone prüfen: Bild-Enthüllung ab einem Viertel bzw. 12 % der Fensterhöhe, an der
      Fensterkante und nach kurzer Ruhe im untersten Streifen (Entscheide 40 bis 42) fühlt sich
      beim Lesen ruhig an; Seitenwechsel in Safari (ohne Navigation API) lassen die Leiste
      stehen (Entscheid 42); das offene Menü sperrt den
      Hintergrund (ohne Lenis nur über `overflow: hidden` am `<html>`; iOS vor 16 beachtet das
      beim Wischen nicht, nicht prüfbar).
- [ ] Kontrast des Knopfs «Beratung anfragen» in der Kapsel von Hand bestätigen: axe kann ihn wegen
      der Ebene für den Hover-Schein (`::after`) nicht mehr berechnen. Gemessen 7,2:1 (berechnet)
      und 7,3:1 (Pixel), Hover 9,2:1; erfüllt AA. Die Farben sind unverändert.

## Später

- [ ] Shop (Phase 5, separater Auftrag mit eigenem Threat Model; AGB im Bestand vorhanden).
- [ ] Hero-Fotos in höherer Auflösung (keine Datei im Bestand ist breiter als 1920 px).
- [ ] Fotos der Ausstellung an der Weiten Gasse 9 (es gibt nur ein Innenbild).
- [ ] Bei reduzierter und angehaltener Bewegung wechselt der Header sofort die Form; das zählt
      als Layoutverschiebung (CLS 0,031 je Wechsel, gemessen am Desktop beim Scrollen mit dem
      Rad). Bewusst so belassen: Die Leiste dafür ein Bild lang zu verbergen, wie beim animierten
      Wechsel, wäre ohne Abtauchen ein sichtbares Blinken. (Beim Laden mit Direktlink und beim
      Neuladen gibt es keine Verschiebung mehr, seit das Skript vor dem ersten Bild läuft,
      Entscheid 44.)
- [ ] Chromium (153) stürzt ab, wenn ein Skript während eines Seitenübergangs mit
      `getComputedStyle()` den Stil einer nicht beteiligten Ebene liest, für die eine Regel mit
      `:only-child` gilt (etwa `::view-transition-new(site-bar)`). Die Website liest ihn nie,
      Tests nutzen `getAnimations()`. Kleinstes Beispiel bei Bedarf als Fehlerbericht an Chromium.
- [ ] Setzt man im Hero fort, steht man am Ende der angepinnten Strecke (die Ansicht bleibt, die
      erste Zeile und das Bild gleiten zu ihrem Endpunkt, Entscheid 42). Oben am Anfang zu bleiben,
      hiesse den Inhalt um die gescrollte Strecke zu verschieben.
