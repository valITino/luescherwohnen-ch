import { describe, expect, it } from 'vitest';
import { hours } from '../src/config/hours.ts';
import {
  clock,
  hoursFor,
  minutes,
  statusAt,
  statusText,
  zurichNow,
} from '../src/lib/opening-hours.ts';

/** Ortszeit Baden als Date (Winterzeit: UTC+1, Sommerzeit: UTC+2) */
const zurich = (iso: string, offset = '+01:00') => new Date(`${iso}${offset}`);

describe('Öffnungszeiten', () => {
  it('rechnet Zeiten in Minuten und zurück', () => {
    expect(minutes('10:00')).toBe(600);
    expect(minutes('18:30')).toBe(1110);
    expect(clock(1110)).toBe('18:30');
    expect(() => minutes('25:00')).toThrow();
    expect(() => minutes('10.00')).toThrow();
  });

  it('kennt jeden Wochentag genau einmal', () => {
    const days = hours.flatMap((row) => row.days).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('Montag und Sonntag geschlossen, Dienstag bis Samstag offen', () => {
    expect(hoursFor(hours, 1)).toBeNull();
    expect(hoursFor(hours, 0)).toBeNull();
    expect(hoursFor(hours, 2)).toEqual({ open: 600, close: 1110 });
    expect(hoursFor(hours, 6)).toEqual({ open: 600, close: 960 });
  });

  it('liest Wochentag und Uhrzeit in Zürich, auch über die Zeitumstellung', () => {
    // Dienstag, 24. November 2026, 09:59 in Baden = 08:59 UTC
    expect(zurichNow(new Date('2026-11-24T08:59:00Z'))).toEqual({ day: 2, minute: 599 });
    // Dienstag, 23. Juni 2026, 10:00 in Baden (Sommerzeit) = 08:00 UTC
    expect(zurichNow(new Date('2026-06-23T08:00:00Z'))).toEqual({ day: 2, minute: 600 });
  });

  it('meldet «geöffnet bis» während der Zeiten', () => {
    const status = statusAt(hours, zurich('2026-11-24T10:00:00'));
    expect(status).toEqual({ open: true, until: '18:30' });
    expect(statusText(status)).toBe('Geöffnet bis 18:30');
  });

  it('schliesst genau zur Schlusszeit', () => {
    const status = statusAt(hours, zurich('2026-11-24T18:30:00'));
    expect(status).toEqual({ open: false, next: { day: 3, at: '10:00', inDays: 1 } });
    expect(statusText(status)).toBe('Geschlossen · öffnet morgen 10:00');
  });

  it('vor der Öffnung am selben Tag: «öffnet heute»', () => {
    const status = statusAt(hours, zurich('2026-11-28T08:00:00'));
    expect(status).toEqual({ open: false, next: { day: 6, at: '10:00', inDays: 0 } });
    expect(statusText(status)).toBe('Geschlossen · öffnet heute 10:00');
  });

  it('am Samstagabend: nächste Öffnung am Dienstag', () => {
    const status = statusAt(hours, zurich('2026-11-28T16:00:00'));
    expect(status).toEqual({ open: false, next: { day: 2, at: '10:00', inDays: 3 } });
    expect(statusText(status)).toBe('Geschlossen · öffnet Dienstag 10:00');
  });

  it('am Montag: öffnet morgen', () => {
    const status = statusAt(hours, zurich('2026-11-23T12:00:00'));
    expect(statusText(status)).toBe('Geschlossen · öffnet morgen 10:00');
  });

  it('nur ein Öffnungstag pro Woche, nach Ladenschluss: nicht «heute», sondern in 7 Tagen', () => {
    const weekly = [{ label: 'Dienstag', days: [2] as const, hours: { open: 600, close: 720 } }];
    const status = statusAt(weekly, zurich('2026-11-24T13:00:00'));
    expect(status).toEqual({ open: false, next: { day: 2, at: '10:00', inDays: 7 } });
    expect(statusText(status)).toBe('Geschlossen · öffnet nächsten Dienstag 10:00');
  });

  it('ohne Öffnungszeiten: einfach geschlossen', () => {
    const status = statusAt([], zurich('2026-11-24T12:00:00'));
    expect(status).toEqual({ open: false, next: null });
    expect(statusText(status)).toBe('Geschlossen');
  });
});
