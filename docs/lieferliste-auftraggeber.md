# Lieferliste: Was von Menschen gebraucht wird

**Stand:** 16.09.2026
**Zweck:** Alle Angaben, Zugänge und Freigaben, die das Team nicht selbst
beschaffen darf, mit Zuständigkeit und Belegstelle. Abgeleitet aus dem
Entscheidungsregister (`docs/requirements-analysis.md`), der Inhaltsfreigabe
(`docs/content-freigabe.md`) und dem Code.
**Regel:** Nichts hier wird geraten. Solange ein Punkt offen ist, bleibt der
abhängige Schritt liegen oder trägt einen sichtbaren Entwurfshinweis.

## 1. Sofort: entsperrt die Bildveröffentlichung (Repository-Eigentümer)

Ohne diese drei Angaben publiziert `.github/workflows/publish-image.yml`
nichts; der Workflow prüft `vars.DOCKERHUB_NAMESPACE` und überspringt sich
selbst, wenn die Variable leer ist.

- [ ] **Docker-Hub-Namensraum** (Organisation oder Benutzerkonto) als
      GitHub-*Variable* `DOCKERHUB_NAMESPACE` unter Settings, Secrets and
      variables, Actions, Variables. Belegt in `publish-image.yml`, Zeilen 26
      und 55.
- [ ] **Zugangsdaten** als GitHub-*Secrets* `DOCKERHUB_USERNAME` und
      `DOCKERHUB_TOKEN`. Empfehlung: Zugriffstoken mit Schreibrecht nur für die
      zwei Repositories `luescherwohnen-web` und `luescherwohnen-kontakt`,
      nicht das Kontopasswort. Belegt in `publish-image.yml`, Zeilen 50 und 51.
- [ ] **Entscheid Sichtbarkeit und Freigabe** (`D-008`): private oder
      öffentliche Docker-Hub-Repositories, und ob das GitHub-Environment
      `docker-hub` eine Freigabepflicht (required reviewer) erhält. Das
      Environment wird von GitHub beim ersten Lauf automatisch angelegt; die
      Schutzregel muss ein Mensch setzen.

Veröffentlicht wird nur auf Release-Tags `vX.Y.Z`. Zum Auslösen genügt ein Tag
auf `main`, sobald die Werte gesetzt sind.

## 2. Vor dem ersten Deployment: der On-Prem-Server (`D-007`, `D-019`, `D-020`)

Zu beantworten vom Repository-Eigentümer oder von der Person, die den Server
administriert.

- [ ] **Betriebssystem und Version**, Version von Docker Engine und des
      Compose-Plugins (`docker compose version`).
- [ ] **CPU-Architektur.** Die Images werden aktuell nur für `linux/amd64`
      gebaut (`publish-image.yml`, Zeilen 65 und 84). Bei ARM bitte melden,
      dann wird mehrplattformig gebaut.
- [ ] **Ausgehender HTTPS-Zugang** zu Docker Hub vorhanden, allenfalls über
      welchen Proxy.
- [ ] **Deployment-Weg** (`D-020`): (A) self-hosted GitHub-Runner auf dem
      Server, nur ausgehende Verbindung, (B) Pull-Skript oder Timer auf dem
      Server, (C) SSH aus GitHub Actions mit eingehendem Zugang. Empfehlung: A.
- [ ] **Reverse-Proxy und TLS** (`D-019`): bestehender Proxy (welcher, wer
      pflegt die Zertifikate) oder ein im Compose-Stack mitgelieferter Proxy.
      Die Website hört bewusst nur auf `127.0.0.1:8080`
      (`deploy/compose.yml`, Zeile 12); HSTS gehört an die TLS-Stelle.
- [ ] **Verzeichnis und Zugang** für den Stack, zum Beispiel
      `/opt/luescherwohnen`, und wer dort Dateien ablegen darf.
- [ ] **Staging** gewünscht: ja oder nein, gleicher oder eigener Server.
- [ ] **Monitoring, Log-Aufbewahrung, Backup.** Es gibt keine Datenbank und
      keine persistenten Daten; ein Backup umfasst nur `compose.yml`, `.env`
      und `kontakt.env`.
