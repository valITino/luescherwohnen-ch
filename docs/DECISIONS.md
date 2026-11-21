# Entscheidungen

Laufende Liste der Entscheidungen mit Grund, im Format von PSYber. Fachliche Freigaben trifft
der Auftraggeber; sie stehen im Freigabeprotokoll von `docs/requirements-analysis.md`.
Architekturentscheide mit grösserer Tragweite stehen zusätzlich als ADR in `docs/adr/`.

## Auftrag vom 20.11.2026 (Repository-Inhaber)

- **1.** **Demo-Website nach dem PSYber-System.** Stil, Design, Format und Logik von `valITino/PsySec`
  werden übernommen; die Demo läuft auf GitHub Pages des Forks. Das ist ein Auftrag des
  Repository-Inhabers, keine Produktionsfreigabe des Auftraggebers (Gate G0 bleibt offen).
- **2.** **Hell statt dunkel.** Auf Rückfrage entschieden: PSYber-System vollständig, aber helles,
  warmes Farbschema mit Lüscher-Grün; Cyber-Motive werden ersetzt. Grund: Briefing «hell und
  freundlich», Zielgruppe 40+.

## Technik

- **3.** **Astro 7, statisch, Vanilla TypeScript im Browser** wie bei PSYber (ADR-0001). Erfüllt
  CLAUDE.md «statisch bzw. serverseitig gerenderte Seiten und Vanilla JavaScript»: Jede Seite ist
  ohne JavaScript vollständig lesbar.
- **4.** **Kein Bootstrap.** Das PSYber-System bringt eigene Tokens und Bausteine (Tailwind nur als
  Reset und für Utilities). Der Bootstrap-Wunsch aus dem Briefing bleibt als offene Frage D-015.
- **5.** **Monorepo wie PSYber**, aber nur mit dem Nötigen: `apps/web`, `packages/ui`,
  `packages/config`. Nicht übernommen: Umfrage, Surprise-Seite, API, Turnstile, Zählung,
  Easter Eggs, Analyse-Skripte (kein Bedarf, Tracking ausgeschlossen).
- **6.** **Kontaktformular nur mit Empfänger.** Ohne `PUBLIC_CONTACT_ENDPOINT` zeigt die Produktion
  direkte Wege (Anrufen, E-Mail, Route); die Vorschau simuliert das Formular. Grund: Empfang,
  Aufbewahrung und Löschung sind offen (D-003, D-013). Ein künftiger Empfänger muss dieselben
  Regeln serverseitig prüfen (`apps/web/src/lib/contact-form.ts`).
- **7.** **Karte als Link statt Einbettung** (OpenStreetMap). Keine Daten an Dritte, bevor jemand
  klickt (D-004).
- **8.** **Container: nginx-unprivileged (Mainline 1.31.7, Alpine 3.24) mit `apk upgrade`** (ADR-0003).
  Die stabile Linie 1.30.6 hatte vier kritische, behobene Lücken, für die es noch kein
  unprivileged-Image 1.30.7 gibt; nginx.org empfiehlt ohnehin Mainline.
- **9.** **Security-Header aus einer Quelle** (`packages/config/src/security.mjs`): CSP-Meta mit Hashes
  für jede Seite, die übrigen Header als generiertes nginx-Include.
- **10.** **CI pfadbasiert ohne Fremd-Actions für Scanner.** Dispatcher `scripts/ci-changes.mjs`;
  Trivy, Syft, hadolint, actionlint und lychee laufen als per Digest gepinnte Container. Nur
  offizielle GitHub-Actions, per voller SHA gepinnt.
- **11.** **Kein Registry-Push, kein Deployment ausser Pages.** Docker Hub und Zielplattform sind offen
  (D-007, D-008).

## Gestaltung

- **12.** **Schrift eine Stufe grösser** als bei PSYber (Fliesstext 17–19 px, Labels 14 px).
- **13.** **Kicker «01 / Sortiment»** statt «0x01 // …»; Nummern in Mono und dunklem Grün.
- **14.** **Runde Bild-Bühne statt Globus** im Hero; Headline endet links davon.
- **15.** **Telefon-Knopf in Leiste und Kapsel**, weil Anrufen für die Zielgruppe der wichtigste Weg ist.
  Unter 360 px Breite steht er nur im Menü.
- **16.** **Öffnungsstatus im Hero und in der Besuchs-Bühne** (Zeitzone Europe/Zurich). Feiertage und
  Betriebsferien sind nicht bekannt; darum der Zusatz «laut Öffnungszeiten» im Kontakt.
- **17.** **Band statt Phishing-Ticker**: Sortiment, Bodenbeläge und Service als Endlosband.
- **18.** **«Wir stehen für» statt Terminal** in «Über uns»; dazu Zeitleiste der Firmengeschichte und
  die beiden Standorte.
- **19.** **Keine Reichweitenzählung** (Briefing: kein Tracking).
- **20.** **Favicon «L» auf Lüscher-Grün** aus der Wortmarke abgeleitet (Vorschlag, D-005).

## Inhalte

- **21.** **Texte nur aus belegten Quellen**: `docs/homepage-anforderungen.md`, `docs/index.html`,
  `docs/Homepage.docx` (Bildschirmfotos der bisherigen Website). Kürzungen und Verbindungen sind
  als Entwurf zu verstehen und vom Auftraggeber freizugeben:
  - Hero: «Wohnen heisst leben. Und sich wohl fühlen.» aus den Slogans der bisherigen Website.
  - Sortiment-Texte aus «Unternehmen» und «Unsere Kompetenzen».
  - «Haltung», «Service», «Über uns», «Aktuell» aus den jeweiligen Seiten, gekürzt.
- **22.** **Samstag 10:00–16:00 Uhr** nach `docs/index.html` (neuester Stand im Repository); die
  frühere Website nannte 9:00 Uhr (W1). «Sonntag geschlossen» von der früheren Website.
