# Sicherheitsbefund: Verdacht auf kompromittierte Alt-Website

**Datum:** 14.09.2026
**Schweregrad:** Kritisch für die laufende alte Website; Hoch für dieses Repository
**Status:** Offen; Massnahmen liegen beim Auftraggeber und beim Hosting-Anbieter
**Gefunden durch:** Statische Prüfung des Bestandsmaterials (Inventar, Phase 0)
**Bezug:** `D-007`, `D-017`, `D-018`, Projektplan Phase 0 und Phase 3

## 1. Zusammenfassung

Der Medienexport der alten Website enthält im Ordner `docs/ressources/2026/08/`
zwei ZIP-Archive mit PHP-Code. Eines ist ein als Akismet-Plugin getarntes Paket
mit einer Backdoor, die beliebigen, per HTTP-Parameter übermittelten PHP-Code
auf dem Server ausführt. Das zweite enthält eine einzelne, stark verschleierte
PHP-Datei mit erfundenem Plugin-Kopf. Beide lagen im Upload-Ordner der
WordPress-Installation (Zeitstempel 04.08.2026 und 21.08.2026). Reguläre
Plugins liegen nie im Upload-Ordner. Der wahrscheinlichste Grund ist ein
unbefugter Zugriff auf die alte Website im August 2026.

Nichts davon wurde ausgeführt. Die Dateien wurden nur gelistet und gelesen.

## 2. Belege

| Datei im Repository | Inhalt | Merkmale |
|---|---|---|
| `docs/ressources/2026/08/contact_1787305442-1.zip` (133 KB) | Ordner `contact_1787305442/` mit 37 Dateien: Kopie des Akismet-Plugins 5.7 plus Fremddateien | Zufällig nummerierter Ordnername; Datei `lndex.php` (kleines L statt i) mit dem Marker `<!--tAO8m3LP-->`; Datei `abilities/page_template_1787305442.php` mit demselben Marker und der Backdoor; `.htaccess` |
| `docs/ressources/2026/08/f88a21ec.zip` (60 KB) | `scope-router-edge/scope-router-edge.php` (190 KB, 5 281 Zeilen, Zeilen bis 23 064 Zeichen) | Plugin-Kopf "Scope Router Edge" mit nicht verifizierbarer GitHub-Adresse; eigene Zeichen-Ersetzungstabelle, `gzinflate`, Auswertung von `$_REQUEST`; Code ist unlesbar verschleiert |

Funktionsweise der Backdoor in `page_template_1787305442.php` (aus dem Quelltext
gelesen): Wenn der HTTP-Parameter `entity` gesetzt ist, wird sein Wert Zeichen
für Zeichen dekodiert, in ein beschreibbares Verzeichnis (Session-Pfad,
`/tmp`, `/dev/shm`, Arbeitsverzeichnis und weitere) als Datei `.item`
geschrieben, per `require` ausgeführt und danach gelöscht. Das ist eine
vollständige Remote-Code-Execution ohne Authentisierung.

Der übrige Bestand wurde am 14.09.2026 geprüft: Bei allen 1 036 Bild-, Audio-
und PDF-Dateien stimmt der Dateityp mit der Endung überein, keine enthält
PHP-Code, das PDF enthält keine aktiven Inhalte. Ein Secret-Scan (gitleaks
8.30.1) über die gesamte Git-Historie und das Arbeitsverzeichnis fand keine
Zugangsdaten.

## 3. Auswirkungen

- **Alte Website:** Wer die Backdoor kennt, kann auf dem Webserver beliebigen
  Code ausführen, Inhalte verändern, Besucherinnen und Besucher umleiten,
  Spam versenden oder Daten der Kontaktformulare und des Shops auslesen.
- **Repository:** Jeder Klon verteilt den Schadcode weiter. Wer die Archive
  entpackt und auf einen PHP-Server kopiert, öffnet diesen Server.
