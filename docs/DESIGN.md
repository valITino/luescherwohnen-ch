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
  von Baden, jede Minute neu. Ohne JavaScript stehen nur die Öffnungszeiten als Liste (im Kontakt).
- **Fokus-Ring**: 3 px dunkles Grün mit 3 px Abstand, auf der dunklen Bühne Lüscher-Grün.
- **Eins wählen, eins sehen** (`choice.ts`): eine Liste mit Kopf und Tafel je Eintrag wird zum
  Index mit einer Bühne (Muster «Accordion» der APG, eine Tafel offen, «Weiter» auf der Bühne,
  Pfeiltasten, Direktlink über die Marke des Eintrags). Ohne Skript bleibt es eine Liste, alle
  Texte und Bilder stehen im HTML. Genutzt im Sortiment («Raum für Raum», Index links, Foto mit
  Text rechts; mit feinem Zeiger zeigt schon kurzes Verweilen den Raum) und in der
  Firmengeschichte («Jahr für Jahr», Achse mit sechs Jahren, eine grüne Linie wächst bis zum
  gewählten Jahr). Gewechselt wird nur durch eine Wahl, nie durch Scrollen.
- **Mehr lesen** (`.more`, natives `<details>`): Was nicht jeder lesen muss, steht hinter einer
  leisen Zeile mit Plus, das zum Minus wird. Der Text steht im HTML (für Suchmaschinen
  gleichwertig) und erscheint beim Öffnen sofort, ohne Einblenden.
- **Unser Team** (Über uns): runde Fotos mit Name und Aufgabe; wo es noch kein Foto gibt, die
  Initialen auf Salbei statt eines Platzhalterbildes. Die Fotos öffnen sich beim Hereinscrollen
  wie die Blende im Hero, nacheinander im Abstand `--stagger`; Namen stehen sofort da.
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

Stand nach der Überarbeitung vom 20.11.2026 und drei Prüfrunden danach (Entscheide 37 bis 40).
Bewegung soll ruhig und präzise wirken und eine Zielgruppe ab 40 nie beim Lesen aufhalten.

### Grundsätze

1. **Ankommen statt vorführen.** Alles bremst weich in seine Lage: Auftritte mit Expo- oder
   Quint-Kurve. Ausgänge sind kurz und antworten schon im ersten Bild: Menü und Seitenwechsel
   bremsen, der Header blendet beim Abtauchen gleichmässig aus (`linear`) und bremst nur seine
   kleine Bewegung. Kein Überschwingen, kein Federn, keine Drehung, keine Unschärfe.
2. **Eine Sprache.** Text steigt aus einer Maske, Bilder öffnen sich durch einen Clip, Flächen
   falten sich auf. Bewegt werden nur `transform` (auch `translate` und `scale`), `opacity` und
   `clip-path`. Farbwechsel bis 250 ms bei Hover und Fokus sind erlaubt.
3. **Lesen geht vor.** Foto und Lead im Hero stehen ab dem ersten Bild, Titelzeilen und Knöpfe
   sind nach etwa einer halben Sekunde klar, der Rest (bis 1,2 s) ist nur Ausklang. Fliesstext
   blendet nie ein.
4. **Zwei Signaturen, sonst Ruhe.** Der Auftakt im Hero und der Menü-Vorhang zeigen sich; alles
   andere ist Präzision: dieselben Kurven, gestaffelt und jederzeit unterbrechbar.
5. **Im Zweifel sichtbar.** Ohne JavaScript ist alles sichtbar, verborgen ist nur, was ein Skript
   selbst gesetzt hat. Bei reduzierter Bewegung bewegt sich nichts und nichts wartet. Mit dem
   Schalter «Bewegung pausieren» steht alles wie bei reduzierter Bewegung: Dauerbewegung hält
   an, Auftritte, Übergänge, der Formwechsel des Headers und der Seitenübergang entfallen, der
   Browser scrollt selbst (kein Ausgleiten), und nichts hängt am Scrollen. Ein Sprung zu einer
   Marke landet auf fertigem Inhalt, genau unter dem Header.

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
| `--dur-2`         | 250 ms  | Zustand; Leiste beim Seitenwechsel               |
| `--dur-3`         | 400 ms  | Flächen: Kapsel, Menü schliessen, Header-Wechsel |
| `--dur-4`         | 800 ms  | Auftritte: Zeilen, Kicker, Bild-Enthüllung       |
| `--dur-5`         | 1200 ms | Signatur: Hero-Blende                            |
| `--stagger`       | 70 ms   | Versatz in einer Folge                           |
| `--stagger-tight` | 45 ms   | dichte Folge, z. B. Menüpunkte                   |

