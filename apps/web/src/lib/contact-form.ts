/**
 * Regeln des Kontaktformulars: Normalisierung und Prüfung, ohne DOM.
 * Der Browser prüft damit für schnelle Rückmeldungen. Ein späterer Empfänger muss dieselben
 * Regeln serverseitig nochmals anwenden (CLAUDE.md, Abschnitt 4); dem Browser wird nie vertraut.
 */

export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  phone: { max: 40 },
  nachricht: { min: 10, max: 2000 },
} as const;

/** Anliegen zur Auswahl. Wert → Beschriftung */
export const ANLIEGEN = {
  beratung_geschaeft: 'Beratung im Geschäft',
  beratung_zuhause: 'Beratung bei mir zu Hause',
  innenarchitektur: 'Innenarchitektur',
  lieferung_montage: 'Lieferung und Montage',
  anderes: 'Etwas anderes',
} as const;

export type Anliegen = keyof typeof ANLIEGEN;

export type ContactField = 'name' | 'email' | 'phone' | 'anliegen' | 'nachricht' | 'datenschutz';

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  anliegen: string;
  nachricht: string;
  datenschutz: boolean;
  /** Honeypot: muss leer bleiben */
  website?: string;
}

export interface ContactData {
  name: string;
  email: string;
  phone: string | null;
  anliegen: Anliegen | null;
  nachricht: string;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

/** Steuerzeichen (ausser Zeilenumbruch und Tab) haben in einem Formular nichts verloren. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Ein Zeilenumbruch in Name, E-Mail oder Telefon wäre der Anfang einer Header Injection. */
const LINE_BREAK = /[\r\n]/;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^\+?[0-9 ()/.-]+$/;
/** Mindestens sechs Ziffern: Trennzeichen allein sind keine Telefonnummer. */
const enoughDigits = (value: string) => (value.match(/\d/g) ?? []).length >= 6;

const clean = (value: string) => value.replace(CONTROL, '').trim();
const oneLine = (value: string) => clean(value).replace(/\s+/g, ' ');

export function normalizeContact(input: ContactInput): ContactData {
  const anliegen = clean(input.anliegen);
  return {
    name: oneLine(input.name),
    email: oneLine(input.email).toLowerCase(),
    phone: oneLine(input.phone) || null,
    // Object.hasOwn statt `in`: Werte wie «toString» aus der Prototypkette gelten nicht.
    anliegen: Object.hasOwn(ANLIEGEN, anliegen) ? (anliegen as Anliegen) : null,
    nachricht: clean(input.nachricht.replace(/\r\n?/g, '\n')),
  };
}

/** Fehlermeldungen je Feld; leer, wenn alles stimmt. */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const data = normalizeContact(input);

  if (LINE_BREAK.test(input.name) || data.name.length < CONTACT_LIMITS.name.min) {
    errors.name = 'Bitte geben Sie Ihren Namen an.';
  } else if (data.name.length > CONTACT_LIMITS.name.max) {
    errors.name = `Bitte höchstens ${CONTACT_LIMITS.name.max} Zeichen.`;
  }

  if (!data.email) {
    errors.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
  } else if (
    LINE_BREAK.test(input.email) ||
    data.email.length > CONTACT_LIMITS.email.max ||
    !EMAIL.test(data.email)
  ) {
    errors.email = 'Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.ch.';
  }

  if (data.phone !== null) {
    if (
      LINE_BREAK.test(input.phone) ||
      data.phone.length > CONTACT_LIMITS.phone.max ||
      !PHONE.test(data.phone) ||
      !enoughDigits(data.phone)
    ) {
      errors.phone = 'Bitte prüfen Sie die Telefonnummer, zum Beispiel 056 000 00 00.';
    }
  }

  if (input.anliegen && data.anliegen === null) {
    errors.anliegen = 'Bitte wählen Sie ein Anliegen aus der Liste.';
  }

  if (data.nachricht.length < CONTACT_LIMITS.nachricht.min) {
    errors.nachricht = 'Bitte schreiben Sie uns kurz, worum es geht.';
  } else if (data.nachricht.length > CONTACT_LIMITS.nachricht.max) {
    errors.nachricht = `Bitte höchstens ${CONTACT_LIMITS.nachricht.max} Zeichen.`;
  }

  if (!input.datenschutz) {
    errors.datenschutz = 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.';
  }

  return errors;
}

/** Ein ausgefüllter Honeypot verrät einen Bot: dann still nichts senden. */
export const isBot = (input: ContactInput): boolean => Boolean(input.website?.trim());