- [ ] **Domain und geplanter Zeitpunkt der DNS-Umstellung.** Die DNS-Arbeit ist
      ein eigener Auftrag; für die Zertifikatsplanung wird nur der Zeitpunkt
      gebraucht.

## 3. Vor dem Livegang des Formulars: Mailzustellung (`D-003`, `D-013`)

Die Werte kommen in `deploy/kontakt.env` auf dem Server, niemals in das
Repository. Ohne sie startet der Dienst im Produktionsmodus nicht; die
Pflichtprüfung steht in `kontakt/lib/config.mjs`.

- [ ] **Empfängerpostfach** für Anfragen als `KONTAKT_EMPFAENGER`
      (Kandidat aus dem Bestand: `info@luescherwohnen.ch`, zu bestätigen).
- [ ] **Absenderadresse** als `KONTAKT_ABSENDER`, auf einer Domain des
      Unternehmens. Eine Freemail-Adresse als Absender scheitert an DMARC.
- [ ] **SMTP-Zugang** des Mailanbieters: `SMTP_HOST`, `SMTP_PORT`,
      `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASS`.
- [ ] **SPF- und DKIM-Einträge** für die Absenderdomain, damit die Anfragen
      nicht im Spam landen. Zuständig ist der Mailanbieter oder die
      DNS-Verwaltung.
- [ ] **Bearbeitung und Frist** (`D-013`): wer Anfragen beantwortet, in welcher
      Zeit, und ob eine Frist auf der Website genannt werden darf.
- [ ] **`KONTAKT_SECRET`** erzeugt der Repository-Eigentümer selbst, zum
      Beispiel mit `openssl rand -hex 32`. Mindestens 32 Zeichen.

## 4. Vor dem Launch: Inhalte, Medien und Rechte (Auftraggeber)

Jede Zeile entspricht einem offenen Eintrag in `docs/content-freigabe.md`.
Unbestätigte Angaben stehen bereits auf der Website und müssen vor der
Veröffentlichung bestätigt oder korrigiert werden.

- [ ] **Impressumsblock** (`D-001`): exakte Firmenbezeichnung und Rechtsform,
      Anschrift, Telefon, Geschäftsleitung, Handelsregistereintrag sowie die
      UID/MwSt-Nummer in korrekter Schreibweise. Der Bestand nennt
      "CHE 116.367.369"; die amtliche Schreibweise ist gegen den
      Handelsregisterauszug zu prüfen.
- [ ] **Faxnummer** +41 56 222 32 75: nur aufnehmen, wenn sie noch bedient wird.
- [ ] **Öffnungszeiten** bestätigen (`D-004`): Montag geschlossen, Dienstag bis
      Freitag 10:00 bis 18:30, Samstag 10:00 bis 16:00.
- [ ] **Standorte** (`D-004`): ein Standort oder mehrere. Die alte Website
      führte "Firmenstandorte" in der Mehrzahl.
- [ ] **Aussage "rund um die Uhr"** (`D-006`) klären, damit keine falsche
      Leistungszusage entsteht. Vorschlag auf der Website derzeit: "zu einem
      Termin, der Ihnen passt".
- [ ] **Sortimentstexte** bestätigen, insbesondere die Aufzählung der
      Bodenbeläge (Teppich, Parkett, Laminat, Vinyl, Kork).
- [ ] **Vektorlogo** (`D-005`) als SVG, AI, EPS oder PDF. Vorhanden ist nur ein
      PNG mit 765 × 190 Pixel. Ohne Vektor gibt es kein sauberes Favicon.
- [ ] **Farbe bestätigen:** Grün `#9cb703` als Marken- und Flächenfarbe. Als
      Textfarbe auf Weiss erreicht sie nur 2.29:1 und ist damit nicht
      barrierefrei; sie wird deshalb nur als Fläche mit dunkler Schrift genutzt.
- [ ] **Bildrechte je Lieferant** (`D-005`) schriftlich: de Sede, Ligne Roset,
      Création Baumann, Giroflex, Intertime, Naturokork, Keralux und weitere.
- [ ] **Einwilligungen** der abgebildeten Personen (Porträts) und der
      Kundschaft der Referenzprojekte.
