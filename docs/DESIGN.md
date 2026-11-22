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
  Cookie-Knopf (erklärt, warum es keinen Banner gibt), «Bewegung pausieren» (auf der
  Startseite: stellt ab, was beim Scrollen mitzieht, und das sanfte Scrollen).
- **Öffnungsstatus**: «Geöffnet bis 18:30» bzw. «Geschlossen · öffnet morgen 10:00», in der Zeitzone
  von Baden, jede Minute neu. Ohne JavaScript stehen nur die Öffnungszeiten als Liste (im Kontakt).
- **Fokus-Ring**: 3 px dunkles Grün mit 3 px Abstand, auf der dunklen Bühne Lüscher-Grün.
- **Eins wählen, eins sehen** (`choice.ts`): eine Liste mit Kopf und Tafel je Eintrag wird zum
  Index mit einer Bühne (Muster «Accordion» der APG, eine Tafel offen, «Weiter» auf der Bühne,
  Pfeiltasten, Direktlink über die Marke des Eintrags). Ohne Skript bleibt es eine Liste, alle
  Texte und Bilder stehen im HTML. Genutzt im Sortiment («Raum für Raum», Index links, Foto mit
  Text rechts; mit feinem Zeiger zeigt schon kurzes Verweilen den Raum; am Handy steht die Bühne
  über dem Index und kommt nach einer Wahl ins Bild). Gewechselt wird nur durch eine Wahl, nie
  durch Scrollen: Die Räume haben keine Reihenfolge. Die alte Tafel bleibt stehen, bis alle
  Auftritte der neuen zu Ende sind (das neue Foto deckt das alte ganz); die Tafeln liegen in
  einem eigenen Stapel (`isolation: isolate`), «Weiter» immer darüber. «Weiter» behält den Fokus
  und meldet Screenreadern leise, was jetzt zu sehen ist («Polstermöbel, 2 von 7»,
  `role="status"`).
- **Jahr für Jahr** (`years.ts`, Firmengeschichte): im HTML eine Zeitleiste mit sechs Momenten.
  Mit Bewegung wird sie zur Bühne, auf der die Jahre mit dem Scrollen weitergehen: eine Achse
  mit sechs Knöpfen (das aktuelle Jahr trägt `aria-current="step"`), darunter Karten aus Papier
  mit grosser Jahreszahl, Foto und Satz, darunter «Weiter». Die Knöpfe scrollen an die Stelle
  ihres Jahrs und melden es leise («1983, 4 von 6»); Pfeile, Pos1 und Ende wandern auf der
  Achse. Zu sehen und für Screenreader vorhanden ist jeweils die Karte, die gilt. Einzelheiten
  in Abschnitt 6.
- **Mehr lesen** (`.more`, natives `<details>`): Was nicht jeder lesen muss, steht hinter einer
  leisen Zeile mit Plus, das zum Minus wird. Der Text steht im HTML (für Suchmaschinen
  gleichwertig) und klappt beim Öffnen von oben auf, ohne Einblenden.
- **Unser Team** (Über uns): runde Fotos mit Name und Aufgabe; wo es noch kein Foto gibt, die
  Initialen auf Salbei statt eines Platzhalterbildes. Beim Hereinscrollen rücken die Personen
  eine nach der anderen nach, die Fotos setzen sich im Kreis aus einem leichten Zoom.
- **Besuchszeile** (unter dem Hero): Live-Status, Adresse, «Route planen» und der Weg zu
  Öffnungszeiten und Termin in einer Zeile zwischen Haarlinien.

### Text und Rhythmus

- **Jede Angabe einmal.** Adresse, Telefon, Öffnungszeiten und Kontaktwege stehen vollständig im
  Kontakt (und im Footer); oben nur, was man für den Besuch zuerst braucht.
- **Ein Gedanke je Bildschirm.** Grosse Wörter, ein Satz, ein Bild; was vertieft, steht hinter
  «Mehr lesen». Gekürzt wird nur Belegtes, nie erfunden; Kürzungen in `docs/DECISIONS.md`.
- **Nummern wie im Menü.** Nummeriert sind nur die Ziele des Menüs (01 Sortiment bis 05
  Kontakt); Zwischenspiele (Haltung, das Band, Projekte in der Vorschau) tragen keine Nummer.

## 6. Motion

Stand nach dem Umbau vom 21.11.2026 (Entscheid 49) und der Abstimmung für kleine Bildschirme
vom 22.11.2026 (Entscheid 50): Was beim Scrollen geschieht, hängt an der Scrollposition. Davor
liefen Auftritte nach Zeit (Entscheide 37 bis 44); beim Scrollen in normalem Tempo standen
Überschriften und Fotos dann mitten im Bild noch halb fertig da.
Bewegung soll ruhig und präzise wirken und eine Zielgruppe ab 40 nie beim Lesen aufhalten.

