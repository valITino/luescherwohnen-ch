/**
 * Öffnungszeiten des Geschäfts in Baden.
 * Quelle: docs/index.html (Übergangsseite, neuester Stand im Repository). Die frühere Website
 * nannte am Samstag 9:00 statt 10:00 Uhr (Widerspruch W1, docs/TODO.md); «Sonntag geschlossen»
 * stammt von dort. Aktualität bestätigen (D-004).
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
  { label: 'Samstag', days: [6], hours: { open: minutes('10:00'), close: minutes('16:00') } },
  { label: 'Sonntag', days: [0], hours: null },
];
