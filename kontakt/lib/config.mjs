// Konfiguration ausschliesslich über Umgebungsvariablen; keine Secrets im Code.
import { randomBytes } from "node:crypto";

function bool(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "ja"].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig(env = process.env) {
  const mailMode = env.MAIL_MODE === "log" ? "log" : "smtp";
  const config = {
    host: env.HOST || "0.0.0.0",
    port: int(env.PORT, 3000),
    basePath: env.BASE_PATH || "/kontakt",
    partialsDir: env.PARTIALS_DIR || new URL("../templates/partials/", import.meta.url).pathname,
    trustProxy: bool(env.TRUST_PROXY, false),
    secret: env.KONTAKT_SECRET || "",
    minAgeMs: int(env.KONTAKT_MIN_AGE_MS, 2000),
    maxAgeMs: int(env.KONTAKT_MAX_AGE_MS, 60 * 60 * 1000),
    rateLimitPerHour: int(env.RATE_LIMIT_PER_HOUR, 10),
    maxBodyBytes: int(env.MAX_BODY_BYTES, 16 * 1024),
    mail: {
      mode: mailMode,
      logFile: env.MAIL_LOG_FILE || "",
      empfaenger: env.KONTAKT_EMPFAENGER || "",
      absender: env.KONTAKT_ABSENDER || "",
      betreff: env.KONTAKT_BETREFF || "Anfrage über luescherwohnen.ch",
      smtp: {
        host: env.SMTP_HOST || "",
        port: int(env.SMTP_PORT, 587),
        secure: bool(env.SMTP_SECURE, false),
        requireTls: bool(env.SMTP_REQUIRE_TLS, true),
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASS || "",
      },
    },
  };
  const problems = [];
  if (!config.secret) {
    if (mailMode === "smtp") {
      problems.push("KONTAKT_SECRET fehlt");
    } else {
      config.secret = randomBytes(32).toString("hex");
      config.generatedSecret = true;
    }
  } else if (config.secret.length < 32) {
    problems.push("KONTAKT_SECRET muss mindestens 32 Zeichen lang sein");
  }
  if (mailMode === "smtp") {
    for (const [key, value] of [
      ["KONTAKT_EMPFAENGER", config.mail.empfaenger],
      ["KONTAKT_ABSENDER", config.mail.absender],
      ["SMTP_HOST", config.mail.smtp.host],
    ]) {
      if (!value) problems.push(`${key} fehlt`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Konfiguration unvollständig: ${problems.join(", ")}`);
  }
  return config;
}