- **23.** **Keine Generationenzählung, keine Funktion «Inhaber»/«Geschäftsführer»** (W2, W3):
  Michael Längle steht als «Geschäftsleiter» wie im Impressum.
- **24.** **Projekte ohne Ortsangaben**, nur in der Vorschau sichtbar (WEB-F-006); in Produktion erst mit
  `PUBLIC_SHOW_PROJECTS=true` nach Freigabe.
- **25.** **Interview nur als kurzes Zitat mit Quelle**, kein Nachdruck des Zeitschriftentexts.
- **26.** **Keine Shop-Inhalte, keine Preise, keine AGB** (Phase 2, separater Auftrag).
- **27.** **Mobilnummer 079 … und Fax** nicht auf der Startseite; das Fax steht nur im Impressum wie
  bisher (W9).

## Nach den unabhängigen Reviews (20.11.2026)

- **28.** **Formular-Regeln strenger:** Anliegen nur aus der eigenen Liste (`Object.hasOwn`, nicht
  `in`), Telefonnummer mit mindestens sechs Ziffern. Honeypot und Bestätigung reisen im Payload mit.
- **29.** **Dispatcher:** Änderungen an `_web.yml`/`_container.yml` lösen ihre Module aus, `ci.yml`
  alles; `docker-up.sh` zählt zum Container. Auf `main` prüft die CI immer den ganzen Stand, weil
  Pages ihn veröffentlicht; laufende Läufe werden dort nicht abgebrochen.
- **30.** **Pages nur nach erfolgreicher CI** (`workflow_run`), mit Prüfung des Artefakts vor der
  Veröffentlichung. Ausgecheckt wird nur `main` selbst und nur, wenn die CI genau diesen Commit
  geprüft hat; von Hand nur auf `main` (CodeQL-Befunde im ersten PR-Lauf auf GitHub).
- **31.** **Security-Header auf allen Antworten** des Containers (auch 301, 400, 405), Zugriffslog
  ohne IP und User-Agent, nginx-Konfiguration root-eigen.
- **32.** **HSTS vorsichtig:** ein Tag ohne Subdomains; ein Jahr mit Subdomains und Preload nur mit
  `PUBLIC_HSTS_PRELOAD=true`.
- **33.** **Band ohne JavaScript steht still** (WCAG 2.2.2), wie bei reduzierter Bewegung.
- **34.** **Öffnungsstatus** nennt den Abstand in Tagen («heute», «morgen», Wochentag, «nächsten …»).
- **35.** **Abhängigkeiten:** `markdownlint-cli2` auf 0.24 (behebt HIGH-Lücken in Parsern zur
  Build-Zeit), Override für KaTeX. `pnpm audit` ohne Befund.
- **36.** **CodeQL (SAST)** für JavaScript/TypeScript und Actions sowie eine Sperre für PHP-,
  Archiv- und Binärdateien in der CI.

## Bewegung (20.11.2026)

- **37.** **Ein Bewegungssystem statt einzelner Effekte** (Auftrag des Repository-Inhabers,
  Spezifikation aus einer Design-Runde, gegen den Code geprüft; Einzelheiten in
  `docs/DESIGN.md`, Abschnitt 6):
  - **Eine Quelle je Laufzeit:** Kurven, Dauern und Versätze stehen in `tokens.css` und
    gespiegelt in `packages/ui/src/motion/tokens.ts`; ein Unit-Test hält beide gleich. Grund:
    CSS-Kurve und GSAP-Kurve wichen vorher um 0,048 voneinander ab, die Seite bewegte sich mit
    drei verschiedenen Kurven.
  - **Nur `transform`, `opacity` und `clip-path`.** Grund: Layout, Schatten, Filter und
    Hintergrundlage kosten auf schwachen Handys in jedem Bild neues Layout oder Zeichnen.
    Behoben: Lichtkante (`left`/`width`, jetzt `scaleX`), Hover-Schein (`box-shadow`, jetzt eine
    eigene Ebene mit `opacity`), Abtastlinie in «Über uns» (`background-position`, jetzt
    `transform`). Der Wächter `scripts/motion-guard.test.ts` verhindert Rückfälle.
  - **Kein Überschwingen, keine Drehung**: Ecken im Sucher, Cookie-Hinweis und «404» landen weich.
  - **Zwei Signaturen** (Hero-Blende, Menü-Vorhang), alles andere leise; der Header bleibt beim
    Seitenwechsel stehen (View Transition mit eigenem Namen `site-bar`).
  - **Nichts wartet**: bei reduzierter Bewegung, angehaltener Bewegung, ohne JavaScript und nach
    einem Sprung zu einer Marke steht der Inhalt sofort fertig da.
  - **Abweichungen von der Spezifikation:** Die Abtastlinie läuft `--dur-4` statt `--dur-5`, weil
    jeder Auftritt nach spätestens 1200 ms plus drei Versätzen enden soll (e2e-Test); mit 320 ms
    Vorlauf wären es 1520 ms. Die Ebene des Hover-Scheins liegt auf `inset: -1px` statt `0`, damit
    der Schatten nicht über den 1 px breiten Rand des Buttons fällt.
  - **Bewusst nicht:** Auftritte aus der Unschärfe, Parallax, einblendender Fliesstext,
    gescrubbte Galerien, eigener Mauszeiger, magnetische Buttons, neue Bibliotheken.
