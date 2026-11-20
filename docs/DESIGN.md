# Designsystem Lüscher Wohnen

Stand: November 2026. Aufbau, Formatierung, Schrift, Bausteine und Bewegung folgen auf Wunsch
des Repository-Inhabers dem Designsystem von PSYber (`valITino/PsySec`, Commit `d521f90`):
riesige Überschriften in Versalien, Pillen, Bühnen und Bogen mit grossen Radien, eine Kapsel als
Header, schwebende Bedienelemente am Rand. Die Farben sind auf Entscheid vom 20.11.2026 **hell und
warm** statt fast schwarz (Briefing: «hell und freundlich», «seriös, minimalistisch,
warm/persönlich», Grün für Buttons). Die Cyber-Motive von PSYber (Hex-Nummern, Terminal, Eule,
Globus) sind durch wohnliche Pendants ersetzt. Die Bewegung ist seit dem 20.11.2026 ein eigenes,
ruhigeres System (Abschnitt 6).

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

Stand nach der Überarbeitung vom 20.11.2026 und den vier Prüfungen danach (Entscheide 37 und 38).
Bewegung soll ruhig und präzise wirken und eine Zielgruppe ab 40 nie beim Lesen aufhalten.

### Grundsätze

1. **Ankommen statt vorführen.** Alles bremst weich in seine Lage: Auftritte mit Expo- oder
   Quint-Kurve. Ausgänge sind kurz; was auf eine Eingabe antwortet (Header, Menü schliessen,
   Seitenwechsel), bremst ebenfalls, damit schon das erste Bild reagiert. Kein Überschwingen,
   kein Federn, keine Drehung, keine Unschärfe.
2. **Eine Sprache.** Text steigt aus einer Maske, Bilder öffnen sich durch einen Clip, Flächen
   falten sich auf. Bewegt werden nur `transform` (auch `translate` und `scale`), `opacity` und
   `clip-path`. Farbwechsel bis 250 ms bei Hover und Fokus sind erlaubt.
3. **Lesen geht vor.** Nach spätestens 400 ms ist alles lesbar, der Rest (bis 1,2 s) ist nur
   Ausklang. Fliesstext blendet nie ein.
4. **Zwei Signaturen, sonst Ruhe.** Der Auftakt im Hero und der Menü-Vorhang zeigen sich; alles
   andere ist Präzision: dieselben Kurven, gestaffelt und jederzeit unterbrechbar.
5. **Im Zweifel sichtbar.** Ohne JavaScript ist alles sichtbar, verborgen ist nur, was ein Skript
   selbst gesetzt hat. Bei reduzierter Bewegung bewegt sich nichts und nichts wartet. Mit dem
   Schalter «Bewegung pausieren» steht die Dauerbewegung, wartende Auftritte stehen sofort am
   Ende. Ein Sprung zu einer Marke landet immer auf fertigem Inhalt.

### Tokens

Eine Quelle je Laufzeit: `packages/ui/src/styles/tokens.css` für CSS,
`packages/ui/src/motion/tokens.ts` (`EASE`, `DUR`, `STAGGER`) für GSAP und Timer.
`packages/ui/test/motion-tokens.test.ts` hält beide gleich und misst jede GSAP-Kurve an ihrer
CSS-Kurve (Abweichung höchstens 0,012).

| Token                         | Wert                             | GSAP           | Verwendung                                  |
| ----------------------------- | -------------------------------- | -------------- | ------------------------------------------- |
| `--ease-out` (Alias `--ease`) | `cubic-bezier(0.22, 1, 0.36, 1)` | `power4.out`   | Standard: Bedienelemente, Folgeelemente     |
| `--ease-expo`                 | `cubic-bezier(0.16, 1, 0.3, 1)`  | `expo.out`     | lange Landungen: Zeilen, Bilder, Signaturen |
| `--ease-in-out`               | `cubic-bezier(0.65, 0, 0.35, 1)` | `power2.inOut` | Flächen, die auf- und wieder zufahren       |
| `--ease-in`                   | `cubic-bezier(0.32, 0, 0.67, 0)` | `power2.in`    | Reserve; zurzeit nicht verwendet            |