Begründete Einzelwerte stehen mit Kommentar im Code: Zeilen im Hero 1000 ms
(`calc(var(--dur-4) + 200ms)`), Folgeelemente im Hero 560 ms, Menü öffnen und Kontaktblock im
Menü 560 ms, Glasfläche der Kapsel 360 ms, neue Seite beim Seitenwechsel 480 ms (40 ms später),
Hover-Zoom der Fotos 700 ms.

### Bewegte Momente

Die beiden Signaturen:

1. **Auftakt im Hero** (reines CSS, spielt auch ohne Skript): Das runde Foto öffnet sich wie eine
   Blende (`clip-path` von 30 % auf den vollen Kreis, Zoom von 1.1 auf 1, `--dur-5`,
   `--ease-out`) und ist ab dem ersten Bild sichtbar. Die Zeilen der Headline steigen dicht
   nacheinander aus ihrer Maske. Während sie noch gleiten, setzen sich Lead (ab 200 ms, nur
   `transform` um 4 px, vom ersten Bild an lesbar), Buttons (260 ms) und Anzeige (320 ms); nach 1,2 s
   ruht alles. Auf grossen Bildschirmen bleibt der Hero beim Scrollen kurz stehen, die erste
   Zeile tritt zurück, das Bild rückt etwas näher.
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
2. **Überschriften**: Der Kicker zeichnet sich ein (`clip-path`, `--dur-4`), 60 ms später steigen
   die Zeilen aus ihrer Maske (GSAP SplitText, `--dur-4`, `expo.out`, `--stagger`). Die Zeilen
   sind dabei genau die, die der Browser setzt: Jeder Umbruch wird vorher gemessen und bis zum
   Ende fest gesetzt (sonst bräche SplitText ausgewogene Überschriften und weiche Trennstriche
   anders um, und am Ende spränge der Umbruch). Screenreader hören dabei den Namen ohne den
   sichtbar gesetzten Trennstrich. Danach ist das Markup wieder wie zuvor.
3. **Bild-Enthüllung** (`.enter-unveil`: Sortiment, Aktuell, Projekte, Porträt): Das Foto steigt
   vom unteren Rand seines Rahmens auf und setzt sich aus einem leichten Zoom zur Mitte hin
   (`clip-path` und `scale` am Bild selbst, `--dur-4`, `--ease-expo`). Am Bild statt am Rahmen,
   weil der Browser dann nur eine Ebene bewegt: Beim Wischen auf dem Handy fielen so gemessen
   halb so viele Bilder aus. Es beginnt, sobald ein Viertel des Rahmens zu sehen ist, bei hohen
   Rahmen (höher als gut die halbe Fensterhöhe, etwa das Porträt) schon bei 12 % der
   Fensterhöhe; bleibt der Rahmen knapp darunter stehen, nach 250 ms. Hält man an, während ein
   Rahmen erst im untersten Streifen steht (unter der Schwelle, mindestens 16 px im Bild), nach
   300 ms Ruhe. Steht erst der obere Teil des Bildes im Fenster, beginnt der Ausschnitt an der
   Fensterkante statt am unteren Rand des Rahmens (`--unveil-from`, mit dem Zoom verrechnet): So
   spielt sich das ganze Aufsteigen dort ab, wo man hinsieht, und kein Rahmen steht lange leer
   im Bild. Solange es wartet, ist das Bild nur durchsichtig (nicht beschnitten, sonst lädt der
   Browser es nicht vor), und der Rahmen ist leer statt sandfarben. Lädt das Foto beim Auftritt
   noch (langsames Netz), wartet die Enthüllung bis zu 500 ms; danach verzichtet sie darauf, der
   Rahmen bleibt leer, und das Foto blendet ein, sobald es da ist (`--dur-3`, nur Deckkraft).
   Kommt es auch nach drei weiteren Sekunden nicht, zeigt der Rahmen wieder seine Sandfläche.
   Bilder, die zusammen ankommen, folgen einander im Abstand `--stagger` (höchstens drei
   Versätze), auch wenn sie zusammen knapp unter der Schwelle warten; öffnet sich eines, folgen
   die knapp darunter wartenden gleich mit (Rahmen nebeneinander mit verschiedener Höhe).