- **38.** **Nach vier unabhängigen Prüfungen** (Leistung, Zustände und Barrierefreiheit, Code,
  Gestaltung; je gegen den Stand vor der Bewegungsarbeit gemessen) nachgeschärft:
  - **Kapsel ohne Namen für den Seitenwechsel.** Nur die Leiste oben heisst `site-bar`. Grund:
    Mit Namen zog der Browser die Kapsel beim Wechsel auf die Grösse der Leiste (Logo und Knöpfe
    verzerrt), und ein benanntes Element begrenzt die Unschärfe seiner Kinder: Das Milchglas
    blieb klar.
  - **Header antwortet sofort.** Abtauchen in `--dur-1` (Deckkraft gleichmässig, die kleine
    Bewegung bremsend) statt `--dur-2` beschleunigend, Rückkehr ohne Vorlauf, Glasfläche 360 ms
    aus 10 % Rand. Grund: Der Wechsel
    dauerte 2- bis 2,7-mal so lang wie vorher und stand einen Moment leer. Fokus taucht nicht
    ab; bei einem Sprung steht die Form sofort.
  - **Lead im Hero blendet nicht ein** und die Folgeelemente setzen sich ab 200 ms statt
    380 ms. Grund: Grundsatz «Fliesstext blendet nie ein», und auf dem Handy wurde der Lead zum
    grössten Element: LCP 1004 → 1268 ms.
  - **Bild-Enthüllung kürzer** (`--dur-4`), **Clip und Zoom am Bild statt am Rahmen.** Grund:
    Beim Wischen auf dem Handy (4-fach gedrosselt, je zwei Läufe) fielen 55–63 Bilder aus, ohne
    Enthüllung 19–26. Gemessene Varianten: Clip am Rahmen ohne Zoom 122–126 (schlechter, darum
    verworfen), mit eigener Ebene für das Bild 130–132, mit Zoom 54–63, Clip und Zoom am Bild
    26–40, nur Aufsteigen ohne Clip 32–42. Gewählt: Clip und Zoom am Bild, die Geste bleibt.
  - **Menü schliesst bremsend** (`--ease-out`) statt `--ease-in-out`, Wörter ab 70 ms. Grund:
    150–200 ms ohne sichtbare Antwort auf einen Fingertipp.
  - **Seitenwechsel ohne Doppelbelichtung:** alte Seite `--dur-1` bremsend, neue 80 ms später.
  - **Anhalten und Fortsetzen spielt nichts zweimal.** Erfolgte Auftritte verlieren beim
    Anhalten ihr `in`, der Hero-Auftakt endet (`data-rested`). Grund: Nach dem Fortsetzen
    öffneten sich fertige Bilder neu, und der Hero sprang zurück.
  - **Nicht übernommen:** stärkere Blende über 1400 ms (sprengt die 1,2 s), Positivliste im
    Bewegungswächter (offen in `docs/TODO.md`).
- **39.** **Zweite Prüfrunde** (dieselben vier Blickwinkel, jeder Befund ab «mittel» von zwei
  unabhängigen Gegenprüfungen bestätigt) gegen `72b5b36`:
  - **Seitenwechsel zu einer Marke ohne aufgeblasene Kapsel.** Von Impressum oder Datenschutz zu
    `/#kontakt` (und zurück durch den Verlauf ohne bfcache) wurde die neue Seite mitten im
    Übergang zur Kapsel, und der Browser zog sie auf die Breite der alten Leiste (2,3- bis
    2,8-fach). Jetzt verliert die alte Leiste in diesen Fällen ihren Namen (`pageswap` in
    `header.ts`, Klasse `is-leaving`); der neue Header blendet für sich ein (`--dur-2`). Oben von
    Seite zu Seite bleibt die Leiste stehen. Verworfen: Name nur bei `:target` (zur Zeit des
    ersten Bildes oft noch nicht gesetzt) und Zustand in `pagereveal` setzen (Skript läuft nicht
    sicher vorher).
  - **Bilder laden wieder vor.** Ein ganz beschnittenes `<img loading="lazy">` lud Chromium beim
    Scrollen erst rund 150 px im Bild; auf langsamen Netzen stieg die Enthüllung über einen leeren
    Rahmen, dann sprang das Foto hinein. Wartende Bilder sind jetzt nur durchsichtig (Abruf rund
    1200 px vorher, gemessen), der Rahmen bleibt so lange leer statt sandfarben, der Zoom setzt
    sich zur Mitte (kein 8-px-Sprung mehr mit dem Hover-Zoom).
  - **Der Schalter «Bewegung pausieren» gilt überall** (Regel in `CLAUDE.md`): auch für den
    Formwechsel des Headers, den Menü-Vorhang, Übergänge und den Seitenübergang.
  - **Tastaturfokus fällt nicht mehr auf `<body>`**, wenn das fokussierte Bedienelement in der
    neuen Form fehlt (Menü-Knopf oben am Desktop, «Beratung anfragen» oben am Handy); ein
    sichtbares Gegenstück übernimmt. War schon vor der Bewegungsarbeit so.
  - **Sprünge enden nach Bildern, nicht nach Millisekunden**: Stockte die Darstellung länger als
    160 ms, endete die Marke mitten im Sprung, und das Ziel trat doch auf (e2e-Test unter Last
    gelegentlich rot). Jetzt zählt `home.ts` zehn ruhige Bilder und wartet, bis Lenis steht.
  - **Kein Lenis auf Geräten, die man nur mit dem Finger bedient.** Lenis scrollt dort ohnehin
    nicht selbst, hängte sich aber mit `passive: false` an jede Berührung; jedes Wischen wartete
    auf den Hauptthread (gemessen 4-fach gedrosselt: 33 statt 14–17 ausgefallene Bilder, nur zwei
    Läufe, ohne Grafikchip). Folge: Sprünge zu Marken sind auf dem Handy sofort am Ziel statt
    1,7 s durch die ganze Seite zu rauschen. Mit Maus und Trackpad bleibt Lenis; eine Taste zum
    Scrollen hält ein Ausgleiten an (vorher zog Lenis die Seite nach «Pos1» zurück).
  - **Kleinere:** Umkehr direkt nach dem Wechsel wartet nicht mehr 200 ms auf die Notbremse;
    nach einem Sprung steht das Glas der Kapsel sofort; reduzierte Bewegung zeigt kein erstes
    Bild mit leerem Menü oder Hero mehr (`animation: none`); neue Seite 40 statt 80 ms später;
    Lead im Hero rückt 4 statt 8 px; Druck zeigt halb enthüllte Bilder ganz.
  - **Bewusst nicht geändert:** Der Header-Wechsel bleibt mit gut einer halben Sekunde etwa
    doppelt so lang wie vor der Bewegungsarbeit (die gestaffelte Rückkehr ist die gewollte Geste;
    beide Gegenprüfungen stuften das als gering ein). Offen und auf echte Geräte angewiesen:
    Rastern des Menü-Vorhangs am Desktop, gelegentliche 83-ms-Stockung beim Wischen,
    Seitenfehler «Transition was aborted» bei manchen Seitenwechseln (`docs/TODO.md`).