### Grundsätze

1. **Der Mensch bewegt, die Seite antwortet.** Was beim Scrollen ins Bild kommt, hängt an der
   Scrollposition (CSS `animation-timeline`), nie an einem Zeitgeber. Wer schnell scrollt, sieht
   die Bewegung schnell, wer anhält, hält sie an, zurück läuft sie rückwärts. Nichts wartet,
   nichts läuft nach. Der Zustand der Seite ist allein eine Frage der Stelle, an der sie steht:
   Ein Sprung zu einer Marke landet darum immer auf fertigem Inhalt.
2. **Jede Bewegung hat einen Grund.** Der nächste Bogen schiebt sich über den vorherigen (so ist
   die Seite gebaut). Der Weg im Service zeichnet sich, während man ihn liest. Der Sucher stellt
   auf das Porträt scharf. Die Blende vom Anfang schliesst sich am Ende. Was keinen Grund hat,
   bewegt sich nicht.
3. **Lesen geht vor.** Alles kommt von unten und setzt sich im unteren Teil des Fensters.
   Oberhalb von 70 % der Fensterhöhe (von oben gezählt) steht jeder Text still: die Lesezone.
   Nur grosse Fotos gleiten in ihrem Rahmen leise weiter; so bewegt sich immer etwas mit dem
   Finger, auch am Handy, wo ein Block oft das ganze Fenster füllt. Text blendet nie ein, er
   rückt nur nach oder steigt aus seiner Maske. Foto und Lead im Hero stehen ab dem ersten Bild.
4. **Eine Sprache.** Text steigt aus einer Maske, Fotos setzen sich aus einem leichten Zoom,
   Flächen schieben sich übereinander: Bogen über Bogen auf der Seite, Karte über Karte in der
   Firmengeschichte. Bewegt werden nur `transform` (auch `translate` und `scale`), `opacity` und
   `clip-path`. Farbwechsel bis 250 ms bei Hover und Fokus sind erlaubt. Kein Überschwingen,
   kein Federn, keine Drehung, keine Unschärfe.
5. **Nach Zeit läuft nur, was eine Antwort auf eine Handlung ist:** der Auftakt beim Laden, das
   Menü, der Formwechsel des Headers, der Seitenwechsel, eine Wahl («Raum für Raum»), das
   Aufklappen von «Mehr lesen». Das bremst weich in seine Lage und antwortet im ersten Bild.
6. **Im Zweifel steht alles.** Der normale Stil ist der Endzustand. Ohne Unterstützung im
   Browser, bei reduzierter Bewegung, im Druck und mit dem Schalter «Bewegung pausieren» gilt er
   allein. Ohne JavaScript läuft die Bewegung beim Scrollen trotzdem: Sie ist reines CSS.

### Tokens

Eine Quelle je Laufzeit: `packages/ui/src/styles/tokens.css` für CSS,
`packages/ui/src/motion/tokens.ts` (`EASE`, `DUR`, `STAGGER`) für Zeitgeber in Skripten.
`packages/ui/test/motion-tokens.test.ts` hält beide gleich.

| Token                         | Wert                             | Verwendung                                        |
| ----------------------------- | -------------------------------- | ------------------------------------------------- |
| `--ease-out` (Alias `--ease`) | `cubic-bezier(0.22, 1, 0.36, 1)` | Standard: Bedienelemente, Auftritte beim Scrollen |
| `--ease-expo`                 | `cubic-bezier(0.16, 1, 0.3, 1)`  | lange Landungen: Zeilen, Bilder, Signaturen       |
| `--ease-in-out`               | `cubic-bezier(0.65, 0, 0.35, 1)` | Flächen, die auf- und wieder zufahren             |
| `--ease-in`                   | `cubic-bezier(0.32, 0, 0.67, 0)` | Reserve; zurzeit nicht verwendet                  |
| `--scrub`                     | `linear`                         | nur für Bewegung, die an der Scrollposition hängt |

| Token             | Wert    | Verwendung                                       |
| ----------------- | ------- | ------------------------------------------------ |
| `--dur-1`         | 150 ms  | Mikro: Farbe; Ausgänge (Header, alte Seite)      |
| `--dur-2`         | 250 ms  | Zustand; Leiste beim Seitenwechsel               |
| `--dur-3`         | 400 ms  | Flächen: Kapsel, Menü schliessen, Header-Wechsel |
| `--dur-4`         | 800 ms  | Wechsel einer Bühne: Foto, Jahreszahl            |
| `--dur-5`         | 1200 ms | Signatur: Hero-Blende                            |
| `--stagger`       | 70 ms   | Versatz in einer Folge                           |
| `--stagger-tight` | 45 ms   | dichte Folge, z. B. Menüpunkte                   |

