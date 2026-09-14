# Bestandsmaterial der alten Website

Dieser Ordner enthält ausschliesslich Material der bisherigen Website. Es ist
Beleg und Referenz für die Discovery, aber **keine Anforderungsquelle** und
**keine Produktionsbasis**. Die Anforderungen an die neue Website stammen
allein aus `docs/homepage-anforderungen.md` und den vom Auftraggeber
freigegebenen Entscheidungen.

| Inhalt | Beschreibung |
|---|---|
| `index.html`, `index-new.html` | Platzhalterseiten der Übergangszeit; `lang="en"`, fehlende Ressourcen |
| `Homepage.docx` | Beschreibung der alten Website: Farbwerte, Seitenstruktur, Impressum, AGB (20.08.2023) |
| `ressources/` | WordPress-Upload-Ordner mit 1 038 Dateien (287 MB); Inventar in `docs/bestandsinventar.md` |

## Warnung

`ressources/2026/08/contact_1787305442-1.zip` und `ressources/2026/08/f88a21ec.zip`
enthalten PHP-Schadcode (WordPress-Backdoor). Nicht entpacken, nicht ausführen,
nicht auf einen Webserver kopieren. Befund und Massnahmen:
`docs/security/2026-09-14-altwebsite-verdacht-kompromittierung.md`. Die
Entfernung aus Repository und Historie ist Entscheid `D-018`.

Bilder aus `ressources/` dürfen erst nach geklärten Rechten (`D-005`) auf der
neuen Website verwendet werden. Ausnahme: das firmeneigene Logo
`ressources/2021/02/Luescher_logo.png`, das als Ausgangsmaterial nach
`web/src/assets/images/logo.png` übernommen wurde.
