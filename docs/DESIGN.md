# Designsystem Lüscher Wohnen

Stand: November 2026. Aufbau, Formatierung, Schrift, Bausteine und Bewegung folgen auf Wunsch
des Repository-Inhabers dem Designsystem von PSYber (`valITino/PsySec`, Commit `d521f90`):
riesige Überschriften in Versalien, Pillen, Bühnen und Bogen mit grossen Radien, eine Kapsel als
Header, schwebende Bedienelemente am Rand. Die Farben sind auf Entscheid vom 20.11.2026 **hell und
warm** statt fast schwarz (Briefing: «hell und freundlich», «seriös, minimalistisch,
warm/persönlich», Grün für Buttons). Die Cyber-Motive von PSYber (Hex-Nummern, Terminal, Eule,
Globus) sind durch wohnliche Pendants ersetzt.

Quelle der Wahrheit sind die Tokens in `packages/ui/src/styles/tokens.css`. Die Seite
`/styleguide` zeigt alle Bausteine.

## 1. Farben

| Token         | Hex     | Verwendung                                          | Kontrast              |
| ------------- | ------- | --------------------------------------------------- | --------------------- |
| `--linen`     | #f6f3ec | Seitenhintergrund                                   |                       |
| `--paper`     | #ffffff | Karten, Panels, papierweisse Bogen                  |                       |
| `--sand`      | #efeae0 | erhöhte Fläche in Karten                            |                       |
| `--sage`      | #e9eed9 | grünliche Bogen (Rolle wie «Space» bei PSYber)      |                       |
| `--hairline`  | #e2dccf | Linien (nie für Text)                               |                       |
| `--steel`     | #857e70 | Rahmen von Bedienelementen                          | 3,6:1 auf Leinen      |
| `--ash`       | #5c574d | Sekundärtext                                        | 6,5:1 auf Leinen      |
| `--moss`      | #4f5640 | Sekundärtext auf Sage                               | 6,5:1 auf Sage        |
| `--charcoal`  | #272727 | Text und Überschriften (Farbe der bisherigen Site)  | 13,5:1 auf Leinen     |
| `--leaf`      | #9cb703 | Aktion: Buttons, Auswahl (Grün der bisherigen Site) | Ink darauf 7,2:1      |
| `--leaf-edge` | #6e8200 | Rahmen grüner Flächen                               | 3,9:1 auf Leinen      |
| `--leaf-deep` | #4e5d00 | grüne Schrift, Links, Fokus-Ring, Nummern           | 6,6:1 auf Leinen      |
| `--ink`       | #1d2100 | Text auf Leaf und Amber                             | 7,2:1 auf Leaf        |
| `--night`     | #23231f | die eine dunkle Bühne (Footer)                      | Leinen darauf 14,2:1  |
| `--amber`     | #f9ad26 | Hinweise als Fläche (Vorschau-Leiste)               | Charcoal darauf 7,9:1 |

