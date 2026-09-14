// Serverseitige Validierung der Formularfelder. Reine Funktionen, keine I/O.
// Steuerzeichen (ausser Zeilenumbruch und Tabulator) werden abgelehnt.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMAIL = /^[^\s@<>"'(),:;[\]\\]+@[^\s@<>"'(),:;[\]\\]+\.[A-Za-z]{2,}$/;
const TELEFON = /^\+?[0-9 ()/.-]{6,30}$/;

export const FELDER = ["name", "email", "telefon", "nachricht"];
export const HONEYPOT = "firma_website";

function text(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim().slice(0, max + 1);
}

export function validateAnfrage(fields) {
  const values = {
    name: text(fields.name, 100),
    email: text(fields.email, 254).replace(/\s+/g, ""),
    telefon: text(fields.telefon, 30),
    nachricht: text(fields.nachricht, 2000),
  };
  const errors = {};
  if (values.name.length < 2) {
    errors.name = "Bitte geben Sie Ihren Namen an.";
  } else if (values.name.length > 100 || CONTROL.test(values.name) || values.name.includes("\n")) {
    errors.name = "Der Name darf höchstens 100 Zeichen lang sein und keine Zeilenumbrüche enthalten.";
  }
  if (values.email && (values.email.length > 254 || !EMAIL.test(values.email))) {
    errors.email = "Bitte prüfen Sie die E-Mail-Adresse.";
  }
  if (values.telefon && !TELEFON.test(values.telefon)) {
    errors.telefon = "Bitte prüfen Sie die Telefonnummer (nur Ziffern, Leerzeichen und + / - erlaubt).";
  }
  if (!values.email && !values.telefon) {
    const meldung = "Bitte geben Sie eine E-Mail-Adresse oder eine Telefonnummer an.";
    errors.email = errors.email ?? meldung;
    errors.telefon = errors.telefon ?? meldung;
  }
  if (values.nachricht.length < 10) {
    errors.nachricht = "Bitte beschreiben Sie Ihr Anliegen mit mindestens 10 Zeichen.";
  } else if (values.nachricht.length > 2000 || CONTROL.test(values.nachricht)) {
    errors.nachricht = "Die Nachricht darf höchstens 2000 Zeichen lang sein.";
  }
  return { ok: Object.keys(errors).length === 0, values, errors };
}

export function istFalleGefuellt(fields) {
  return typeof fields[HONEYPOT] === "string" && fields[HONEYPOT].trim() !== "";
}