- **40.** **Dritte Prüfrunde** gegen `f1173cc` (fünf Blickwinkel: Seitenwechsel, Bild-Enthüllung,
  Header mit Fokus und Pause, Wischen und Sprünge, Code; jeder Befund ab «mittel» zweimal
  gegengeprüft). Drei bestätigte Befunde, dazu die meisten kleineren:
  - **`checkVisibility()` mit Prüfung** (mittel, neu in `15ea507`): Safari und iOS 16.4 bis 17.3
    (im Ziel des Builds) kennen die Methode nicht. Der Header blieb dort beim Scrollen die
    durchsichtige Leiste über dem Inhalt. Jetzt mit Rückfall auf `getClientRects()`; ein e2e-Test
    löscht die Methode.
  - **Kein graues Bild im stehenden Header** (mittel, neu in `15ea507`): Oben von Seite zu Seite
    wurden alte und neue Leiste übergeblendet. Gerät die Überblendung im ersten Bild aus dem
    Takt (Chromium, Animation im Compositor), wird die Leiste ein Bild lang grau; mit der
    bremsenden Kurve fast bei jedem Wechsel (Handy 22 von 26 Läufen). Ein Paar wird jetzt gar
    nicht mehr übergeblendet, nur eine Leiste ohne Gegenstück blendet aus bzw. ein
    (`:only-child`, gemessen 0 von 14). Verworfen: das Paar wieder mit 400 ms `ease-in-out`
    (am Desktop weiter 7 von 24) und `:not(:only-child)` (passt in Chromium nie).
  - **Der Schalter «Bewegung pausieren» stoppt auch das Scrollen** (mittel, Bestand; die
    Aussage «gilt überall» aus Entscheid 39 stimmte nicht): Lenis wird beendet, solange
    angehalten ist (Sprünge sofort am Ziel, kein Ausgleiten), der Hero hängt nicht mehr am
    Scrollen (Anpinnen bleibt, damit die Seite nicht springt), die Haltung steht in voller
    Deckkraft. Beim Fortsetzen läuft all das wieder; Auftritte bleiben aus. Der Schalter gilt nur
    für die aktuelle Seite (kein Web-Speicher).
  - **Bild-Enthüllung, die man sieht**: Die Enthüllung begann, sobald der Rahmen 8 % über dem
    unteren Rand stand; das Foto stieg so grösstenteils unter dem Rand auf, zu sehen war nur die
    ankommende Oberkante (gemessen 330 bis 770 ms leere Rahmen). Jetzt beginnt sie, sobald ein
    Viertel des Rahmens zu sehen ist, bleibt der Rahmen knapp darunter stehen, nach 700 ms.
    Lädt das Foto dann noch (langsames Netz, schnelles Wischen), wartet die Enthüllung bis
    500 ms und steht sonst ohne Auftritt auf Sand, statt über einen leeren Rahmen zu steigen.
    Der Sucher im Porträt beginnt mit dem Foto, seine oberen Ecken und die Linie erst, wenn das
    Foto oben ankommt.
  - **Überschriften brechen beim Auftritt wie danach um.** SplitText hielt «Familien­unternehmen»
    zusammen und bricht ausgewogene Überschriften anders um; am Ende des Auftritts sprang der
    Umbruch (Bestand, war in `docs/TODO.md`). Jetzt werden die Umbrüche vorher gemessen und für
    den Auftritt fest gesetzt; ein e2e-Test vergleicht alle Überschriften.
  - **Kleinere:** Sprung aus der Leiste landet genau unter dem Header (der Öffnungsstatus im
    Besuch erschien erst unterwegs, das Gleiten endete 32 px zu tief; jetzt steht er vor dem
    Sprung); ein fokussierter Link der Navigation taucht nicht ab, das Gegenstück steht sofort
    ganz da, und für Links und Logo ist es das nächste Bedienelement der Leiste (Tab bleibt in
    der Kapsel); die Leertaste auf einem Knopf hält das Ausgleiten nicht mehr an; Kommentare
    (Druck, Porträtrahmen, `skipTransition()`) berichtigt; der e2e-Test zur Pause prüft den
    Header jetzt auch auf dem Handy.
  - **Bewusst nicht geändert** (`docs/TODO.md`): Zurück und vor zwischen zwei Seiten, die oben
    stehen, blendet der Header über, statt zu stehen (die alte Seite weiss nicht, wo die neue
    beginnt; ein blockierendes Skript im Kopf dafür lohnt sich nicht). Der sofortige Formwechsel
    bei reduzierter und angehaltener Bewegung zählt als kleine Layoutverschiebung. Eine Taste
    während des Ausgleitens kostet einmal ein Layout.
