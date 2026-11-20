/**
 * Öffnungszeiten und der Status «jetzt geöffnet / geschlossen».
 * Ohne DOM, damit sich die Regeln einzeln prüfen lassen (test/opening-hours.test.ts).
 *
 * Grundlage sind nur die veröffentlichten Zeiten (docs/index.html). Feiertage und Betriebsferien
 * kennt die Website nicht (docs/TODO.md): Darum sagt die Anzeige «laut Öffnungszeiten».
 */

/** 0 = Sonntag … 6 = Samstag, wie `Date.getDay()` */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  /** Minuten seit Mitternacht */
  open: number;
  close: number;
}

/** Eine Zeile der Tabelle, wie sie auf der Website steht */
export interface HoursRow {
  label: string;
  /** Tage dieser Zeile */
  days: readonly Weekday[];
  /** `null`: geschlossen */
  hours: DayHours | null;
}

export const minutes = (time: string): number => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Ungültige Zeit: ${time}`);
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) throw new Error(`Ungültige Zeit: ${time}`);
  return hours * 60 + mins;
};

/** «10:00» aus Minuten seit Mitternacht */
export const clock = (value: number): string =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

/** Wochentag und Minuten in der Zeitzone von Baden (Europe/Zurich) */
export function zurichNow(date: Date): { day: Weekday; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days.indexOf(get('weekday'));
  return {
    day: (day < 0 ? 0 : day) as Weekday,
    minute: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** `inDays`: in wie vielen Tagen die nächste Öffnung ist (0 = heute) */
export type OpenStatus =
  | { open: true; until: string }
  | { open: false; next: { day: Weekday; at: string; inDays: number } | null };

/** Tage ohne Angabe gelten als geschlossen. */
export function hoursFor(rows: readonly HoursRow[], day: Weekday): DayHours | null {
  return rows.find((row) => row.days.includes(day))?.hours ?? null;
}

/** Ist laut Tabelle gerade geöffnet? Sonst: wann öffnet es das nächste Mal? */
export function statusAt(rows: readonly HoursRow[], date: Date): OpenStatus {
  const { day, minute } = zurichNow(date);
  const today = hoursFor(rows, day);
  if (today && minute >= today.open && minute < today.close) {
    return { open: true, until: clock(today.close) };
  }
  for (let offset = 0; offset <= 7; offset += 1) {
    const next = ((day + offset) % 7) as Weekday;
    const hours = hoursFor(rows, next);
    if (!hours) continue;
    if (offset === 0 && minute >= hours.open) continue;
    return { open: false, next: { day: next, at: clock(hours.open), inDays: offset } };
  }
  return { open: false, next: null };
}

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
};

/** Kurzer Satz für die Anzeige, z. B. «Geöffnet bis 18:30» oder «Geschlossen · öffnet Dienstag 10:00» */
export function statusText(status: OpenStatus): string {
  if (status.open) return `Geöffnet bis ${status.until}`;
  if (!status.next) return 'Geschlossen';
  const when =
    status.next.inDays === 0
      ? 'heute'
      : status.next.inDays === 1
        ? 'morgen'
        : status.next.inDays === 7
          ? `nächsten ${WEEKDAY_NAMES[status.next.day]}`
          : WEEKDAY_NAMES[status.next.day];
  return `Geschlossen · öffnet ${when} ${status.next.at}`;
}
