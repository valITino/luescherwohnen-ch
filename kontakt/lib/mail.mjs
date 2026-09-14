// Zustellung der Anfrage per E-Mail (SMTP) oder als Protokollzeile für
// Entwicklung und CI. Personendaten werden nur im Log-Modus geschrieben.
import { appendFile } from "node:fs/promises";
import nodemailer from "nodemailer";

export function formatMailText(values, sentAt = new Date()) {
  return [
    "Neue Anfrage über das Kontaktformular auf luescherwohnen.ch",
    "",
    `Name: ${values.name}`,
    `E-Mail: ${values.email || "-"}`,
    `Telefon: ${values.telefon || "-"}`,
    "",
    "Nachricht:",
    values.nachricht,
    "",
    `Gesendet: ${sentAt.toISOString()}`,
  ].join("\n");
}

export function createMailer(mailConfig) {
  if (mailConfig.mode === "log") {
    return {
      async send(values) {
        const entry = JSON.stringify({
          zeit: new Date().toISOString(),
          an: mailConfig.empfaenger || "(log)",
          ...values,
        });
        if (mailConfig.logFile) {
          await appendFile(mailConfig.logFile, `${entry}\n`);
        } else {
          console.log(`mail: ${entry}`);
        }
      },
    };
  }
  const transport = nodemailer.createTransport({
    host: mailConfig.smtp.host,
    port: mailConfig.smtp.port,
    secure: mailConfig.smtp.secure,
    requireTLS: mailConfig.smtp.requireTls,
    auth: mailConfig.smtp.user ? { user: mailConfig.smtp.user, pass: mailConfig.smtp.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    async send(values) {
      await transport.sendMail({
        from: mailConfig.absender,
        to: mailConfig.empfaenger,
        subject: mailConfig.betreff,
        text: formatMailText(values),
        replyTo: values.email || undefined,
      });
    },
  };
}
