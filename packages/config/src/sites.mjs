// Adresse der Website und Betriebsart, abgeleitet aus Umgebungsvariablen.
// Wird sowohl von astro.config.mjs (Node) als auch vom App-Code (Vite) genutzt.

/**
 * Produktive Adresse laut Briefing (Projektname «luescherwohnen.ch»). Domain, DNS und Hosting
 * sind noch nicht freigegeben (D-007, D-011 in docs/requirements-analysis.md).
 */
export const PROD_URL = 'https://luescherwohnen.ch';
export const DEV_URL = 'http://localhost:4321';

const trim = (value) => String(value).trim().replace(/\/+$/, '');
/** Nur Zeichen, die in solchen Codes vorkommen: So landet nie fremdes Markup im <head>. */
const verificationCode = (value) => {
  const code = String(value ?? '').trim();
  return /^[A-Za-z0-9_-]{8,128}$/.test(code) ? code : '';
};
const pick = (value, fallback) => (value && String(value).trim() ? trim(value) : fallback);
const flag = (value) => value === 'true' || value === true;

/**
 * Wohin das Kontaktformular sendet.
 * - `mock`: nichts wird gesendet, die Antwort ist simuliert (Vorschau, Entwicklung)
 * - absolute https-Adresse: POST als JSON an diese Adresse
 * - leer (Standard): kein Formular, nur die direkten Kontaktwege. Der Empfang von Anfragen ist
 *   noch nicht entschieden (D-003, D-013).
 * @param {unknown} value
 */
export function resolveContact(value) {
  const raw = String(value ?? '').trim();
  if (raw === 'mock') return { mode: /** @type {const} */ ('mock'), endpoint: '', origin: '' };
  if (!raw) return { mode: /** @type {const} */ ('off'), endpoint: '', origin: '' };
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error(`PUBLIC_CONTACT_ENDPOINT muss https verwenden: ${raw}`);
  }
  return { mode: /** @type {const} */ ('post'), endpoint: url.href, origin: url.origin };
}

/**
 * @param {Record<string, string | boolean | undefined>} env  z. B. import.meta.env oder process.env
 * @param {{ dev?: boolean }} [options]
 */
export function resolveSites(env, options = {}) {
  const web = pick(env.PUBLIC_WEB_URL, options.dev ? DEV_URL : PROD_URL);
  const preview = flag(env.PUBLIC_PREVIEW);
  const contact = resolveContact(env.PUBLIC_CONTACT_ENDPOINT ?? (options.dev ? 'mock' : ''));
  return {
    web,
    /** `true`: Vorschau (z. B. GitHub Pages) mit noindex und Hinweis oben */
    preview,
    contact,
    /** `true`: HSTS-Header mit `preload` (erst nach stabilem Betrieb, siehe docs/DEPLOY.md) */
    hstsPreload: flag(env.PUBLIC_HSTS_PRELOAD),
    /**
     * Bestätigungscodes für Search Console und Bing Webmaster Tools (optional; empfohlen ist die
     * Bestätigung per DNS, dann bleiben beide leer). Die Codes sind öffentlich, keine Geheimnisse.
     */
    verification: {
      google: verificationCode(env.PUBLIC_GOOGLE_SITE_VERIFICATION),
      bing: verificationCode(env.PUBLIC_BING_SITE_VERIFICATION),
    },
  };
}

/**
 * Zerlegt die Adresse einer Site in Astros `site` und `base`.
 * https://luescherwohnen.ch                     → site https://luescherwohnen.ch, base ''
 * https://user.github.io/luescherwohnen-ch     → site https://user.github.io, base '/luescherwohnen-ch'
 * @param {string} url
 */
export function splitSiteUrl(url) {
  const parsed = new URL(url);
  const base = parsed.pathname.replace(/\/+$/, '');
  return { site: parsed.origin, base };
}

/**
 * Baut einen Link innerhalb der Site, mit Basis-Pfad.
 * joinPath('/repo', '/impressum') → '/repo/impressum'; joinPath('', '/') → '/'
 * @param {string} base
 * @param {string} path
 */
export function joinPath(base, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