- **41.** **Vierte Prüfrunde** gegen `f1173cc` und `3bcbbd6` (fünf Blickwinkel; jeder Befund ab
  «mittel» von zwei Gegenprüfungen bestätigt; die neuen Tests aus Entscheid 40 schlagen auf
  `f1173cc` alle aus dem beabsichtigten Grund fehl).
  - **Leere Rahmen kürzer** (zwei Befunde «mittel», neu in `87af9ac`): Ein Rahmen, der knapp
    unter der Schwelle stand, wartete 700 ms und stieg dann ebenso verdeckt auf wie vorher
    (leer gemessen 830 bis 960 ms statt 150 bis 230 ms, auf dem Handy rund jeder vierte
    Auftritt). Das Porträt (948 px hoch) wartete auf ein Viertel seiner ganzen Höhe und stand
    bis zu einer Sekunde als weisse Fläche im Bild. Jetzt: Wartezeit am Rand 250 ms (mehr zeigt
    vom Aufsteigen nicht mehr), und die Schwelle ist höchstens 12 % der Fensterhöhe (feine
    Stufen des Observers, gemessen an der sichtbaren Höhe). Gegengeprüft: So bleibt fast der
    ganze Gewinn an sichtbarem Aufsteigen, die leere Zeit halbiert sich. Verworfen: den Zeitgeber
    bei jedem Scrollen neu starten (das Ausgleiten von Lenis und Wischen meldet bis zu einer
    Sekunde lang Scrollen, das Bild käme später als heute).
  - **Spätes Foto blendet ein** (klein): Statt leer, dann hart Sand, dann das Foto, bleibt der
    Rahmen leer und das Foto blendet ein, sobald es da ist (`late`, `loaded`, nur Deckkraft).
  - **Anhalten mitten im Sprung** (klein, neu in `87af9ac`): Lenis endete, und die Seite blieb
    mitten auf der Strecke stehen, die Adresse zeigte schon die Marke. Jetzt kommt der Sprung
    vorher sofort an der Marke an. (Lenis führt bei einem Sprung `targetScroll` mit dem Gleiten
    nach, das Ziel ist darum die Marke der Adresse.)
  - **Angehalten kein stiller Hero** (klein, neu in `87af9ac`): Der Hero blieb angepinnt, und die
    ersten 490 bis 810 px Scrollen bewegten nichts. Angehalten gibt er das Anpinnen auf, beim
    Fortsetzen nimmt er es wieder; die Scrollposition gleicht aus, was im Bild ist, bleibt.
    Gemessen wird am Abschnitt darunter: Chromium gleicht mit Scroll Anchoring manchmal selbst
    aus, eine feste Rechnung verschob dann doppelt.
  - **Header beim Seitenwechsel** (klein, Bestand): Die neue Seite stellt ihre Form schon in
    `pagereveal` ein; ein Link zu einer Marke zeigte sonst vier Bilder lang oben die Leiste, dann
    sprang die Kapsel auf. Zurück und vor zu einer Seite, die oben beginnt, steht ihre Leiste
    sofort (Übergangstyp `stand`), statt einige Bilder lang grau überzublenden (damit erledigt,
    was Entscheid 40 bewusst offen liess). Ohne Navigation API (pageswap ohne `activation`) gilt
    die sichere Annahme wie bei einer Marke. Die Absage des Übergangs bei angehaltener Bewegung
    meldet keinen unbehandelten Fehler mehr.
  - **Kleinere:** Rahmen, die gemeinsam knapp unter der Schwelle warten, öffnen sich als Folge
    im Abstand `--stagger`; Ecken und Linie im Sucher starten 60 bzw. 50 ms später (420 und
    450 ms), genau mit dem Foto; Screenreader hören während des Auftritts den Namen der
    Überschrift ohne den sichtbar gesetzten Trennstrich; mit Tastaturfokus stehen im Header nur
    Deckkraft und Lage sofort, die Farben beim Hover gleiten weiter; der Öffnungsstatus im
    Besuch rechnet eine Bildschirmhöhe vorher (er erschien auf dem Handy im Bild und schob die
    Knöpfe 40 px nach unten); der e2e-Test zur Landung nach einem Sprung läuft bei 1280 px, wo ein
    Fehler 35 px statt 3 px ausmacht.
  - **Bewusst nicht geändert** (`docs/TODO.md`): Chromium stürzt ab, wenn ein Skript während
    eines Übergangs den Stil einer nicht beteiligten Ebene mit `:only-child` liest (nur in
    Tests, die Website liest ihn nie); die Leiste liegt am Desktop auf einem halben Pixel und
    wirkt während des Übergangs minimal weich; beim Laden mit Direktlink zählt der sofortige
    Formwechsel mitunter als Layoutverschiebung.
