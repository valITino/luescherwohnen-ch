import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { SMTPServer } from "smtp-server";
import { createMailer, formatMailText } from "../lib/mail.mjs";

const werte = { name: "Maria Muster", email: "maria@example.com", telefon: "", nachricht: "Bitte um Beratung." };

test("Log-Modus schreibt eine JSON-Zeile", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kontakt-"));
  const logFile = path.join(dir, "mails.jsonl");
  const mailer = createMailer({ mode: "log", logFile, empfaenger: "info@example.com" });
  await mailer.send(werte);
  const zeile = JSON.parse((await readFile(logFile, "utf8")).trim());
  assert.equal(zeile.name, "Maria Muster");
  assert.equal(zeile.an, "info@example.com");
});

test("Mailtext enthält alle Angaben", () => {
  const text = formatMailText(werte, new Date("2026-09-14T10:00:00Z"));
  assert.ok(text.includes("Name: Maria Muster"));
  assert.ok(text.includes("Telefon: -"));
  assert.ok(text.includes("Gesendet: 2026-09-14T10:00:00.000Z"));
});

test("SMTP-Modus stellt über einen SMTP-Server zu", async () => {
  const empfangen = [];
  const server = new SMTPServer({
    disabledCommands: ["AUTH", "STARTTLS"],
    onData(stream, session, callback) {
      let data = "";
      stream.on("data", (chunk) => {
        data += chunk;
      });
      stream.on("end", () => {
        empfangen.push({ empfaenger: session.envelope.rcptTo.map((r) => r.address), data });
        callback();
      });
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.server.address().port;
  try {
    const mailer = createMailer({
      mode: "smtp",
      empfaenger: "info@example.com",
      absender: "website@example.com",
      betreff: "Anfrage",
      smtp: { host: "127.0.0.1", port, secure: false, requireTls: false, user: "", pass: "" },
    });
    await mailer.send(werte);
    assert.equal(empfangen.length, 1);
    assert.ok(empfangen[0].data.includes("Subject: Anfrage"));
    assert.ok(empfangen[0].data.includes("Reply-To: maria@example.com"));
    assert.deepEqual(empfangen[0].empfaenger, ["info@example.com"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