Begründete Einzelwerte stehen mit Kommentar im Code: Zeilen im Hero 1000 ms
(`calc(var(--dur-4) + 200ms)`), Folgeelemente im Hero 560 ms, Menü öffnen und Kontaktblock im
Menü 560 ms, Glasfläche der Kapsel 360 ms, neue Seite beim Seitenwechsel 480 ms (40 ms später),
Hover-Zoom der Fotos 700 ms.

### Mit dem Scrollen

Die Bausteine stehen in `packages/ui/src/styles/scroll.css`, die Choreografie der Abschnitte in
`apps/web/src/styles/scroll.css`. Strecken zählen ab der unteren Fensterkante in Anteilen der
Fensterhöhe, nicht in Anteilen des Elements: So setzt sich jeder Block gleich weit über der
Kante, wie hoch er auch ist.

1. **Bogen über Bogen**: Sobald der nächste Bogen unten ins Bild kommt, bleibt der aktuelle
   zurück (er zieht etwas langsamer weiter, `translate`), und der nächste schiebt sich mit
   seinen runden Ecken darüber. Die Strecke ist immer eine Fensterhöhe, wie hoch der Bogen auch
   ist. Wie weit er zurückbleibt, hängt am freien Platz unter seinem Inhalt, nicht an der
   Fensterhöhe: das 1,5-Fache von `--section-y` plus `--r-sheet` (`--sc-leave`; gemessen am
   Handy 390×844 144 px, am Desktop 1440×900 269 px). So erreicht der nächste Bogen den letzten
   Inhalt auf jedem Gerät erst um die Fenstermitte (gemessen 42 bis 53 % der Höhe); als fester
   Anteil der Fensterhöhe war er am Handy schon bei 77 % verdeckt. Der Hero ist der erste Bogen: Er hält
   das Scrollen nicht an (früher stand er am Desktop 675 px lang still) und bleibt schmal etwas
   weniger weit zurück, weil unter seinem letzten Link weniger Platz ist. Das schmale Band zieht
   ganz durch, der letzte Bogen (Kontakt) läuft normal in den Footer.
2. **Auftritt** (`.sc-rise`): Ein Block kommt etwas tiefer ins Bild (32 bis 60 px je nach
   Bildschirm) und holt auf den ersten 30 % der Fensterhöhe auf. Die Kurve bremst: Der grösste
   Teil des Wegs liegt gleich an der Kante. Geschwister nebeneinander (Karten, Personen, Spalten
   im Footer) sind versetzt (`--sc-i`). Wo ein Block höher ist als das halbe Fenster, rückt auch
   sein Inhalt Stück für Stück nach (Karten in «Aktuell», Zeilen im Kontakt): Am Handy baut er
   sich so unter dem Finger auf, statt als fertiger Block hereinzufahren.
3. **Überschriften** (`Words.astro`, `.sc-w`): Jedes Wort steht in einer eigenen Maske und
   steigt auf den ersten 24 % der Fensterhöhe heraus. Wörter einer Zeile kommen gemeinsam ins
   Bild und steigen darum gemeinsam: Zeile für Zeile, ohne dass ein Skript die Zeilen kennen
   muss. Für Screenreader sind die Wörter stumm, die Überschrift trägt den Text als
   `aria-label` (ohne weiche Trennstriche).
4. **Fotos**: vom ersten Pixel an ganz zu sehen (weder durchsichtig noch beschnitten, darum
   lädt der Browser sie rechtzeitig vor). Grosse Fotos (`.sc-drift`: Sortiment, Aktuell,
   Projekte, Porträt) setzen sich gleichmässig aus einem Zoom von 1.16 auf 1.04 und gleiten
   dabei etwas langsamer als ihr Rahmen durchs Bild (in ihm von 4 % oben nach 2 % unten), über
   den ganzen Weg von der unteren bis zur oberen Fensterkante. Der Zoom reicht in jeder Lage für
   die Verschiebung: Der Rahmen zeigt nie seinen Grund (ein e2e-Test misst es). Der Rahmen fasst
   allein das Foto und schneidet ab. Kleine Bilder (`.sc-zoom`: Porträts im Kreis, Initialen)
   setzen sich über 60 % der Fensterhöhe aus dem Zoom von 1.16 und stehen dann still.
5. **Hero**: Während er zurückbleibt, rückt das runde Foto näher (`scale` bis 1.1) und gleitet
   etwas langsamer als der Hero (7 % seiner Höhe): Es liegt tiefer als der Text, es geht in die
   Räume.