Das Grün der bisherigen Website (#9cb703) erreicht auf Weiss nur 2,3:1. Es steht darum nur als
Fläche mit dunkler Schrift (Buttons, Auswahl) und als Dekoration. Wo Grün Schrift oder
Fokus-Ring ist, gilt `--leaf-deep`. Statusfarben (`--ok`, `--warn`, `--crit`) nur zusammen mit
Icon und Text.

Durchscheinende Flächen nutzen die Kanal-Tokens (`--linen-rgb`, `--paper-rgb`,
`--charcoal-rgb`, `--sage-rgb`, `--leaf-rgb`, `--night-rgb`), zum Beispiel
`rgb(var(--leaf-rgb) / 0.12)`. Ausgeschriebene Farbwerte gehören nicht ins CSS.

### Flächen

- Standard ist Leinen. `.on-sage` setzt die Rollen für grünliche Bogen, `.on-night` für die
  dunkle Bühne im Footer (dort ist Grün auch als Schrift lesbar).
- Karten (`.card`) sind immer papierweiss und setzen ihre Rollen selbst zurück.
- `.sheet`: Sektion als Bogen mit runden oberen Ecken, der sich über die vorherige schiebt.
  Abfolge auf der Startseite: Leinen, Sage, Leinen, Papier, Sage, Leinen, Papier, Sage, Leinen.
- `.stage`: grosse Bühne mit Radius bis 44 px und grünem Schein in der Ecke (Besuch, Kontakt);
  `.stage-night` für den Footer.

## 2. Typografie

Wie bei PSYber: Manrope (Variable Font, 200–800) für Überschriften und Text, Geist Mono für
Nummern, Zeiten und die Zeilen unten im Footer. Beide SIL Open Font License, selbst gehostet,
die Latin-Dateien werden vorgeladen.

| Stil           | Grösse                                       | Schnitt                                   |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| Display / H1   | `clamp(2.375rem, 0.6rem + 5.8vw, 6.25rem)`   | 650, Versalien, −0.045em, Zeilenhöhe 0.92 |
| H2             | `clamp(1.9375rem, 0.9rem + 3.6vw, 4.5rem)`   | 650, Versalien, −0.035em, 0.98            |
| H3             | `clamp(1.375rem, 1.05rem + 1.1vw, 2.125rem)` | 650, Versalien, −0.035em                  |
| Titel          | 19–22 px                                     | 600, normale Schreibweise                 |
| Lead           | 20–26 px                                     | 400, Zeilenhöhe 1.36                      |
| Fliesstext     | **17–19 px** (PSYber: 16–18)                 | 400, Zeilenhöhe 1.55                      |
| Label / Kicker | 14 px (PSYber: 13)                           | 600, Versalien, gesperrt 0.08em           |

Die Schrift ist eine Stufe grösser als bei PSYber, weil die Zielgruppe älter als 40 und eher
ungeübt ist. Nichts ist kleiner als 13 px.

- Kicker stehen über der Überschrift mit Abschnittsnummer: `01 / Sortiment`. Nummer in Mono und
  dunklem Grün, Schrägstrich als Trenner, beide für Screenreader stumm (statt `0x01 //`).
- Telefonnummern in Manrope mit tabellarischen Ziffern (`.tabular`), nicht in Mono: Die breiten
  Mono-Leerzeichen machen grosse Nummern schwer lesbar.

## 3. Logo und Bildwelt

- **Wortmarke** «Lüscher WOHNEN AG» (`packages/ui/src/brand/logo-dark.svg`, `logo-light.svg`):
  aus dem bisherigen Logo (`Luescher_logo.png`) vektorisiert, Form unverändert. In der Kapsel
  steht sie kleiner, unter 480 px Breite entfällt sie dort.
- **Favicon und App-Icons**: das «L» aus der Wortmarke auf Lüscher-Grün (Vorschlag, D-005).
  `pnpm assets` erzeugt alle Grössen und das Vorschaubild.
- **Fotos**: aus dem Bestand der bisherigen Website, neu kodiert ohne Metadaten
  (`pnpm images`, `scripts/prepare-images.mjs`). Eigene Referenzfotos haben Vorrang vor
  Herstellerbildern. Rechte sind zu bestätigen (D-005).
- **Runde Bühne** im Hero (an der Stelle des Globus bei PSYber): Foto im Kreis mit grünem Rand.
  Auf dem Desktop rechts neben der Headline, nie unter dem Text.
- Keine Stockfotos, keine KI-Bilder. Icons: Lucide, 1.5 px Strich.

## 4. Layout

Unverändert von PSYber: Container höchstens 1440 px, Seitenrand 20–52 px, Sektionen 72–152 px
vertikal, Inhalte links ausgerichtet (zentriert nur «Haltung»), Radien Karten 22 px, Panels 30 px,
Bühnen bis 44 px, Bogen bis 40 px, Eingabefelder 14 px, Buttons und Tags als Pille. Mobile first
von 320 bis 1920 px, nie horizontales Scrollen. Nichts ragt über den Bildrand, kein Wort bricht
mitten im Wort um; die Tests messen das (`cutOff`, `brokenWords` in `e2e/helpers.ts`, fünf Seiten,
acht Breiten). E-Mail-Adressen dürfen nur am «@» umbrechen (`<wbr>`).

## 5. Bausteine

- **Buttons** (`.btn`): Pille, 52 px hoch (klein 44 px). Primär in Lüscher-Grün mit dunkler Schrift
  und weichem grünem Schein; sekundär als Glas-Outline mit grüner Lichtkante oben.
  `.btn-text` als Textlink mit Pfeil.
- **Karten** (`.card`): 1 px Rahmen, kein Schlagschatten, dezenter grüner Verlauf. Hover nur bei
  feinem Pointer.
- **Tags** (`.tag`): Pille in Versalien; `tag-solid` (Grün) für «Neu», `tag-amber` für Entwürfe.
- **Formularfelder**: 52 px hoch, Radius 14 px, Rahmen 3,6:1; Fehler mit Icon und Text.
- **Header**: oben volle Leiste (Logo, Navigation, CTA), nach dem Scrollen eine schwebende Kapsel
  (Logo, Anrufen, CTA, Menü-Knopf). Der runde Telefon-Knopf ist eine Ergänzung für die Zielgruppe.
  Vollbild-Menü mit nummerierten Punkten, Kontakt und Öffnungszeiten.
- **Schwebende Bedienelemente** (`Chrome.astro`): Fortschritt (Balken mobil, Schiene ab 1280 px),
  Cookie-Knopf (erklärt, warum es keinen Banner gibt), «Bewegung pausieren» (nur wo sich etwas
  dauerhaft bewegt: das Band auf der Startseite).
- **Öffnungsstatus**: «Geöffnet bis 18:30» bzw. «Geschlossen · öffnet morgen 10:00», in der Zeitzone
  von Baden, jede Minute neu. Ohne JavaScript steht nur die Tabelle.
- **Fokus-Ring**: 3 px dunkles Grün mit 3 px Abstand, auf der dunklen Bühne Lüscher-Grün.

## 6. Motion

Tokens und Regeln wie bei PSYber (150 / 250 / 400 / 800 ms, `cubic-bezier(.2,.7,.2,1)`, GSAP
`power3.out`, Lenis mit lerp 0.1). Bewegte Momente:

1. Hero: Headline fährt zeilenweise hinter einer Maske ein; die runde Bühne blendet auf. Auf
   grossen Bildschirmen bleibt der Hero kurz stehen, die erste Zeile tritt zurück, das Bild rückt
   etwas näher.
2. Header: Wechsel zwischen Leiste und Kapsel.
3. Überschriften der Sektionen fahren einmal zeilenweise ein; Kicker gleiten von links herein.
4. Band mit Sortiment und Service als Endlosband (pausiert bei Hover, Fokus und über den Knopf).
5. «Haltung»: Wörter werden beim Scrollen dunkel.
6. «Service»: Überschrift bleibt am Desktop stehen, die Schritte ziehen vorbei.
7. «Über uns»: Der Sucher stellt das Porträt scharf, eine grüne Linie tastet es einmal ab, die
   Werte erscheinen nacheinander.
8. Karten und Bilder: feiner Zoom bei Hover (nur feiner Pointer).
9. Cookie-Hinweis wächst aus seinem Knopf. Seitenwechsel blenden kurz über (View Transitions).

Bei `prefers-reduced-motion` steht alles sofort im Endzustand: kein Lenis, kein Pinning, keine
Auftritte, das Band bricht um. Der Schalter «Bewegung pausieren» hält Dauerbewegung an.

## 7. Technische Regeln fürs Markup

Unverändert von PSYber (siehe auch `CLAUDE.md`): keine Inline-Styles und -Skripte (strikte CSP
mit Hashes), interne Links über `href()` (Basis-Pfad der Pages-Vorschau), Satzzeichen nach Links
auf derselben Zeile mit `{/* prettier-ignore */}`, Formulare immer `method="post"`, Overlays mit
eigenem Scrollen tragen `data-lenis-prevent`, Klassennamen in Scoped Styles nie wie ein Baustein
aus `components.css` (`pnpm test` prüft das), Bilder mit `width`, `height` und `alt`.
Sektionen weit unter dem ersten Bildschirm tragen `data-lazy`; vor jedem Sprung zu einer Marke
legt `home.ts` sie aus und vermisst Lenis neu (sonst endete der Sprung an einer alten Grenze).

## 8. Suchmaschinen

Wie bei PSYber: Titel «Thema – Lüscher Wohnen», Canonical nur auf Seiten im Index, `noindex`
nie zusätzlich in der robots.txt, strukturierte Daten aus der Konfiguration (Organisation,
`FurnitureStore` mit Adresse und Öffnungszeiten, Website, Seite, Pfad). Keine Bewertungen, keine
Preise. Die Vorschau auf GitHub Pages ist vollständig `noindex`, ihre robots.txt sperrt alles.

## 9. Keine Zählung

Anders als bei PSYber gibt es keine Reichweitenzählung: Das Briefing schliesst Analytics und
Tracking aus. Keine Cookies, kein Web-Speicher, keine Requests an Dritte.
