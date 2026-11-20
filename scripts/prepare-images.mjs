// Übernimmt ausgewählte Fotos aus dem Bestand der bisherigen Website (docs/ressources) in die App.
// Jedes Bild wird neu kodiert: Metadaten (EXIF, GPS, Kamera) fallen weg, Grösse und Ausschnitt
// sind festgelegt. Astro erzeugt beim Build daraus AVIF/WebP in mehreren Breiten.
//
// Nutzungsrechte sind noch zu bestätigen (D-005, docs/TODO.md). Aus docs/ressources werden nur
// Bilddateien gelesen, nie ZIP-, PHP- oder HTML-Dateien (Sicherheitsbefund in docs/TODO.md).
//
// Aufruf: pnpm images
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = (path) => resolve(root, 'docs/ressources', path);
const target = resolve(root, 'apps/web/src/assets/photos');
mkdirSync(target, { recursive: true });

/**
 * name: Zieldatei (ohne Endung). crop: Ausschnitt im Original { left, top, width, height }.
 * width: Breite des Ergebnisses. note: wozu und woher (für die Doku).
 */
const PHOTOS = [
  {
    name: 'hero-liege',
    file: '2024/01/main_slider_liege_gruen_original_1920_600_300px.jpg',
    crop: { left: 460, top: 0, width: 600, height: 600 },
    width: 600,
    note: 'Hero, runde Bühne: grüne Liege (Herstellerbild, Slider der bisherigen Website)',
  },
  {
    name: 'sortiment-moebel',
    file: '2023/07/referenz-2018-06-gesamtkonzept-wohn-essraum-bergdietikon-002-1000x1000px.jpg',
    width: 1000,
    note: 'Sortiment Möbel: Esstisch mit Stühlen (eigenes Referenzfoto)',
  },
  {
    name: 'sortiment-polstermoebel',
    file: '2024/01/main_slider_marlo_gioia_seidengrau_original_1920_600_300px.jpg',
    crop: { left: 600, top: 0, width: 600, height: 600 },
    width: 600,
    note: 'Sortiment Polstermöbel: Ecksofa (Herstellerbild, Slider)',
  },
  {
    name: 'sortiment-betten',
    file: '2021/02/referenz-2020-02-ausbau-dachstock-einfamilienhaus-otelfingen-001-1000x1000px.jpg',
    width: 1000,
    note: 'Sortiment Betten: Dachzimmer mit Bett (eigenes Referenzfoto)',
  },
  {
    name: 'sortiment-boden',
    file: '2021/02/referenz-2020-04-neuer-treppenbelag-003-1000x1000px.jpg',
    width: 1000,
    note: 'Sortiment Bodenbeläge: Treppe mit Teppichbelag (eigenes Referenzfoto)',
  },
  {
    name: 'sortiment-teppiche',
    file: '2021/02/referenz-2021-09-wohnzimmer-003-1000x1000px.jpg',
    width: 1000,
    note: 'Sortiment Teppiche: Ecksofa mit Patchwork-Teppich (eigenes Referenzfoto)',
  },
  {
    name: 'sortiment-vorhaenge',
    file: '2023/05/vorhaenge-creation-baumann-linen-and-friends-1000x1000px.jpg',
    width: 1000,
    note: 'Sortiment Vorhänge: Essbereich mit Vorhängen (Herstellerbild Creation Baumann)',
  },
  {
    name: 'sortiment-leuchten',
    file: '2021/11/baltensweiler-ZU-Gruppe-3-1000-1000px.png',
    width: 1000,
    flatten: true,
    note: 'Sortiment Beleuchtung: Leuchten ZETT (Herstellerbild Baltensweiler)',
  },
  {
    name: 'aktuell-3d-druck',
    file: '2025/10/3D-Druck-2.jpg',
    crop: { left: 0, top: 200, width: 1200, height: 1200 },
    width: 1000,
    note: 'Aktuell «Es geht auch anders»: 3D-gedruckte Möbel in der Ausstellung',
  },
  {
    name: 'aktuell-klangboxen',
    file: '2024/03/3000_Senn-rot_Huuri_Tannenzapfen_high-res_1000_1000.jpg',
    width: 1000,
    note: 'Aktuell «Entspannen und Energie tanken»: Klangboxen Senn und Huuri (Fotograf laut EXIF)',
  },
  {
    name: 'projekt-wohn-essbereich',
    file: '2023/08/referenz-2009-04-neugestaltung-wohn-essbereich-009-1000-1000.jpg',
    width: 1000,
    note: 'Projekt: Neugestaltung Wohn- und Essbereich (2009)',
  },
  {
    name: 'projekt-hobbyraum',
    file: '2021/12/referenz-2021-12-hobbyraum-bergdietikon-002-1000x1000px.jpg',
    width: 1000,
    note: 'Projekt: Hobbyraum (2021)',
  },
  {
    name: 'projekt-wohnzimmer',
    file: '2021/02/referenz-2021-09-wohnzimmer-001-1000x1000px.jpg',
    width: 1000,
    note: 'Projekt: Wohnzimmer (2021)',
  },
  {
    name: 'projekt-gesamtkonzept',
    file: '2023/07/referenz-2018-06-gesamtkonzept-wohn-essraum-bergdietikon-001-1000x1000px.jpg',
    width: 1000,
    note: 'Projekt: Gesamtkonzept Wohn- und Essraum (2018)',
  },
  {
    name: 'portrait-hans-luescher',
    file: '2021/02/LuescherHansPortrait.png',
    width: 390,
    flatten: true,
    grayscale: true,
    note: 'Firmengeschichte: Hans Lüscher (historisches Zeitungsporträt)',
  },
  {
    name: 'portrait-bruno-laengle',
    file: '2021/02/LaengleBrunoPortrait.png',
    width: 388,
    flatten: true,
    grayscale: true,
    note: 'Firmengeschichte: Bruno Längle (historisches Zeitungsfoto)',
  },
  {
    name: 'portrait-michael-laengle',
    file: '2021/02/20150511-Mitarbeiter-LaengleMichael.jpg',
    width: 800,
    note: 'Firmengeschichte und Über uns: Michael Längle (2015)',
  },
];

for (const photo of PHOTOS) {
  let image = sharp(source(photo.file)).rotate();
  if (photo.crop) image = image.extract(photo.crop);
  if (photo.flatten) image = image.flatten({ background: '#ffffff' });
  if (photo.grayscale) image = image.grayscale();
  image = image.resize({ width: photo.width, withoutEnlargement: true });
  const out = resolve(target, `${photo.name}.jpg`);
  // Ohne withMetadata(): sharp schreibt keine EXIF-/GPS-Daten. sRGB für alle Browser.
  const info = await image
    .toColourspace('srgb')
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(out);
  console.log(
    `${photo.name}.jpg  ${info.width}×${info.height}  ${(info.size / 1000).toFixed(0)} kB`,
  );
}