- **42.** **Fünfte Prüfrunde** gegen `3bcbbd6` und `ab7e9e9` (vier Blickwinkel; die Befunde ab
  «mittel» von je zwei Gegenprüfungen bestätigt, weitere zwei «mittel» über der Grenze selbst
  nachgemessen; die neuen Tests aus Entscheid 41 schlagen auf `3bcbbd6` aus dem beabsichtigten
  Grund fehl).
  - **Header beim Seitenwechsel nur, wenn das Skript rechtzeitig läuft** (mittel, neu in
    `8a1073c`): Der Zuhörer für `pagereveal` sitzt im Modul der Seite, und der Browser zeigt die
    neue Seite mitunter, bevor es läuft (gemessen: bei wiederholtem Besuch 2 bis 8 %, beim ersten
    Besuch 40 bis 60 %, vierfach gedrosselt fast immer). Dann steht die Seite noch oben, und der
    Header wechselt wie vorher; schlechter als vorher wird nichts. Entscheid 39 hatte `pagereveal`
    aus genau diesem Grund verworfen; die Dokumentation versprach es nun als sicher, und der
    e2e-Test schlug in rund jedem fünften Lauf fehl. Jetzt: Die Dokumentation nennt es eine
    Verbesserung, die nicht immer greift; der Test verwirft Versuche, in denen das Skript zu spät
    lief (er schlägt auf dem alten Stand weiter fehl); läuft das Skript spät, setzt es den Typ
    `stand` nachträglich am laufenden Übergang (`document.activeViewTransition`). Verworfen: das
    Modul im Kopf mit `blocking="render"` laden (behebt es, kostet auf einem langsamen Handy beim
    ersten Besuch 170 ms bis zum ersten Bild) und ein zweites, klassisches Skript nur für diesen
    Fall (doppelte Logik für einen Moment, der vorher genauso aussah).
  - **Kapsel zu Kapsel bleibt stehen** (mittel, neu in `8a1073c`): Vom Ende einer Unterseite zu
    einer Marke (Kapsel auf beiden Seiten, auch über das Menü auf dem Handy) blendete die Kapsel
    mit der alten Seite aus und mit der neuen ein, einen Augenblick fast leer. Jetzt trägt sie
    nur während des Wechsels den Namen `site-capsule` (`is-handing`): Kommen beide als Kapsel,
    bilden sie ein Paar und stehen; sonst geht bzw. kommt sie mit ihrer Seite. Ihr Milchglas ist
    dabei eine halbe Sekunde lang mattes Papier (82 % deckend, kaum zu sehen).
  - **Spät geladenes Foto nach dem Fortsetzen** (klein, neu in `8a1073c`): Anhalten setzte den
    Zustand `loaded` nicht zurück, beim Fortsetzen blendete das Foto nochmals aus dem Leeren ein
    (nur ab 1280 px sichtbar, wo der Schalter in der Ecke schwebt). Jetzt löst das Anhalten jeden
    Zustand ausser `""` auf, auch künftige.
  - **Aufsteigen an der Fensterkante** (klein, Abwägung seit Entscheid 40): Beim Auslösen steht
    erst der obere Teil des Rahmens im Bild; drei Viertel des schnellen Aufsteigens geschahen
    darunter, zu sehen war nur das langsame Ende. Jetzt beginnt der Ausschnitt an der
    Fensterkante (mit dem Zoom verrechnet), das ganze Aufsteigen ist zu sehen. Dazu öffnen sich
    Rahmen, die im untersten Streifen (unter der Schwelle) stehen bleiben, nach 300 ms Ruhe; sie
    blieben sonst bis zum nächsten Scrollen leer (Bestand). Gezählt wird die Ruhe, nicht die Zeit
    im Bild: Wer weiterscrollt, sieht das Bild erst an der Schwelle aufsteigen, über mehr Fläche.
  - **Porträt am Desktop** (mittel, Bestand seit `b23adb8`): Der Rahmen ist so hoch wie die Spalte
    daneben, das Foto war auf 44rem begrenzt: Darunter stand ein leeres Band von 148 px, die
    unteren Ecken lagen weiss auf weiss darin, und die Linie lief durch «Geschäftsleiter». Jetzt
    füllt das Foto den Rahmen bis zum Bildtext, Ecken und Linie liegen in der Zeile des Fotos.
  - **Kleinere:** Ohne Navigation API stand die Leiste von oben nach oben nicht mehr, sie blendete
    grau über (neu in `8a1073c`; betrifft Safari mit Übergängen zwischen Dokumenten): Die neue
    Seite setzt `stand` jetzt auch, wenn die Art des Wechsels unbekannt ist. Hat das Rad einen
    Sprung übernommen, holt Anhalten die Seite nicht mehr gegen das Rad zur Marke zurück. Setzt
    man im Hero fort, gleiten erste Zeile und Bild an ihren Punkt (`data-settling`, `--dur-3`),
    statt in einem Bild zu springen. Ein Foto, das nie kommt, lässt den Rahmen nach drei Sekunden
    wieder sandfarben stehen statt für immer leer. Eine angehaltene Seite aus dem bfcache
    überspringt ihren Übergang. Die Marke der Adresse wird dekodiert. Der e2e-Test zur Tastatur
    liest die Dauern wie CSS (eine kürzere Liste wiederholt sich). Die Zählung in `PROGRESS.md`
    zur vierten Runde ist berichtigt (drei neue Tests, sechs geschärft; die Commit-Nachricht von
    `ab7e9e9` nennt noch die alte Zahl).
  - **Bewusst nicht geändert** (`docs/TODO.md`): der Wettlauf zwischen erstem Bild und Skript
    (siehe oben); nach dem Fortsetzen im Hero steht man am Ende der angepinnten Strecke (die
    Ansicht bleibt, nur die Wirkung gleitet); Rahmen nebeneinander mit verschiedener Höhe öffnen
    sich nicht immer als eine Folge.
- **43.** **Restposten aus `docs/TODO.md`** (Auftrag des Repository-Inhabers vom 21.11.2026,
  ohne weitere Prüfrunde):
  - **Menüpunkt am Desktop** springt sofort, solange der Vorhang die Seite deckt; vorher glitt
    Lenis 1,7 s durch die Seite, zum Teil nach dem Vorhang. Gemessen: am Ziel ab dem ersten Bild.
  - **Leiste auf ganzen Pixeln:** Leiste und Navigation sind über die Ränder zentriert statt über
    `translateX(-50%)`; beim Seitenwechsel wirkt die Leiste nicht mehr weich.
  - **Rahmen nebeneinander** mit verschiedener Höhe öffnen sich als eine Folge: Öffnet sich ein
    Bild, folgen die Rahmen, die knapp unter ihrer Schwelle warten, als nächste Plätze.
  - **Ohne JavaScript** (`noscript.css`, nur über `<noscript>` geladen): Der Header scrollt mit
    der Seite weg, statt durchsichtig über dem Inhalt zu stehen, und auf schmalen Bildschirmen
    führt statt des Menü-Knopfs ein Link zur Navigation im Seitenende.
  - **Bewegungswächter** prüft gegen eine Positivliste der Eigenschaften und erkennt `linear`
    ausserhalb von Header und Band.
  - **Testserver** der e2e-Tests mit den Cache-Regeln der Produktion: Mit `no-store` brach
    Chromium Seitenübergänge mitunter ab und meldete das als Seitenfehler.
  - **Bewusst offen** (`docs/TODO.md`): der Wettlauf zwischen erstem Bild und Skript beim
    Seitenwechsel, die Lage nach dem Fortsetzen im Hero, der minimale Versatz des
    Bewegungsschalters, der Absturz von Chromium bei `getComputedStyle()` (Fehlerbericht), die
    Taste während des Ausgleitens; dazu alles, was Angaben des Auftraggebers oder echte Geräte
    braucht.
