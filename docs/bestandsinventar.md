# Inventar des Bestandsmaterials

**Stand:** 14.09.2026
**Status:** Befund; keine Freigabe von Inhalten oder Bildrechten
**Bezug:** Projektplan Phase 0 (Inventar), `D-005`, `D-011`, `D-017`, `D-018`

## 1. Zweck und Methode

Alle Dateien im Repository, die nicht vom Projektteam erstellt wurden, sind
Bestandsmaterial der alten Website. Sie sind Beleg und Rohstoff, aber nicht
automatisch Produktionsbasis. Dieses Inventar wurde ausschliesslich mit lokalen,
lesenden Werkzeugen erstellt (`git log`, `find`, `file --mime-type`, `unzip -l`,
`grep`, Textextraktion aus `docx`). Nichts wurde ausgeführt, nichts wurde
gelöscht oder verändert.

## 2. Dateien ausserhalb des Medienordners

| Datei | Herkunft | Befund |
|---|---|---|
| `docs/homepage-anforderungen.md` | Auftraggeber, 05.09.2026 | Ausgefülltes Briefing-Formular; fachliche Primärquelle. |
| `docs/Homepage.docx` | Auftraggeber, 04.09.2026 (Metadaten: Autor "Andreas und Iris Längle") | Beschreibung der alten Website: Farbwerte, Seitenstruktur, Seitentexte, Impressum, AGB vom 20.08.2023. Kein Duplikat des Briefings. |
| `docs/index.html` | Auftraggeber | Platzhalterseite "Wir gestalten unsere Website neu" mit E-Mail, Telefon und Öffnungszeiten. `lang="en"` trotz deutschem Inhalt; verweist auf nicht vorhandene `style.css`, `favicon.ico` und `index.js`. |
| `docs/index-new.html` | Auftraggeber | Gleicher Inhalt mit Bootstrap 5.3.8 ab jsDelivr-CDN (SRI vorhanden), Titel "Document", `lang="en"`. Technischer Versuch, kein Design. |

### Inhalte aus `docs/Homepage.docx`

Farbwerte der alten Website (Kontrast nach WCAG 2.x, berechnet am 14.09.2026):

| Element | Wert | Kontrast | Bewertung |
|---|---|---|---|
| Text, Titel, Buttons | `#272727` auf `#ffffff` | 14.94:1 | erfüllt AA und AAA |
| Link und Link-Hover | `#9cb703` auf `#ffffff` | 2.29:1 | verfehlt AA (mindestens 4.5:1 für Text) |
| Weisser Text auf Grün | `#ffffff` auf `#9cb703` | 2.29:1 | verfehlt AA; als Button-Beschriftung ungeeignet |
| Dunkler Text auf Grün | `#272727` auf `#9cb703` | 6.54:1 | erfüllt AA |

Das im Briefing "erwähnte Grün" ist damit belegt (`#9cb703`). Es kann als
Flächen- und Akzentfarbe mit dunkler Beschriftung verwendet werden, nicht als
Textfarbe auf Weiss.

Seitenstruktur der alten Website laut Dokument: HOME (Aktionen: nachhaltige
3D-Druck-Möbel, Klangboxen Senn und Huuri, Interview mit Michael Längle in
"Einrichten Schweiz" Ausgabe 125), Services (Kompetenzen; Lieferung und
Montage), Virtuelle Showrooms, Über uns (Unternehmen, Firmenstandorte,
Firmengeschichte), Kontakt (Öffnungszeiten, Kontakt und Anfahrt), Shop mit acht
Produktseiten (Huuri ELIA, Huuri Waldklang, Senn, Badener Regenschirm,
Geschenkgutschein, Lederpflegeset De Sede, Zett USB, Zunftwein Cordulazunft),
Impressum, AGB.

Impressum laut Dokument (zu bestätigen, `D-001`): Lüscher Wohnen AG, Weite
Gasse 9, 5400 Baden; Telefon +41 56 222 78 52; Fax +41 56 222 32 75;
`info@luescherwohnen.ch`; Geschäftsleiter Michael Längle; Handelsregister des
Kantons Aargau; MwSt-Nr. CHE 116.367.369; Seitenkonzept, Design und Umsetzung
Andreas Längle; Fotos von Lüscher Wohnen AG oder von Lieferanten zur Verfügung
gestellt.

## 3. Medienordner `docs/ressources/`

Hinzugefügt mit Commit `dba9590` ("Bild Ressourcen alte Webseite hinzugefügt",
Andreas Längle, 30.08.2026). Die Struktur `JJJJ/MM/` mit Varianten wie
`-300x300` entspricht dem Upload-Ordner einer WordPress-Installation; das
Akismet-Plugin in einem der Archive nennt "Tested up to: 7.0".
`ANNAHME - ZU BESTAETIGEN`: Die alte Website lief auf WordPress; das
Shop-System ist nicht belegt.