6. **Band**: Die Wörter aus Sortiment und Service als zwei Reihen grosser Schrift. Sie laufen
   nicht von selbst: Die obere zieht mit dem Scrollen nach links, die untere nach rechts. Darum
   braucht das Band keinen Knopf zum Anhalten. Ohne Bewegung ist es eine ruhige, umbrechende
   Liste.
7. **Haltung**: Die drei Sätze werden Wort für Wort dunkel (Deckkraft 0,2 bis 1), im Takt des
   Scrollens; in der Fenstermitte steht der Satz ganz da. Die Wörter stehen als `<span>` im
   Markup, der Satz bleibt ein Absatz.
8. **Service**: Die Überschrift bleibt am Desktop stehen. Eine grüne Linie wächst mit dem
   Scrollen von der Beratung bis «Danach»; ihre Spitze bleibt auf 58 % der Fensterhöhe, wo man
   liest. Jeder Punkt wird grün, wenn die Spitze ihn erreicht.
9. **Über uns**: Der Sucher stellt scharf. Die vier Ecken rücken an ihren Platz, während das
   Porträt sich setzt. Die Personen im Team rücken eine nach der anderen nach.
10. **Firmengeschichte** (`years.ts`, Entscheid 50): Die Jahre gehen mit dem Scrollen weiter,
    ohne Klick. Die Bühne (Titel, Achse, Karte, «Weiter») bleibt unter dem Header stehen,
    solange die sechs Jahre durchlaufen; sie ist so hoch wie das Fenster darunter. Mit jedem
    Stück Weg wächst die grüne Linie der Achse, und die Karte des nächsten Jahrs schiebt sich
    von unten über die des vorherigen, die etwas kleiner wird und den Ton des Bogens annimmt.
    Je Jahr 42 % der Fensterhöhe (höchstens 24rem): das erste Viertel ruht die Karte, dann
    steigt die nächste; die Linie erreicht jeden Punkt genau dann, wenn seine Karte ankommt.
    Nach «Heute» ruht die Bühne einen halben Schritt und gibt die Seite frei; erst danach
    bleibt der Bogen zurück. Die Knöpfe der Achse und «Weiter» scrollen an die Stelle ihres
    Jahrs: Der Zustand hängt immer an der Scrollposition. Drei Stufen:
    - **Zeitleiste** (Grundform im HTML): alle sechs Momente untereinander, am Desktop drei
      nebeneinander. Ohne Skript, bei reduzierter Bewegung, in Fenstern unter 36rem Höhe (Handy
      quer), im Druck, und wenn die Bühne nicht in ihr Fenster passt (das Skript misst es).
    - **In Schritten**: Die Bühne steht, die Karten wechseln nach der Scrollposition mit einem
      kurzen Übergang (`--dur-3`). Ohne scrollgekoppelte Animationen (Firefox, Safari vor 26)
      und, ohne Übergang, bei angehaltener Bewegung.
    - **Geführt**: Karte, Linie und die zurücktretende Karte hängen am Finger (reines CSS).
11. **Der Kreis schliesst sich**: Kommt der Kontakt ins Bild, öffnet sich oben rechts die grüne
    Scheibe (ab 64rem), wie die Blende des Fotos ganz oben. Die Kontaktwege rücken Zeile für
    Zeile nach. Am Ende der Seite steigt die Wortmarke im Footer mit den letzten Schritten aus
    ihrer Maske.

### Nach Zeit

Die beiden Signaturen:

1. **Auftakt im Hero** (reines CSS, spielt auch ohne Skript): Das runde Foto öffnet sich wie eine
   Blende (`clip-path` von 30 % auf den vollen Kreis, Zoom von 1.1 auf 1, `--dur-5`,
   `--ease-out`) und ist ab dem ersten Bild sichtbar. Die Zeilen der Headline steigen dicht
   nacheinander aus ihrer Maske. Während sie noch gleiten, setzen sich Lead (ab 200 ms, nur
   `transform` um 4 px, vom ersten Bild an lesbar), Buttons (260 ms) und Anzeige (320 ms); nach
   1,2 s ruht alles.
2. **Menü-Vorhang**: Das Menü rollt vom Header nach unten aus (560 ms, `--ease-expo`), die grossen
   Wörter steigen schon ab 70 ms im Abstand `--stagger-tight` aus ihrer Maske, die Pfeile folgen
   je 40 ms später, der Kontaktblock setzt sich ab 200 ms. Beim Schliessen fährt der Vorhang in
   `--dur-3` mit `--ease-out` zurück (bewegt sich ab dem ersten Bild) und trägt alles allein;
   das angetippte Wort färbt sich sofort.

Alles andere ist leise:

1. **Leiste und Kapsel**: Die Teile tauchen kurz ab (`--dur-1`; Deckkraft gleichmässig, damit der
   Header erst im letzten Moment leer ist, Bewegung `--ease-out`), die Form wechselt,
   die Glasfläche faltet sich aus der Mitte auf (`clip-path` von 10 % Rand, 360 ms), der Schatten
   blendet 60 ms später als eigene Ebene ein, die Teile kommen sofort gestaffelt zurück
   (`--dur-3`). Nach gut einer halben Sekunde ruht alles. Was den Tastaturfokus trägt, taucht
   nicht ab, auch ein Link der Navigation. Gibt es das Element in der neuen Form nicht, übernimmt
   ein sichtbares Gegenstück den Fokus und steht sofort ganz da: für den Menü-Knopf die
   Navigation, sonst das nächste Bedienelement der Leiste (Tab führt so in der gewohnten
   Reihenfolge weiter). Ist beim Umkehren nichts zu sehen, wechselt die Form sofort. Bei einem Sprung
   (Direktlink, wiederhergestellte Position) und bei angehaltener Bewegung steht die Form sofort,
   samt Glasfläche. Mit Tastaturfokus stehen nur Deckkraft und Lage sofort; die Farben beim Hover
   gleiten weiter.
2. **Seitenwechsel** (View Transitions zwischen Dokumenten, reines CSS): Der Header steht still,
   weil die Leiste oben als eigene Ebene `site-bar` übergeben wird. Die Kapsel trägt diesen Namen
   nie: Sonst zöge der Browser sie auf die Grösse der Leiste (verzerrt), und ihr Milchglas bliebe
   klar (ein benanntes Element begrenzt die Unschärfe seiner Kinder). Verlässt man die Seite aus
   der Kapsel, zu einer Marke (`/#kontakt`), durch den Verlauf oder ohne Navigation API (Ziel
   unbekannt), geht der Header mit der alten Seite (`header.ts`, `is-leaving`), und der neue
   blendet für sich ein (`--dur-2`). Die neue Seite stellt ihre Form in `pagereveal` ein: Beginnt
   sie unten, kommt die Kapsel mit der Seite, statt dass oben kurz die Leiste erscheint; kam auch
   die alte Seite als Kapsel, trägt die Kapsel für den Wechsel einen eigenen Namen
   (`site-capsule`, `is-handing`), und die beiden bleiben als Paar stehen. Dafür läuft das Skript
   jeder Seite vor ihrem ersten Bild (siehe Regeln); vorher zeigte der Browser die neue Seite oft
   erst oben und sprang dann zur Marke. Zurück und vor (und ohne Navigation API) zu einer Seite,
   die oben beginnt, setzt sie den Übergangstyp `stand`: Ihre Leiste steht sofort, die alte
   weicht darunter (überblendet würde der Header einige Bilder lang grau). Stehen beide oben, werden alte und neue Leiste nicht
   überblendet: Die neue steht vom ersten Bild an (eine Überblendung gleicher Bilder kann im
   ersten Bild aus dem Takt geraten, dann wird die Leiste für ein Bild grau). Die alte Seite weicht schnell (`--dur-1`,
   `--ease-out`), die neue setzt sich 40 ms später von leicht unten (480 ms, `--ease-expo`); so
   liegen die beiden kaum übereinander.
3. **Eins wählen, eins sehen**: Im Sortiment steigt beim Wechsel das neue Foto vom unteren Rand
   seines Rahmens über das alte (`unveil`, `clip-path` und Zoom am Bild, `--dur-4`,
   `--ease-expo`), das alte bleibt stehen, bis es gedeckt ist; der Text ist sofort lesbar und
   rückt nur 4 px nach (`--dur-3`). Der gewählte Name wird dunkel und rückt 6 px ein. Bei
   reduzierter oder angehaltener Bewegung wechselt alles sofort. Am Handy steht die Bühne über
   dem Index: Ist sie bei einer Wahl im Index nicht im Bild, gleitet die Seite so weit, dass sie
   unter dem Header steht; danach bleibt die Seite bei weiteren Wahlen stehen. Mit der Tastatur
   gewählt, bleibt der Knopf mit dem Fokus dabei ganz im Bild. Eine Wahl per Klick gilt, bis
   sich der Zeiger wirklich bewegt: Zieht die Seite danach unter dem ruhenden Zeiger weiter,
   zeigt das Verweilen keinen anderen Raum.
4. **Mehr lesen**: Der Text klappt von oben auf (`clip-path`, `--dur-3`) und rückt 8 px nach;
   der Platz ist sofort da, nichts verschiebt sich nachträglich. Danach gilt wieder der normale
   Stil ohne Ausschnitt, damit kein Fokus-Ring beschnitten wird.