- **44.** **Alles läuft, nichts wird übersprungen** (Auftrag des Repository-Inhabers vom
  21.11.2026: kein übersprungener Test, alles richtig umgesetzt):
  - **Jeder e2e-Test läuft auf Desktop und Handy** und prüft dort, was das Gerät tut: Sprünge
    und Seitenwechsel auf dem Handy über das Menü (statt der Navigation in der Leiste), das Logo
    statt eines Navigationslinks als Fokus, der nicht angepinnte Hero, die Leertaste ohne Lenis,
    eigenes Scrollen nach einem Sprung. Die Prüfungen am rohen HTML laufen einmal im eigenen
    Projekt `html` (vorher auf dem Handy übersprungen), neu mit der Prüfung, dass Zoomen erlaubt
    bleibt (WCAG 1.4.4).
  - **Skript vor dem ersten Bild** (`early-script.mjs`, Build): Das Modul jeder Seite steht im
    `<head>` mit `blocking="render"`, was es einbindet mit `modulepreload`. Gemessen (Chromium,
    Seitenwechsel zu `/#kontakt`, ohne Cache): vorher in 10 von 25 Wechseln Seite erst oben,
    dann Sprung; jetzt 0 von 25, zurück zu einer Seite oben 0 von 10 ohne `stand`. Erstes Bild
    ohne Cache auf einem gedrosselten Handy (150 ms Latenz, 1,6 Mbit/s, CPU 4×): Startseite
    900 → 820 ms, Impressum 832 → 700 ms. Layoutverschiebung beim Laden mit Direktlink 0,031 →
    0, beim Neuladen bis 0,46 → 0. Geprüft und verworfen: `rel="expect"` (wirkt nicht auf den
    Wettlauf), `blocking="render"` am Ende des `<body>` (wirkt dort nicht). Der e2e-Test zum
    Seitenwechsel verwirft späte Versuche nicht mehr, er verlangt das Skript vor dem ersten Bild.
  - **Bewegungsschalter faltet sich** über `clip-path`, statt seine Breite zu ändern: keine
    Verschiebung mehr bei jedem Formwechsel des Headers (vorher 0,0009), und das Auffalten gleitet.
  - **Fokus im Formwechsel**: Im einen verborgenen Bild bleibt das fokussierte Bedienelement zu
    sehen (`visibility` statt `opacity`); der Test prüft auch dieses Bild.
  - **Taste während des Ausgleitens**: Das Ziel springt auf die aktuelle Lage, ohne Lenis
    anzuhalten (kein `overflow: clip` mehr, kein neues Layout); neuer e2e-Test.
  - **Bewegungswächter** erkennt auch Kurven als Schlüsselwort (`ease-in-out` am Equalizer, jetzt
    aus den Tokens).
  - **Bewusst offen** (`docs/TODO.md`): der sofortige Formwechsel bei reduzierter Bewegung zählt
    als kleine Verschiebung (sonst ein sichtbares Blinken), die Lage nach dem Fortsetzen im Hero
    (gestaltet, sie gleitet), der Absturz von Chromium bei einem bestimmten
    `getComputedStyle()` (nur in Testsonden, Fehlerbericht an Chromium).