| Token             | Wert    | Verwendung                                       |
| ----------------- | ------- | ------------------------------------------------ |
| `--dur-1`         | 150 ms  | Mikro: Farbe; Ausgänge (Header, alte Seite)      |
| `--dur-2`         | 250 ms  | Zustand von Bedienelementen                      |
| `--dur-3`         | 400 ms  | Flächen: Kapsel, Menü schliessen, Header-Wechsel |
| `--dur-4`         | 800 ms  | Auftritte: Zeilen, Kicker, Bild-Enthüllung       |
| `--dur-5`         | 1200 ms | Signatur: Hero-Blende                            |
| `--stagger`       | 70 ms   | Versatz in einer Folge                           |
| `--stagger-tight` | 45 ms   | dichte Folge, z. B. Menüpunkte                   |

Begründete Einzelwerte stehen mit Kommentar im Code: Zeilen im Hero 1000 ms
(`calc(var(--dur-4) + 200ms)`), Folgeelemente im Hero 560 ms, Menü öffnen und Kontaktblock im
Menü 560 ms, Glasfläche der Kapsel 360 ms, neue Seite beim Seitenwechsel 480 ms, Hover-Zoom der
Fotos 700 ms.

### Bewegte Momente

Die beiden Signaturen:

1. **Auftakt im Hero** (reines CSS, spielt auch ohne Skript): Das runde Foto öffnet sich wie eine
   Blende (`clip-path` von 30 % auf den vollen Kreis, Zoom von 1.1 auf 1, `--dur-5`,
   `--ease-out`) und ist ab dem ersten Bild sichtbar. Die Zeilen der Headline steigen dicht
   nacheinander aus ihrer Maske. Während sie noch gleiten, setzen sich Lead (ab 200 ms, nur
   `transform`, vom ersten Bild an lesbar), Buttons (260 ms) und Anzeige (320 ms); nach 1,2 s
   ruht alles. Auf grossen Bildschirmen bleibt der Hero beim Scrollen kurz stehen, die erste
   Zeile tritt zurück, das Bild rückt etwas näher.
2. **Menü-Vorhang**: Das Menü rollt vom Header nach unten aus (560 ms, `--ease-expo`), die grossen
   Wörter steigen schon ab 70 ms im Abstand `--stagger-tight` aus ihrer Maske, die Pfeile folgen
   je 40 ms später, der Kontaktblock setzt sich ab 200 ms. Beim Schliessen fährt der Vorhang in
   `--dur-3` mit `--ease-out` zurück (bewegt sich ab dem ersten Bild) und trägt alles allein;
   das angetippte Wort färbt sich sofort.

Alles andere ist leise:

1. **Leiste und Kapsel**: Die Teile tauchen kurz ab (`--dur-1`, `--ease-out`), die Form wechselt,
   die Glasfläche faltet sich aus der Mitte auf (`clip-path` von 10 % Rand, 360 ms), der Schatten
   blendet 60 ms später als eigene Ebene ein, die Teile kommen sofort gestaffelt zurück
   (`--dur-3`). Nach gut einer halben Sekunde ruht alles. Was den Tastaturfokus trägt, taucht
   nicht ab. Bei einem Sprung (Direktlink, wiederhergestellte Position) steht die Form sofort.
2. **Überschriften**: Der Kicker zeichnet sich ein (`clip-path`, `--dur-4`), 60 ms später steigen
   die Zeilen aus ihrer Maske (GSAP SplitText, `--dur-4`, `expo.out`, `--stagger`). Danach ist
   das Markup wieder wie zuvor.
3. **Bild-Enthüllung** (`.enter-unveil`: Sortiment, Aktuell, Projekte, Porträt): Das Foto öffnet
   sich vom unteren Rand (`clip-path`, `--dur-4`, `--ease-expo`); mit Maus setzt es sich dabei
   aus einem leichten Zoom, auf Touch-Geräten nicht (dort kostete der Zoom beim Wischen gemessen
   Bilder). Bilder, die zusammen ankommen, folgen einander im Abstand `--stagger` (höchstens drei
   Versätze).
4. **Über uns**: Die Ecken des Suchers rücken weich an ihren Platz (`--dur-4`, `--ease-expo`),
   eine grüne Linie tastet das Bild einmal ab (nur `transform`, `--dur-4`), die Werte erscheinen
   im Abstand `--stagger`.