5. **Kleinigkeiten**: Der Bewegungsschalter faltet sich am Desktop beim Scrollen (und auf den
   Unterseiten) zu seinem runden Ende und mit Zeiger oder Fokus wieder auf, nur über den
   Ausschnitt (`clip-path`, `--dur-3`, `--ease-expo`): Nichts verschiebt sich, ein Klick trifft
   nur, was zu sehen ist. Der Hover-Schein der Buttons liegt auf einer eigenen Ebene (`::after`) und
   blendet nur über; die Lichtkante des sekundären Buttons wächst aus der Mitte (`scaleX`,
   `--dur-3`). Fotos zoomen bei Hover fein (nur feiner Pointer). Der Cookie-Hinweis wächst aus
   seinem Knopf ohne Überschwingen, die «404» rückt einmal von leicht unten an ihren Platz.

### Regeln

- **Nur `transform`, `opacity` und `clip-path` animieren.** Nie Lage, Grösse oder Abstände
  (`top`, `left`, `width`, `height`, `margin`, `padding`), nie `box-shadow`, `filter` oder
  `background-position`. Ein Schatten, der sich ändern soll, liegt auf einer eigenen Ebene und
  blendet über `opacity`. Der Wächter `scripts/motion-guard.test.ts` (Teil von `pnpm test`)
  prüft alle Stylesheets und Astro-Komponenten.
- **Kurven nur aus `tokens.css`**; keine mit einem y-Wert unter 0 oder über 1; keine
  Keyframe-Animation dreht etwas. Das Wort `linear` steht nur beim Abtauchen im Header und im
  Token `--scrub`. Auch das prüft der Wächter, gegen eine Positivliste der Eigenschaften.
- **Bewegung an der Scrollposition steht nur in den beiden `scroll.css`**, in einem Block, der
  Unterstützung (`@supports (animation-timeline: view())`) und gewünschte Bewegung voraussetzt,
  und jede Regel gilt nicht bei angehaltener Bewegung (`html:not([data-motion='off'])`). Der
  Wächter prüft das.
- **Zwei Fallen des Builds**, beide gemessen und mit Tests abgesichert:
  - Der CSS-Minifier legt `animation` und `animation-timeline` zu einer Angabe zusammen, die
    kein Browser annimmt, und schreibt `exit-crossing 100%` zu `exit-crossing 0%` um. Darum
    enthält jede dieser Kurzschreibweisen eine Variable (die Kurve aus den Tokens), und das Ende
    der Bogen-Strecke steht als `cover var(--sc-end, 100%)`.
  - Ein Kasten mit `overflow: hidden` ist für den Browser ein eigener Scrollbereich: Was darin
    an `view()` hängt, misst sich an ihm statt an der Seite und bleibt stehen. Rahmen um solche
    Inhalte schneiden darum mit `overflow: clip` ab (nur wo es die Bewegung gibt, sonst bleibt
    `hidden`). `e2e/scroll.spec.ts` prüft am gebauten Stand, dass jede Bewegung einen Namen und
    eine Zeitleiste hat und sich an der Seite misst.
- **Als Fenster gilt die Fläche unter dem Header**: Der Browser zieht `scroll-padding-top` von
  der Zeitleiste ab. Wo auf das ganze Fenster gemessen wird (Hero, Linie im Service), steht der
  Abzug 0 dabei; die Bühne der Firmengeschichte misst von ihrer Oberkante unter dem Header bis
  zum unteren Fensterrand.
- **Stehen bleibt nur die Firmengeschichte**, und nur solange ihre Jahre durchlaufen: Jedes
  Stück Weg bewegt dort sichtbar etwas (Linie, Karte), nichts wartet. Die Bühne passt ganz ins
  Fenster (auch 1366×650 und 360×640, geprüft in `e2e/years.spec.ts`); passt sie nicht, gilt die
  Zeitleiste. Ihre Bedingung (Bewegung erwünscht, Fenster ab 36rem Höhe) steht einmal im CSS;
  `years.ts` liest sie an `--yr-deck` ab, statt sie zu wiederholen.
- **Farbe am Scrollen nur als begründete Ausnahme**: Die zurücktretende Karte der
  Firmengeschichte nimmt den Ton des Bogens an (`background-color`). Ein Schleier darüber wäre
  billiger, aber dann könnte axe den Kontrast ihres Textes nicht mehr messen.
- **Dauern und Versätze aus den Tokens.** Ein Einzelwert braucht einen Kommentar mit Grund.
- **Was nach Zeit läuft, endet**: Der Hero ruht nach 1,5 s (geprüft in `e2e/web.spec.ts`).
  Einzige Ausnahme ist ein Signal, kein Auftritt: Der grüne Punkt des Öffnungsstatus atmet beim
  Laden, wenn geöffnet ist, zweimal ruhig aus (2 × 2 s, unter den 5 s von WCAG 2.2.2).