- **45.** **Weniger Text, mehr Neugier, SEO 100** (Auftrag des Repository-Inhabers vom 21.11.2026:
  minimalistischer, elegant, kreativ, die Leute bei der Stange halten, 100 % SEO, saubere
  robots.txt). Vier Blickwinkel (Redaktion, Engagement, SEO, Bewegung) schlugen unabhängig
  dasselbe Prinzip vor: alles einmal sagen, eins zeigen, Neugier öffnet den Rest. Gemessen:
  sichtbarer Text der Startseite rund 980 → rund 560 Wörter, Seite auf dem Handy 13 337 →
  10 608 px, am Desktop 13 074 → 11 767 px; Lighthouse auf allen Seiten 100/100/100/100 (Handy
  und Desktop, CLS 0). Kein Wort erfunden; alle Kürzungen und Verschiebungen hier:
  - **Sortiment «Raum für Raum»**: Index der sieben Bereiche und eine Bühne mit einem Foto und
    seinem Text, «Nächster Raum», Direktlinks `#raum-…`. Texte unverändert; weiche Trennstriche
    in vier Namen (nur Anzeige).
  - **Firmengeschichte «Jahr für Jahr»**: Achse mit sechs Jahren, ein Moment, «Weiter: …» und am
    Ende «Zurück zu 1946», Direktlinks `#jahr-…`. Texte unverändert; die grosse Jahreszahl ist
    CSS (kein zweiter Text).
  - **Besuchszeile** statt Besuchs-Bühne: Status, Adresse, «Route planen», «Öffnungszeiten und
    Termin» (neuer Linktext). Gestrichen dort: «Im Zentrum von Baden, auf 6 Etagen und rund
    1200 m².» (steht im Hero und in der Firmengeschichte), die Öffnungszeiten (stehen im
    Kontakt), der Telefon-Knopf. Die beiden Sätze zum Termin wandern wörtlich in den Kontakt.
  - **Kontakt**: Status unter der Überschrift; ohne Formular stehen Termin, Öffnungszeiten und
    «Anrufen» im Feld der direkten Wege. Gestrichen: «Am schnellsten erreichen Sie uns direkt.»,
    «Rufen Sie an, schreiben Sie uns eine E-Mail oder besuchen Sie uns im Geschäft in Baden.»
    und die Knöpfe «E-Mail schreiben» und «Route planen» (beides steht in den Kontaktwegen
    daneben). Das Lager (Ringstrasse 13, 5432 Neuenhof) wandert aus «Über uns» in die
    Kontaktwege.
  - **Band**: ohne Kicker «Sortiment und Service» (bleibt als Name der Region) und ohne
    Überschrift «Alle Bereiche der Inneneinrichtung.» (steht im Lead des Sortiments), ohne die
    Etiketten «Sortiment», «Bodenbelag», «Service»; der Knopf ist rund (Name für Screenreader).
  - **Haltung**: nur die drei Sätze. Gestrichen: «Wann und wo Sie es wünschen: bei uns im
    Geschäft oder bei Ihnen zu Hause.», «Unser Ziel ist es, die für Sie richtige Lösung zu
    finden.», «Bei Lieferung und Montage stehen Pünktlichkeit, Sauberkeit, Sorgfalt und Ihre
    Zufriedenheit an oberster Stelle.» (wiederholten Hero, Service und Lieferung).
  - **Service**: Schritt «Beratung» endet nach «Wir hören zu.» (gestrichen: «und nehmen uns Zeit
    für Ihre Anliegen», sagt die Haltung). Lieferung als eine Aussage: «Sie bestimmen den exakten
    Lieferzeitpunkt, auch an einer Randzeit oder am Wochenende.» (zwei Punkte verbunden).
    Gestrichen: «Anstatt Ihr Wochenprogramm auf den Kopf zu stellen …», «Eigene Mitarbeiter
    liefern und montieren.» (steht im Schritt «Lieferung»), «Pünktlich, sauber und sorgfältig.»
    (ist ein Satz der Haltung). «Nebst Ersteinrichtungen …» wandert zu «Mehr über uns».
  - **Aktuell**: zwei Bildgeschichten, je ein Satz sichtbar, der Rest hinter «Mehr lesen» (im
    HTML). Beim 3D-Druck steht «Neu im Sortiment …» jetzt zuerst. Gestrichen: «Schauen Sie sich
    die Produkte in der Ausstellung an, berühren Sie sie und sitzen Sie Probe.» (sagt der Lead
    des Sortiments). Das Interview wandert zu «Über uns».
  - **Über uns «Gesicht und Stimme»**: neben dem Porträt Lead und das Zitat von Michael Längle
    (mit Quelle, Entscheid 25); Absatz, «Nebst Ersteinrichtungen …» und «Wir stehen für» hinter
    «Mehr über uns». Gestrichen: «Worauf es für einen guten und gesunden Schlaf wirklich ankommt,
    erklären wir Ihnen gerne persönlich in der Ausstellung.»
  - **Klammer**: Der Punkt des Öffnungsstatus atmet zweimal (Hero beim Laden, Kontakt mit dessen
    Auftritt); im Kontakt öffnet sich einmal eine grüne Scheibe wie die Blende im Hero.
  - **Nummern**: nur die Ziele des Menüs (01 Sortiment, 02 Service, 03 Aktuell, 04 Über uns,
    05 Kontakt), wie im Menü; Haltung und Projekte ohne Nummer. Vorher übersprang die Produktion
    die 04, und das Menü zählte anders als die Abschnitte.
  - **SEO**: H1 mit «Inneneinrichtung in Baden seit 1946» (aus dem Kicker im Footer
    «Inneneinrichtung in Baden» und «seit 1946»; vorher «Familienunternehmen in Baden seit 1946»
    ausserhalb der H1, «Familienunternehmen» steht weiter in der Überschrift von «Über uns»).
    Titel und Beschreibung passen ganz in den Treffer, «Teppiche» ist neu darin. Strukturierte
    Daten: Website ohne Wiederholung ihres Namens (Fehler), Geschäft als `FurnitureStore` und
    `HomeGoodsStore`, Kanton AG, Karte, Gründung 1946 und Gründer, «Teppiche und Heimtextilien»
    und «Innenarchitektur und Bauführung». Logo: Der Linkname steht im alt-Text (Linktext für
    Suchmaschinen). robots.txt nur mit `User-agent`, `Allow` und `Sitemap`. Nicht gemacht, weil
    Angaben fehlen: Koordinaten, Profile (sameAs), Bilder des Geschäfts in drei Formaten
    (`docs/TODO.md`). Kein `llms.txt`.
  - **Verworfen**: Haltung als CSS-Scroll-Zeitleiste (kein Gewinn auf echten Geräten belegt,
    Firefox ohne Wirkung), Kapitelnummer an der Fortschritts-Schiene (wenig Reichweite, nur
    Desktop), Text über den Fotos der Räume (verletzt die Regel «kein Text auf Bildern», wird bei
    200 % Text abgeschnitten).
- **46.** **Unser Team mit Fotos** (Auftrag des Repository-Inhabers vom 21.11.2026: die Fotos
  des Teams von luescherwohnen.ch übernehmen, wo es passt). Der Bestand der alten Website
  (`docs/ressources`) enthält kein Foto des Teams bei der Arbeit (Montage-Bild nur mit Werkzeug,
  «Kompetenz»-Bilder ohne Menschen, die Zunftwein-Bilder zeigen einen anderen Anlass und sind
  180 × 120 px). Die aktuelle Website (abgerufen am 21.11.2026) zeigt «Unser Team» mit vier
  Personen, Fotos von Michael Längle und Iris Längle, für Christina Stahl und Vlavono Macoso
  Platzhalter. Übernommen: Namen, Aufgaben und die zwei Fotos, neu kodiert (die alte Website war
  kompromittiert) und über `pnpm images` (Quelle `docs/ressources/website-2026/QUELLE.md`). Ort:
  «Über uns», zwischen Porträt und Firmengeschichte, als ruhige Reihe; ohne Foto die Initialen.
  Das grosse Porträt (Michael Längle bei der Arbeit vor Vorhangstoffen) bleibt: Es erzählt vom
  Geschäft, die Reihe von den Menschen. Michael Längle bleibt «Geschäftsleiter» wie im Impressum
  (Entscheid 23), obwohl die Website «Geschäftsführer» sagt (W3, `docs/TODO.md`). Die Website
  nennt Samstag 9:00 bis 16:00 Uhr (W1, die Demo zeigt weiter 10:00, Entscheid beim
  Auftraggeber).