| Kennzahl | Wert |
|---|---|
| Dateien gesamt | 1 038 (736 JPG, 256 PNG, 36 GIF, 7 MP3, 1 PDF, 2 ZIP) |
| Grösse gesamt | 287 MB; `.git` dadurch 303 MB |
| Originale (ohne WordPress-Grössenvarianten) | 146 Dateien, 182.9 MB |
| Automatisch erzeugte Grössenvarianten | 890 Dateien, 101 MB; aus den Originalen reproduzierbar |
| Drei animierte GIF (Lederpflegeset) | 98.6 MB, grösste Einzeldateien mit 27 bis 39 MB |
| Nach Jahr | 2021: 502 Dateien, 84 MB; 2023: 247, 166 MB; 2024: 221, 31 MB; 2025: 66, 6.2 MB; 2026: 2 ZIP, 0.2 MB |

Integritätsprüfung am 14.09.2026: Bei allen 1 036 Bild-, Audio- und PDF-Dateien
stimmt der Dateityp mit der Endung überein; keine Datei enthält PHP-Code; das
PDF enthält keine aktiven Inhalte (JavaScript, OpenAction, Launch). Die beiden
ZIP-Archive enthalten PHP-Schadcode, siehe Abschnitt 5.

### Inhaltliche Gruppen (nach Dateinamen)

| Gruppe | Beispiele | Bemerkung |
|---|---|---|
| Logo und Site-Icon | `Luescher_logo.png` (765 × 190 Pixel, PNG), mehrere `cropped-` Varianten | Nur Rasterformat; keine Vektordatei vorhanden (`D-005`). |
| Personen | Porträts Michael Längle (2015), Bruno Längle, Hans Lüscher | Einwilligung für Veröffentlichung nötig (`D-005`). |
| Referenzprojekte | Otelfingen, Bellikon, Wettingen, Bergdietikon, Treppenbelag, Wohn- und Essbereiche | Eigene Fotos laut Impressum; Freigabe der Kundschaft klären. |
| Sortiment und Slider | `main-slider-*`, Kompetenzen Bodenbelag und Polstermöbel, Services Montage | Teilweise eigene, teilweise Lieferantenbilder. |
| Lieferantenmaterial | de Sede, Ligne Roset, Création Baumann, Giroflex, Intertime, Naturokork, Keralux, dineathome | Nutzungsrecht je Lieferant schriftlich bestätigen (`D-005`). |
| Shop-Produkte | Klangboxen Senn und Huuri inklusive sieben MP3-Hörproben, Badener Regenschirm, Geschenkgutschein, Zunftwein Cordulazunft, Lederpflegeset | Nur relevant für Phase 2; Zunftwein-Fotos nennen Personen im Dateinamen. |
| Anlässe und Presse | Einladungskarte Rietz (PDF, 2024), Interview "Einrichten Schweiz" | Rechte an Drucksachen und Presseartikeln prüfen. |

## 4. Nicht im Repository vorhanden

- Vollständige URL-Liste der alten Website (Sitemap, Menüs, Weiterleitungen)
  für den Redirect-Plan (`D-011`).
- Quelltext, Theme, Plugins, Datenbank oder Konfiguration der alten Website.
  Das ist gewollt: Server-seitiges Material der alten Website wird nicht
  wiederverwendet (Abschnitt 5).
- Vektorlogo, Farbdefinition oder Schriftdefinition ausser den Werten in
  Abschnitt 2.
- Ein Abruf von `https://luescherwohnen.ch/` lieferte am 12.09.2026 und am
  14.09.2026 HTTP 403 (Web Application Firewall); die Live-Website konnte nicht
  inventarisiert werden.

## 5. Sicherheitsbefund

`docs/ressources/2026/08/contact_1787305442-1.zip` und
`docs/ressources/2026/08/f88a21ec.zip` enthalten keine Medien, sondern PHP-Code
mit den Merkmalen einer WordPress-Backdoor. Details, Belege und
Sofortmassnahmen: [`security/2026-09-14-altwebsite-verdacht-kompromittierung.md`](security/2026-09-14-altwebsite-verdacht-kompromittierung.md).
Die Archive bleiben bis zur Entscheidung `D-018` unverändert im Repository,
dürfen aber nicht entpackt oder auf einen Server kopiert werden.

## 6. Empfehlungen für das Repository (Entscheid `D-017`)

1. Die 890 Grössenvarianten und die zwei Archive entfernen; sie sind
   reproduzierbar beziehungsweise schädlich. Verbleib: 146 Originale.
2. Die drei animierten GIF (98.6 MB) nur behalten, wenn das Lederpflegeset in
   Phase 2 tatsächlich angeboten wird; sonst durch ein Standbild ersetzen.
3. Verbleibende Originale entweder mit Git LFS verwalten oder ausserhalb des
   Repositories ablegen, damit Klone und CI-Läufe nicht 300 MB laden.
4. Nach der Bereinigung die Git-Historie einmalig neu schreiben, damit die
   Archive und Grossdateien auch aus der Historie verschwinden. Das ist ein
   destruktiver Schritt, der alle Forks betrifft, und braucht den
   ausdrücklichen Auftrag des Repository-Eigentümers.

Bis zur Entscheidung wird nichts gelöscht. Die CI-Workflows laden den
Medienordner deshalb bewusst nicht (`sparse-checkout`), mit Ausnahme des
Secret-Scans über die Historie.