- **Das grösste Element zuerst**: Foto und Lead im Hero sind ab dem ersten Bild sichtbar (LCP,
  geprüft in `e2e/web.spec.ts`).
- **Das Skript vor dem ersten Bild**: Das Modul jeder Seite steht im `<head>` und hält das erste
  Bild an, bis es gelaufen ist (`blocking="render"`, die eingebundenen Module mit
  `modulepreload`; im Build gesetzt von `packages/config/src/early-script.mjs`, weil Astro an
  gebündelten Skripten keine Attribute erlaubt). So steht der Header beim ersten Bild in seiner
  Form, eine Seite mit Marke beginnt an der Marke, und nichts verschiebt sich beim Laden. Das
  erste Bild kommt dadurch nicht später, sondern früher (das Modul lädt mit dem Kopf).
- **Fokus bleibt sichtbar**: Auch im einen Bild, in dem der Header beim Formwechsel verborgen
  ist (`is-swapping`, gegen Layoutverschiebung), bleibt das fokussierte Bedienelement stehen
  (`visibility`). Was der nächste Bogen verdeckt, steht geometrisch noch im Fenster; bekommt es
  den Tastaturfokus, scrollt die Seite so weit zurück, dass sein Bogen wieder frei steht
  (`cover.ts`, WCAG 2.2, 2.4.11).
- **Reduzierte Bewegung**: `base.css` schaltet jede Animation ab (`none`, auch eine winzige
  Dauer zeigte im ersten Bild ihren Anfang) und setzt jeden Übergang auf 0; der Block in
  `scroll.css` gilt gar nicht. Kein Lenis, kein Seitenübergang, das Band bricht um.
- **Pause** (`html[data-motion="off"]`): Die Regeln in `scroll.css` gelten nicht, alles steht an
  seinem Platz im Layout (auch mitten in einem Übergang zwischen zwei Bogen). Die Bühne der
  Firmengeschichte bleibt, damit die Seite beim Anhalten nicht kürzer wird und springt: Ihre
  Jahre wechseln dann ohne Übergang. `base.css` hält
  jede Animation nach Zeit an und setzt jeden Übergang auf 0 (Menü-Vorhang, Hover-Zoom);
  `header.ts` wechselt die Form ohne Abtauchen und überspringt den Seitenübergang; `smooth.ts`
  beendet Lenis, der Browser scrollt selbst (ein gleitender Sprung kommt vorher sofort am Ziel
  an, `home.ts`); `hero.ts` beendet den Auftakt (`data-rested`). Ein gleitender Sprung kommt nur
  an, solange niemand mit dem Rad übernommen hat; dann bleibt die Seite, wo sie ist. Beim
  Fortsetzen hängt die Bewegung wieder am Scrollen, der Auftakt spielt nicht ein zweites Mal
  (geprüft in `e2e/web.spec.ts`). Kommt man aus dem Verlauf auf eine angehaltene Seite zurück
  (bfcache), überspringt sie den Übergang. Der Schalter gilt nur für die aktuelle Seite: Ohne
  Web-Speicher kann ihn die nächste Seite nicht kennen.
- **Ohne Unterstützung** (Firefox, Safari vor 26): Der Block in `scroll.css` gilt nicht. Alles
  steht, das Band ist eine umbrechende Liste; Auftakt, Menü, Header und Wahl bleiben. Die
  Firmengeschichte geht auch dort mit dem Scrollen weiter, in Schritten (`years.ts`).
- **Ohne JavaScript** läuft die Bewegung beim Scrollen wie mit (reines CSS); CSS-Auftritte nach
  Zeit (Hero, 404) enden sichtbar. Nur der Schalter fehlt; `prefers-reduced-motion` gilt.
- **Sprünge** (`data-jump` am `<html>`, `home.ts`): Die Marke zeigt, dass die Seite unterwegs
  ist (für das Anhalten mitten im Sprung und für die Tests). Sie fällt erst, wenn Lenis nicht
  mehr gleitet und zehn Bilder lang kein Scrollen kam (gezählt in Bildern, damit eine stockende
  Darstellung den Sprung nicht beendet). Vor dem Sprung steht alles, was die Seite oberhalb des
  Ziels noch verlängern würde (Teile mit `data-lazy`, Öffnungsstatus): Sonst endete das Gleiten
  zu tief. Auf fertigem Inhalt landet er von selbst.
