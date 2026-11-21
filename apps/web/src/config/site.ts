/**
 * Zentrale Konfiguration von luescherwohnen.ch: Adressen, Navigation, Kontakt, Öffnungszeiten.
 *
 * Nur Angaben, die im Repository belegt sind (Quelle steht jeweils dabei). Was noch zu bestätigen
 * ist, steht in docs/TODO.md und im Entscheidungsregister (docs/requirements-analysis.md).
 * Diese Datei nur serverseitig (Astro-Frontmatter) importieren.
 */
import { joinPath, resolveSites, splitSiteUrl } from '@luescher/config/sites';

export const sites = resolveSites(import.meta.env, { dev: import.meta.env.DEV });

const { site: origin, base } = splitSiteUrl(sites.web);

/** Basis-Pfad ohne Slash am Ende ('' in Produktion, z. B. '/luescherwohnen-ch' in der Vorschau) */
export const basePath = base;

/** Link innerhalb der Website, inklusive Basis-Pfad */
export const href = (path = '/') => joinPath(base, path);

/** Absolute Adresse, z. B. für Canonical und Open Graph */
export const absoluteUrl = (path = '/') => new URL(href(path), origin).href;

// ---------------------------------------------------------------- Bereiche

/**
 * «Projekte» (Referenzen) erscheinen nur mit freigegebenen Inhalten (WEB-F-006, D-005):
 * in der Vorschau immer, in Produktion erst mit PUBLIC_SHOW_PROJECTS=true.
 */
export const showProjects = sites.preview || import.meta.env.PUBLIC_SHOW_PROJECTS === 'true';

// ---------------------------------------------------------------- Navigation

export const nav = [
  { label: 'Sortiment', hash: '#sortiment' },
  { label: 'Service', hash: '#service' },
  { label: 'Aktuell', hash: '#aktuell' },
  { label: 'Über uns', hash: '#ueber' },
  { label: 'Kontakt', hash: '#kontakt' },
] as const;

/** Primärer CTA. `onHome`: Ankerlink ohne Seitenwechsel. */
export const primaryCta = (onHome = true) => ({
  label: 'Beratung anfragen',
  href: onHome ? '#kontakt' : href('/#kontakt'),
});

// ---------------------------------------------------------------- Firma und Kontakt

/**
 * Quelle: Impressum der bisherigen Website (docs/Homepage.docx) und docs/index.html.
 * Aktualität und Veröffentlichung bestätigen: D-001, D-003, D-004.
 */
export const company = {
  name: 'Lüscher Wohnen AG',
  short: 'Lüscher Wohnen',
  street: 'Weite Gasse 9',
  zip: '5400',
  city: 'Baden',
  country: 'Schweiz',
  countryCode: 'CH',
  /** Anzeige und Link (E.164) */
  phone: { label: '+41 56 222 78 52', tel: '+41562227852' },
  fax: '+41 56 222 32 75',
  email: 'info@luescherwohnen.ch',
  management: 'Michael Längle',
  register: 'Handelsregister des Kantons Aargau',
  vat: 'CHE 116.367.369',
} as const;

export const addressLine = `${company.street}, ${company.zip} ${company.city}`;

/**
 * Karte ohne Einbettung (D-004): ein gewöhnlicher Link zu OpenStreetMap. Erst wer klickt,
 * verlässt die Website; vorher fliessen keine Daten an Dritte.
 */
export const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
  `${company.street}, ${company.zip} ${company.city}`,
)}`;

export { hours } from './hours.ts';

// ---------------------------------------------------------------- Meta

export const meta = {
  /**
   * Titel der Startseite: zuerst, worum es geht (Angebot und Ort), am Schluss die Marke. Passt
   * ganz in den Treffer (rund 600 px).
   */
  homeTitle: 'Möbel, Betten und Innenarchitektur in Baden – Lüscher Wohnen',
  /** Das Wichtigste zuerst: Suchmaschinen kürzen nach rund 155 Zeichen. */
  defaultDescription:
    'Möbel, Betten, Bodenbeläge, Teppiche, Vorhänge und Lampen in Baden. Beratung im Geschäft und bei Ihnen zu Hause, Lieferung und Montage.',
  ogImage: '/og/luescher.png',
} as const;

// ---------------------------------------------------------------- Angaben für Suchmaschinen

export const brand = {
  home: absoluteUrl('/'),
  name: company.name,
  alternateName: ['Lüscher Wohnen', 'luescherwohnen.ch'],
  description: meta.defaultDescription,
  logo: { url: absoluteUrl('/icon-512.png'), size: 512 },
  areaServed: { name: 'Schweiz', code: 'CH' },
  knowsAbout: [
    'Möbel und Polstermöbel',
    'Betten und Bettwaren',
    'Bodenbeläge',
    'Teppiche und Heimtextilien',
    'Vorhänge und Vorhangsysteme',
    'Beleuchtung',
    'Innenarchitektur und Bauführung',
  ],
  /** Gründung und Gründer: sichtbar in der Firmengeschichte (Über uns). */
  foundingDate: '1946',
  founders: ['Hans Lüscher', 'Arthur Lüscher'],
  email: company.email,
  telephone: company.phone.tel,
} as const;