- [ ] **Referenzprojekte** benennen, die veröffentlicht werden dürfen
      (WEB-F-006).
- [ ] **Teamtexte und Firmengeschichte**, falls "Über uns" mehr sagen soll.
- [ ] **Social-Media-Kanäle** (`D-010`): offizielle Profile mit URL. Geplant
      sind reine Links, keine eingebetteten Feeds.
- [ ] **URL-Liste der alten Website** (`D-011`) als Sitemap-Export oder
      Menüübersicht, für den Redirect-Plan. Die Live-Website beantwortet
      automatisierte Abrufe mit HTTP 403, deshalb kann das Team sie nicht
      selbst erheben.
- [ ] **Sprache** (`D-002`): Deutsch als einzige Sprache bestätigen.
- [ ] **Suche** (`D-009`): Empfehlung ist keine Suchfunktion im MVP.
- [ ] **Inhaltspflege ohne CMS** (`D-016`): Empfehlung sind Dateien im
      Repository über Pull Request mit Vorschau.
- [ ] **Performance-Ziele und Browser** (`D-012`) freigeben.
- [ ] **Bootstrap** (`D-015`): eingesetzt wird eine reduzierte, selbst
      gehostete Bootstrap-Teilmenge ohne CDN und ohne Bootstrap-JavaScript.
      Bestätigen, dass das den Wunsch aus dem Briefing erfüllt.

## 5. Externe Fachperson: Datenschutz und Recht

- [ ] **Datenschutzerklärung prüfen und ergänzen.** Die Seite trägt sichtbar
      den Hinweis "Entwurf" und darf so nicht live gehen. Zu ergänzen sind der
      Betreiber des Servers und die Aufbewahrungsdauer der Zugriffsprotokolle.
- [ ] **Meldepflicht prüfen** zum Sicherheitsvorfall der alten Website: ob eine
      Meldung an den EDÖB nach Art. 24 DSG oder eine Information der Betroffenen
      nötig ist.

## 6. Ausdrücklicher Auftrag nötig: Sicherheitsvorfall und Repository

Diese Schritte sind teils destruktiv und werden ohne ausdrückliche Anweisung
nicht ausgeführt (`CLAUDE.md`, Abschnitt 7).

- [ ] **Hoster informieren und Zugangsdaten wechseln** (`D-018`): WordPress,
      SFTP, Datenbank, Hosting-Kontrollpanel, verbundene Mailkonten.
- [ ] **Umgang mit der alten Website** entscheiden: abschalten, durch die
      Platzhalterseite ersetzen oder aus sauberem Stand neu aufsetzen.
- [ ] **Erlaubnis, die Schadcode-Archive zu entfernen** aus
      `old/ressources/2026/08/`, nach Sicherung als Beweismaterial.
- [ ] **Erlaubnis, die Git-Historie neu zu schreiben** (`D-017`, `D-018`). Das
      betrifft alle Forks und Klone und ist nicht umkehrbar.
- [ ] **Medienbestand entscheiden** (`D-017`): 1 038 Dateien mit 287 MB, davon
      890 reproduzierbare Grössenvarianten. Empfehlung: Varianten entfernen,
      Originale kuratieren, gegebenenfalls Git LFS.

## 7. Freigaben, die Gate G0 schliessen (Auftraggeber)

- [ ] **MVP-Umfang und Abnahmekriterien** schriftlich freigeben
      (`docs/requirements-analysis.md`, Abschnitt 2).
- [ ] **ADRs annehmen:** ADR-0001 Minimal-Stack, ADR-0002 Kontakt, Karte und
      Suche, ADR-0003 Container-Auslieferung. Alle drei stehen auf
      `Vorgeschlagen`.

Jede Antwort wird mit Datum, Entscheider und Wortlaut im Freigabeprotokoll
(`docs/requirements-analysis.md`, Abschnitt 8) festgehalten.

## 8. Später: Shop, Phase 2 (`D-014`)

Erst wenn der Shop beauftragt wird: Produktliste, Preise, Bestandsführung,
Zahlungsarten, Liefergebiete, Retouren und AGB-Prüfung durch eine Fachperson.
Nicht nötig, um das MVP zu starten.