- **CSP**: keine `style`-Attribute im Markup; Skripte dürfen `element.style` und eigene
  Custom Properties setzen (z. B. `--yr-p`). Platz in einer Folge (`--sc-i`, `--w`, `--i`) kommt
  aus `:nth-child`-Regeln, nie aus einem `style`-Attribut.
- **Eine Bibliothek**: Lenis (lerp 0.1) für sanftes Scrollen mit Maus oder Trackpad. GSAP,
  ScrollTrigger und SplitText sind entfallen (Entscheid 49): JavaScript der Startseite 14,8 KB
  statt 63,0 KB. Auf Geräten, die man nur mit dem Finger bedient, scrollt der Browser selbst
  (Lenis hängte sich sonst mit blockierenden Zuhörern an jede Berührung), Sprünge zu Marken sind
  dort sofort am Ziel. Ein Punkt im Menü springt auch am Desktop sofort, unter dem Vorhang: Hebt
  er sich, steht das Ziel schon da. Eine Taste zum Scrollen hält ein Ausgleiten von Lenis an,
  die Leertaste auf einem Knopf nicht (sie löst den Knopf aus).
- **Ältere Browser**: Neuere Schnittstellen nur mit Prüfung (z. B. `checkVisibility()`, fehlt in
  Safari vor 17.4; `requestIdleCallback`; `animation-timeline` über `@supports`).

Bewusst nicht: Bewegung, die von selbst läuft, Auftritte nach Zeit beim Scrollen, Auftritte aus
der Unschärfe, Fliesstext, der beim Scrollen einblendet, ein Abschnitt, der stehen bleibt, ohne
dass das Scrollen dort etwas führt, eine Auswahl ohne Reihenfolge, die das Scrollen
weiterschaltet (die Räume wählt man; nur die Jahre haben eine Reihenfolge), Bewegung quer zur
Scrollrichtung, eigener Mauszeiger, magnetische oder kippende Elemente, Zähler.

## 7. Technische Regeln fürs Markup

Unverändert von PSYber (siehe auch `CLAUDE.md`): keine Inline-Styles und -Skripte (strikte CSP
mit Hashes), interne Links über `href()` (Basis-Pfad der Pages-Vorschau), Satzzeichen nach Links
auf derselben Zeile mit `{/* prettier-ignore */}`, Formulare immer `method="post"`, Overlays mit
eigenem Scrollen tragen `data-lenis-prevent`, Klassennamen in Scoped Styles nie wie ein Baustein
aus `components.css` (`pnpm test` prüft das), Bilder mit `width`, `height` und `alt`.
Sektionen weit unter dem ersten Bildschirm tragen `data-lazy`; vor jedem Sprung zu einer Marke
legt `home.ts` sie aus, zeigt den Öffnungsstatus und vermisst Lenis neu (sonst endete der Sprung
an einer alten Grenze oder zu tief).

## 8. Suchmaschinen

Wie bei PSYber: Titel «Thema – Lüscher Wohnen» (höchstens rund 60 Zeichen, damit er ganz im
Treffer steht; die Startseite: «Möbel, Betten und Innenarchitektur in Baden – Lüscher Wohnen»),
Beschreibung unter rund 140 Zeichen mit Angebot und Ort, die H1 der Startseite trägt Angebot und
Ort («Inneneinrichtung in Baden seit 1946» über dem Slogan). Canonical nur auf Seiten im Index,
`noindex` nie zusätzlich in der robots.txt. Strukturierte Daten aus der Konfiguration, nur mit
Angaben, die auf der Seite stehen: Organisation (mit Gründung 1946 und den Gründern),
Geschäft als `FurnitureStore` und `HomeGoodsStore` mit Adresse (Kanton AG), Karte und
Öffnungszeiten, Website (Namen ohne Wiederholung), Seite, Pfad. Keine Bewertungen, keine Preise.
Text hinter «Mehr lesen» und in nicht gewählten Tafeln steht im HTML und wird gelesen.

Die robots.txt enthält nur, was Suchmaschinen auswerten: `User-agent: *`, `Allow: /` und die
Sitemap (Begründungen im Code, `packages/ui/src/lib/well-known.ts`). Kein Crawl-delay, kein Host,
keine Sperre für `/_astro/`. Die Vorschau auf GitHub Pages ist vollständig `noindex` (Meta und
Header); ihre robots.txt liegt unter dem Basis-Pfad und wird darum von Crawlern nicht gelesen.
Kein `llms.txt`: Google braucht dafür keine eigene Datei, und eine zweite Fassung der Inhalte
veraltet.

## 9. Keine Zählung

Anders als bei PSYber gibt es keine Reichweitenzählung: Das Briefing schliesst Analytics und
Tracking aus. Keine Cookies, kein Web-Speicher, keine Requests an Dritte.