4. **Über uns**: Der Sucher beginnt mit dem Foto. Die unteren Ecken rücken nach 140 ms weich an
   ihren Platz (`--dur-4`, `--ease-expo`), die oberen erst nach 420 ms, wenn das aufsteigende Foto
   sie erreicht (vorher wären sie hell auf hellem Rahmen); ab 450 ms tastet eine grüne Linie das
   Bild einmal ab (nur `transform`, `--dur-4`), knapp hinter der Oberkante des Fotos. Ecken und
   Linie liegen auf dem Foto, nicht auf dem ganzen Rahmen: Die Linie endet an der Unterkante des
   Fotos, statt durch den Bildtext zu laufen. Am Desktop füllt das Foto den Rahmen bis zum
   Bildtext (der Rahmen ist so hoch wie die Spalte daneben). Die Werte erscheinen im Abstand
   `--stagger`.
5. **Haltung**: Die Wörter werden beim Scrollen dunkel, jedes mit weichem Ein- und Auslauf
   (angehalten: volle Deckkraft).
6. **Service**: Die Überschrift bleibt am Desktop stehen, die Schritte ziehen vorbei.
7. **Band**: Die Wörter aus Sortiment und Service als zwei gegenläufige Reihen grosser Schrift,
   ohne Überschrift und Etiketten, die Enden laufen weich aus (statische Maske). Pausiert bei
   Hover, Fokus und über den runden Knopf; reduziert steht es still und bricht um.
8. **Seitenwechsel** (View Transitions zwischen Dokumenten, reines CSS): Der Header steht still,
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
9. **Eins wählen, eins sehen**: Im Sortiment steigt beim Wechsel das neue Foto in der Sprache der
   Bild-Enthüllung über das alte (`unveil`, `--dur-4`, `--ease-expo`), das alte bleibt stehen,
   bis es gedeckt ist; der Text ist sofort lesbar und rückt nur 4 px nach (`--dur-3`). Der
   gewählte Name wird dunkel und rückt 6 px ein. In der Firmengeschichte steigt die grosse
   Jahreszahl aus ihrer Maske, das Foto öffnet sich, die grüne Linie wächst (`scaleX`, `--dur-4`).
   Bei reduzierter oder angehaltener Bewegung wechselt alles sofort.
10. **Der Kreis schliesst sich**: Kommt der Kontakt ins Bild, öffnet sich oben rechts einmal eine
    grüne Scheibe wie die Blende des Fotos im Hero (`clip-path` und `scale`, `--dur-5`, ab
    64rem), und der Punkt des Öffnungsstatus atmet wie oben im Hero: Die Seite endet mit dem
    Signal, mit dem sie beginnt.