5. **Haltung**: Die Wörter werden beim Scrollen dunkel, jedes mit weichem Ein- und Auslauf.
6. **Service**: Die Überschrift bleibt am Desktop stehen, die Schritte ziehen vorbei.
7. **Band**: Sortiment und Service als Endlosband (pausiert bei Hover, Fokus und über den Knopf).
8. **Seitenwechsel** (View Transitions zwischen Dokumenten, reines CSS): Der Header steht still,
   weil die Leiste oben als eigene Ebene `site-bar` übergeben wird. Die Kapsel trägt diesen Namen
   nie: Sonst zöge der Browser sie auf die Grösse der Leiste (verzerrt), und ihr Milchglas bliebe
   klar (ein benanntes Element begrenzt die Unschärfe seiner Kinder). Verlässt man die Seite aus
   der Kapsel, geht sie mit der alten Seite. Die alte Seite weicht schnell (`--dur-1`,
   `--ease-out`), die neue setzt sich 80 ms später von leicht unten (480 ms, `--ease-expo`); so
   liegen die beiden kaum übereinander.
9. **Kleinigkeiten**: Der Hover-Schein der Buttons liegt auf einer eigenen Ebene (`::after`) und
   blendet nur über; die Lichtkante des sekundären Buttons wächst aus der Mitte (`scaleX`,
   `--dur-3`). Fotos zoomen bei Hover fein (nur feiner Pointer). Der Cookie-Hinweis wächst aus
   seinem Knopf ohne Überschwingen, die «404» rückt einmal von leicht unten an ihren Platz.

### Regeln

- **Nur `transform`, `opacity` und `clip-path` animieren.** Nie Lage, Grösse oder Abstände
  (`top`, `left`, `width`, `height`, `margin`, `padding`), nie `box-shadow`, `filter` oder
  `background-position`. Ein Schatten, der sich ändern soll, liegt auf einer eigenen Ebene und
  blendet über `opacity`. Der Wächter `scripts/motion-guard.test.ts` (Teil von `pnpm test`)
  prüft alle Stylesheets und Astro-Komponenten.
- **Kurven nur aus `tokens.css`**, keine mit einem y-Wert unter 0 oder über 1; keine
  Keyframe-Animation dreht etwas. Auch das prüft der Wächter.
- **Dauern und Versätze aus den Tokens.** Ein Einzelwert braucht einen Kommentar mit Grund.
- **Alles endet**: Jeder Auftritt beim Scrollen ist spätestens nach 1200 ms plus drei Versätzen
  fertig, der Hero ruht nach 1,5 s (beides prüft `e2e/web.spec.ts`).
- **Das grösste Element zuerst**: Foto und Lead im Hero sind ab dem ersten Bild sichtbar (LCP,
  geprüft in `e2e/web.spec.ts`).
- **Reduzierte Bewegung**: `base.css` kürzt jede Animation auf 0.01 ms und jeden Übergang auf 0.
  Kein Lenis, kein Anpinnen, keine Auftritte, kein Seitenübergang, das Band bricht um.
- **Pause** (`html[data-motion="off"]`): `base.css` hält jede Animation an; `reveal.ts` löst alle
  wartenden und erfolgten Auftritte auf (`data-enter=""`), `hero.ts` beendet den Auftakt
  (`data-rested`), Komponenten setzen ihre laufenden Auftritte ans Ende (Rückfall in CSS). Nach
  dem Fortsetzen spielt nichts ein zweites Mal (geprüft in `e2e/web.spec.ts`).
- **Ohne JavaScript** gibt es keinen Wartezustand; CSS-Auftritte (Hero, 404) enden sichtbar.
- **Sprünge** (`data-jump` am `<html>`, `home.ts`): Was unterwegs oder am Ziel ins Bild kommt,
  steht sofort da.
- **CSP**: keine `style`-Attribute im Markup; Skripte dürfen `element.style` und eigene
  Custom Properties setzen (z. B. `--enter-i`).
- **Keine weitere Bibliothek**: GSAP mit SplitText und Lenis (lerp 0.1) genügen.

Bewusst nicht: Auftritte aus der Unschärfe, Parallax, Fliesstext, der beim Scrollen einblendet,
gescrubbte Galerien, eigener Mauszeiger, magnetische oder kippende Elemente, Zähler.

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
