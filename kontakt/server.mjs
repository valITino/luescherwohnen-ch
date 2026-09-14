#!/usr/bin/env node
// Kontaktformular-Dienst (ADR-0002): zwei Schritte ohne JavaScript.
// 1. POST /kontakt          Eingaben prüfen, Bestätigungsseite mit signiertem Token
// 2. POST /kontakt/senden   Token und Wartezeit prüfen, Ratenlimit, E-Mail senden
// Keine Speicherung, keine Cookies, keine Drittanbieter, kein Inhalt im Log.
import { createServer } from "node:http";
import { loadConfig } from "./lib/config.mjs";
import { HttpError, clientIp, originAllowed, readForm, redirect, sendHtml, sendText } from "./lib/http.mjs";
import { createMailer } from "./lib/mail.mjs";
import * as pages from "./lib/pages.mjs";
import { createRateLimiter } from "./lib/ratelimit.mjs";
import { createRenderer } from "./lib/render.mjs";
import { createToken, verifyToken } from "./lib/token.mjs";
import { istFalleGefuellt, validateAnfrage } from "./lib/validate.mjs";

export async function createApp(config, { mailer, now = () => Date.now(), logger = console } = {}) {
  const render = await createRenderer({ partialsDir: config.partialsDir });
  const mail = mailer ?? createMailer(config.mail);
  const limiter = createRateLimiter({ limit: config.rateLimitPerHour, windowMs: 60 * 60 * 1000 });
  const base = config.basePath;
  const log = (event, extra = {}) =>
    logger.log(JSON.stringify({ zeit: new Date().toISOString(), event, ...extra }));

  const seite = (res, status, page) => sendHtml(res, status, render.layout(page));

  return async function handle(req, res) {
    const route = new URL(req.url ?? "/", "http://localhost").pathname;
    try {
      if (route === `${base}/healthz` && req.method === "GET") {
        return sendText(res, 200, "ok\n");
      }
      if (route === base && req.method === "GET") {
        return redirect(res, "/#kontakt");
      }
      if (route === `${base}/danke` && req.method === "GET") {
        return seite(res, 200, pages.danke());
      }
      if (![base, `${base}/senden`, `${base}/aendern`].includes(route)) {
        return seite(res, 404, pages.nichtGefunden());
      }
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return seite(res, 405, pages.fehler("Diese Adresse nimmt nur Formulardaten entgegen."));
      }
      if (!originAllowed(req)) {
        log("origin_abgelehnt");
        return seite(res, 403, pages.fehler("Die Anfrage kam nicht von dieser Website."));
      }
      const fields = await readForm(req, config.maxBodyBytes);
      if (istFalleGefuellt(fields)) {
        log("falle");
        return redirect(res, `${base}/danke`);
      }
      const result = validateAnfrage(fields);
      if (route === `${base}/aendern`) {
        return seite(res, 200, pages.formular(render.formularHtml({ values: result.values })));
      }
      if (!result.ok) {
        return seite(res, 400, pages.formular(render.formularHtml(result)));
      }
      if (route === base) {
        return seite(res, 200, pages.bestaetigung(result.values, createToken(config.secret, now()), base));
      }
      const check = verifyToken(config.secret, fields.token, {
        now: now(),
        minAgeMs: config.minAgeMs,
        maxAgeMs: config.maxAgeMs,
      });
      if (!check.ok) {
        log("token", { grund: check.reason });
        const hinweis =
          check.reason === "zu schnell"
            ? "Das ging sehr schnell. Bitte prüfen Sie Ihre Angaben und senden Sie die Anfrage erneut."
            : "Die Bestätigung ist abgelaufen. Bitte prüfen Sie Ihre Angaben und senden Sie die Anfrage erneut.";
        return seite(res, 400, pages.formular(render.formularHtml({ values: result.values }), { hinweis }));
      }
      if (!limiter.allow(clientIp(req, config.trustProxy), now())) {
        log("ratenlimit");
        return seite(
          res,
          429,
          pages.fehler("Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut oder rufen Sie uns an."),
        );
      }
      try {
        await mail.send(result.values);
      } catch (error) {
        log("mail_fehler", { fehler: error.message });
        return seite(
          res,
          502,
          pages.fehler("Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte rufen Sie uns an oder schreiben Sie uns eine E-Mail."),
        );
      }
      log("gesendet");
      return redirect(res, `${base}/danke`);
    } catch (error) {
      if (error instanceof HttpError) {
        return seite(res, error.status, pages.fehler(error.message));
      }
      log("fehler", { fehler: error.message });
      return sendText(res, 500, "Interner Fehler\n");
    }
  };
}

export async function start(config, options = {}) {
  const handle = await createApp(config, options);
  const server = createServer(handle);
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });
  return server;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const config = loadConfig();
  if (config.generatedSecret) {
    console.warn("kontakt: KONTAKT_SECRET nicht gesetzt, zufälliges Secret nur für diese Laufzeit");
  }
  if (config.mail.mode === "log") {
    console.warn("kontakt: MAIL_MODE=log, Anfragen werden nur protokolliert (nicht für Produktion)");
  }
  start(config)
    .then((server) => {
      console.log(`kontakt: bereit auf http://${config.host}:${config.port}${config.basePath}`);
      const stop = () => server.close(() => process.exit(0));
      process.on("SIGTERM", stop);
      process.on("SIGINT", stop);
    })
    .catch((error) => {
      console.error(`kontakt: ${error.message}`);
      process.exit(1);
    });
}
