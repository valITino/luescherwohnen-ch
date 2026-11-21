/**
 * Öffnungszeiten des Geschäfts in Baden.
 * Quelle: docs/index.html (Übergangsseite im Repository) und die aktuelle Website. Am Samstag
 * öffnet das Geschäft um 9:00 Uhr: so steht es auf luescherwohnen.ch (abgerufen am 21.11.2026),
 * und so hat es der Repository-Inhaber am 21.11.2026 entschieden (Widerspruch W1 gelöst,
 * docs/DECISIONS.md 47; die Übergangsseite nannte 10:00 Uhr). «Sonntag geschlossen» stammt von
 * der Website. Feiertage und Betriebsferien sind offen (D-004).
 * Reine Daten: darf auch im Browser-Code importiert werden (hero.ts).
 */
import { minutes, type HoursRow } from '../lib/opening-hours.ts';

export const hours: readonly HoursRow[] = [
  { label: 'Montag', days: [1], hours: null },
  {
    label: 'Dienstag bis Freitag',
    days: [2, 3, 4, 5],
    hours: { open: minutes('10:00'), close: minutes('18:30') },
  },
  { label: 'Samstag', days: [6], hours: { open: minutes('09:00'), close: minutes('16:00') } },
  { label: 'Sonntag', days: [0], hours: null },
];
