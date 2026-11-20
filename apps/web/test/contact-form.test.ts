import { describe, expect, it } from 'vitest';
import {
  ANLIEGEN,
  CONTACT_LIMITS,
  isBot,
  normalizeContact,
  validateContact,
  type ContactInput,
} from '../src/lib/contact-form.ts';

/** Synthetische Beispieldaten, keine echte Person */
const valid: ContactInput = {
  name: 'Erika Muster',
  email: 'Erika.Muster@Beispiel.ch',
  phone: '056 000 00 00',
  anliegen: 'beratung_zuhause',
  nachricht: 'Wir suchen ein neues Sofa für das Wohnzimmer.',
  datenschutz: true,
};

describe('Kontaktformular', () => {
  it('akzeptiert eine vollständige Anfrage', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('Telefon und Anliegen sind freiwillig', () => {
    expect(validateContact({ ...valid, phone: '', anliegen: '' })).toEqual({});
  });

  it('normalisiert: trimmt, E-Mail klein, leere Felder als null', () => {
    expect(normalizeContact({ ...valid, name: '  Erika   Muster ', phone: ' ' })).toEqual({
      name: 'Erika Muster',
      email: 'erika.muster@beispiel.ch',
      phone: null,
      anliegen: 'beratung_zuhause',
      nachricht: valid.nachricht,
    });
  });

  it('meldet fehlende Pflichtfelder mit verständlichen Sätzen', () => {
    const errors = validateContact({
      name: '',
      email: '',
      phone: '',
      anliegen: '',
      nachricht: '',
      datenschutz: false,
    });
    expect(Object.keys(errors).sort()).toEqual(['datenschutz', 'email', 'nachricht', 'name']);
    for (const message of Object.values(errors)) expect(message).toMatch(/^Bitte /);
  });

  it('erkennt ungültige E-Mail-Adressen', () => {
    for (const email of ['erika', 'erika@', 'erika@beispiel', 'a b@beispiel.ch', 'x@y.c']) {
      expect(validateContact({ ...valid, email }).email, email).toBeDefined();
    }
  });

  it('blockiert Zeilenumbrüche in Kopfzeilen-Feldern (Header Injection)', () => {
    expect(validateContact({ ...valid, name: 'Erika\r\nBcc: x@y.ch' }).name).toBeDefined();
    expect(validateContact({ ...valid, email: 'x@y.ch\nBcc: z@y.ch' }).email).toBeDefined();
    expect(validateContact({ ...valid, phone: '056\n000' }).phone).toBeDefined();
  });

  it('entfernt Steuerzeichen, behält Zeilenumbrüche in der Nachricht', () => {
    const data = normalizeContact({ ...valid, nachricht: 'Zeile 1\r\nZeile\u0007 2' });
    expect(data.nachricht).toBe('Zeile 1\nZeile 2');
  });

  it('prüft Längen', () => {
    const long = 'a'.repeat(CONTACT_LIMITS.nachricht.max + 1);
    expect(validateContact({ ...valid, nachricht: long }).nachricht).toMatch(/höchstens/);
    expect(validateContact({ ...valid, nachricht: 'kurz' }).nachricht).toBeDefined();
    expect(validateContact({ ...valid, name: 'E' }).name).toBeDefined();
  });

  it('nimmt nur Anliegen aus der Liste, nichts aus der Prototypkette', () => {
    expect(validateContact({ ...valid, anliegen: 'drop table' }).anliegen).toBeDefined();
    for (const value of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      expect(validateContact({ ...valid, anliegen: value }).anliegen, value).toBeDefined();
      expect(normalizeContact({ ...valid, anliegen: value }).anliegen, value).toBeNull();
    }
    for (const key of Object.keys(ANLIEGEN)) {
      expect(validateContact({ ...valid, anliegen: key }).anliegen).toBeUndefined();
    }
  });

  it('prüft Telefonnummern grob', () => {
    expect(validateContact({ ...valid, phone: '+41 56 000 00 00' }).phone).toBeUndefined();
    expect(validateContact({ ...valid, phone: 'ruf mich an' }).phone).toBeDefined();
    expect(validateContact({ ...valid, phone: '------' }).phone).toBeDefined();
    expect(validateContact({ ...valid, phone: '056 (000) 00-00' }).phone).toBeUndefined();
  });

  it('erkennt Bots am ausgefüllten Honeypot', () => {
    expect(isBot(valid)).toBe(false);
    expect(isBot({ ...valid, website: 'https://spam.example' })).toBe(true);
  });
});