- **Projekt:** Server-seitiges Material der alten Website (Code, Plugins,
  Konfiguration, Datenbank) darf nicht in den Relaunch übernommen werden.
  Medien gelten erst nach Typprüfung als unbedenklich; diese Prüfung ist
  für den aktuellen Bestand erfolgt.

## 4. Empfohlene Sofortmassnahmen (Auftraggeber und Hosting-Anbieter)

1. Den Hosting-Anbieter (Green) informieren und um eine Prüfung der
   Installation bitten: Webroot nach dem Marker `tAO8m3LP`, nach `.item`,
   nach fremden Dateien in `wp-content/uploads/` und nach weiteren Web-Shells
   durchsuchen; Zugriffs- und FTP-Protokolle ab Juli 2026 sichern.
2. Alle Zugangsdaten wechseln: WordPress-Benutzer, SFTP/FTP, Datenbank,
   Hosting-Kontrollpanel, verbundene E-Mail-Konten; Zwei-Faktor-Authentisierung
   aktivieren, wo verfügbar.
3. Die alte Website nicht "reinigen", sondern aus einem sauberen Stand neu
   aufsetzen oder bis zum Relaunch durch die bereits vorhandene Platzhalterseite
   ersetzen. Backups aus dem Zeitraum vor Juli 2026 sichern.
4. Prüfen lassen, ob personenbezogene Daten (Kontaktanfragen, Shop-Bestellungen,
   Kundenkonten) betroffen sein können, und ob eine Meldung an den EDÖB nach
   Art. 24 DSG oder eine Information der Betroffenen nötig ist. Diese Prüfung
   gehört zu einer qualifizierten Fachperson (`privacy-legal-reviewer`
   bereitet die Unterlagen vor).
5. Zugangsdaten niemals in dieses Repository oder in Issues schreiben.

## 5. Massnahmen im Repository (Entscheid `D-018`)

Die Archive werden erst nach ausdrücklichem Auftrag des Repository-Eigentümers
entfernt, weil das Löschen fremder Beiträge und das Neuschreiben der Historie
laut `CLAUDE.md` einen Auftrag brauchen und die Dateien als Beweismittel für
den Hosting-Anbieter dienen können. Empfohlene Reihenfolge:

1. Kopie der beiden Archive an einem gesicherten Ort ausserhalb des
   Repositories für die Vorfallbearbeitung aufbewahren.
2. Archive aus dem Arbeitsstand entfernen:

   ```bash
   git rm docs/ressources/2026/08/contact_1787305442-1.zip docs/ressources/2026/08/f88a21ec.zip
   git commit -m "fix: remove malicious archives from legacy website export"
   ```

3. Historie bereinigen (destruktiv, betrifft alle Forks; mit `git filter-repo`
   auf einem frischen Klon, danach `--force`-Push und Neu-Klonen durch alle
   Beteiligten), idealerweise zusammen mit der Bereinigung des Medienbestands
   aus `D-017`.
4. Bis dahin: Archive nicht entpacken, `docs/ressources/` nicht auf Server
   kopieren, keine PHP-Umgebung mit diesem Repository verbinden.

## 6. Prüfprotokoll

| Prüfung | Befehl (sinngemäss) | Ergebnis |
|---|---|---|
| Archivinhalt listen | `unzip -l <archiv>` | 37 beziehungsweise 1 PHP-Datei, keine Medien |
| Backdoor lesen | Textausgabe der Datei ohne Ausführung | Dekodierung von `$_REQUEST["entity"]`, `file_put_contents`, `require`, `unlink` |
| Verschleierung prüfen | Zeilenlängen, Funktionsaufrufe zählen | 2 × `gzinflate`, 3 × `$_REQUEST`, Ersetzungstabelle, Zeilen bis 23 064 Zeichen |
| Medienintegrität | `file --mime-type` je Datei, `grep '<?php'`, PDF-Marker | keine Abweichung |
| Secret-Scan | `gitleaks git` und `gitleaks dir` (8.30.1) | keine Funde |