11. **Kleinigkeiten**: Der Bewegungsschalter faltet sich am Desktop beim Scrollen (und auf den
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
- **Kurven nur aus `tokens.css`**, dazu `linear` für das Abtauchen im Header und das Band;
  keine mit einem y-Wert unter 0 oder über 1; keine Keyframe-Animation dreht etwas. Auch das
  prüft der Wächter, gegen eine Positivliste der Eigenschaften, und `linear` nur dort, wo es
  vorgesehen ist.
- **Dauern und Versätze aus den Tokens.** Ein Einzelwert braucht einen Kommentar mit Grund.
- **Alles endet**: Jeder Auftritt beim Scrollen ist spätestens nach 1410 ms fertig (die Linie im
  Sucher nach 1250 ms, Bilder nach 800 ms plus drei Versätzen), der Hero ruht nach 1,5 s (beides
  prüft `e2e/web.spec.ts`). Einzige Ausnahme ist ein Signal, kein Auftritt: Der grüne Punkt des
  Öffnungsstatus atmet, wenn geöffnet ist, zweimal ruhig aus (2 × 2 s, unter den 5 s von
  WCAG 2.2.2), im Hero beim Laden, im Kontakt mit dessen Auftritt.
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
  (`visibility`).
- **Reduzierte Bewegung**: `base.css` schaltet jede Animation ab (`none`, auch eine winzige
  Dauer zeigte im ersten Bild ihren Anfang) und setzt jeden Übergang auf 0. Kein Lenis, kein
  Anpinnen, keine Auftritte, kein Seitenübergang, das Band bricht um.
- **Pause** (`html[data-motion="off"]`): `base.css` hält jede Animation an und setzt jeden
  Übergang auf 0 (Menü-Vorhang, Hover-Zoom); `header.ts` wechselt die Form ohne Abtauchen und
  überspringt den Seitenübergang; `smooth.ts` beendet Lenis, der Browser scrollt selbst (ein
  gleitender Sprung kommt vorher sofort am Ziel an, `home.ts`); `hero.ts` beendet den Auftakt
  (`data-rested`), nimmt den Scroll-Verlauf weg und gibt das Anpinnen auf, sonst stünde der Hero
  eine Dreiviertel-Bildschirmhöhe lang still (die Scrollposition gleicht die kürzere Seite aus,
  was im Bild ist, bleibt); `haltung.ts` zeigt alle Wörter ganz; `reveal.ts` löst alle
  wartenden und erfolgten Auftritte auf (`data-enter=""`, auch ein spät eingeblendetes Foto);
  Komponenten setzen ihre laufenden Auftritte ans Ende (Rückfall in CSS). Ein gleitender Sprung
  kommt nur an, solange niemand mit dem Rad übernommen hat; dann bleibt die Seite, wo sie ist.
  Beim Fortsetzen laufen Dauerbewegung, Lenis und die Effekte am Scrollen wieder, Auftritte
  spielen nicht ein zweites Mal (geprüft in `e2e/web.spec.ts`). Steht man dabei im Hero, gleiten
  erste Zeile und Bild an den Punkt, den das wieder angepinnte Scrollen vorgibt (`--dur-3`,
  `data-settling`), statt in einem Bild dorthin zu springen. Kommt man aus dem Verlauf auf eine
  angehaltene Seite zurück (bfcache), überspringt sie den Übergang. Der Schalter gilt nur für die aktuelle Seite: Ohne Web-Speicher kann ihn
  die nächste Seite nicht kennen.
- **Ohne JavaScript** gibt es keinen Wartezustand; CSS-Auftritte (Hero, 404) enden sichtbar.
- **Sprünge** (`data-jump` am `<html>`, `home.ts`): Was unterwegs oder am Ziel ins Bild kommt,
  steht sofort da. Die Marke fällt erst, wenn Lenis nicht mehr gleitet und zehn Bilder lang kein
  Scrollen kam (gezählt in Bildern, damit eine stockende Darstellung den Sprung nicht beendet).
  Vor dem Sprung steht alles, was die Seite oberhalb des Ziels noch verlängern würde (Teile mit
  `data-lazy`, Öffnungsstatus): Sonst endete das Gleiten zu tief.
- **CSP**: keine `style`-Attribute im Markup; Skripte dürfen `element.style` und eigene
  Custom Properties setzen (z. B. `--enter-i`, `--unveil-from`).
- **Keine weitere Bibliothek**: GSAP mit SplitText und Lenis (lerp 0.1) genügen. Lenis läuft nur
  mit Maus oder Trackpad: Auf Geräten, die man nur mit dem Finger bedient, scrollt der Browser
  selbst (Lenis hängte sich sonst mit blockierenden Zuhörern an jede Berührung), Sprünge zu
  Marken sind dort sofort am Ziel. Ein Punkt im Menü springt auch am Desktop sofort, unter dem
  Vorhang: Hebt er sich, steht das Ziel schon da. Eine Taste zum Scrollen hält ein Ausgleiten von Lenis an,
  die Leertaste auf einem Knopf nicht (sie löst den Knopf aus).
- **Ältere Browser**: Neuere Schnittstellen nur mit Prüfung (z. B. `checkVisibility()`, fehlt in
  Safari vor 17.4; `requestIdleCallback`).

Bewusst nicht: Auftritte aus der Unschärfe, Parallax, Fliesstext, der beim Scrollen einblendet,
gescrubbte Galerien, eigener Mauszeiger, magnetische oder kippende Elemente, Zähler.

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
