// CSP-Direktiven für Astros `security.csp` (Meta-Tag mit Hashes) und die Security-Header für
// den Webserver im Container (nginx). Eine Quelle für beides: So können Meta-Tag, Header und
// Tests nicht auseinanderlaufen.

/**
 * Direktiven für das Meta-Tag. `script-src` und `style-src` ergänzt Astro selbst (mit Hashes).
 * @param {{ connectOrigin?: string }} options  Origin des Kontakt-Endpunkts, falls es einen gibt
 * @returns {string[]}
 */
export function cspDirectives({ connectOrigin = '' } = {}) {
  const connect = ["'self'", connectOrigin].filter(Boolean).join(' ');
  return [
    "default-src 'none'",
    "img-src 'self'",
    "font-src 'self'",
    `connect-src ${connect}`,
    "manifest-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
  ];
}

/**
 * Vollständige Einstellung für Astros `security.csp`.
 * `'self'` steht ausdrücklich in den Quellen für Skripte und Styles: Sobald eine Seite zur
 * Laufzeit eine weitere Quelle ergänzt, lässt Astro den Standardwert `'self'` sonst weg.
 * @param {{ connectOrigin?: string }} options
 */
export function cspConfig({ connectOrigin = '' } = {}) {
  return {
    algorithm: /** @type {const} */ ('SHA-256'),
    directives: cspDirectives({ connectOrigin }),
    scriptDirective: { resources: ["'self'"] },
    styleDirective: { resources: ["'self'"] },
  };
}

/** Alles aus, was die Website nicht braucht. */
export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'browsing-topics=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=()',
  'geolocation=()',
  'gyroscope=()',
  'hid=()',
  'idle-detection=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'serial=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ');

/**
 * Security-Header für jede Antwort. Direktiven, die per Meta-Tag nicht wirken (frame-ancestors,
 * upgrade-insecure-requests), stehen hier; die Hashes für Skripte und Styles stehen im Meta-Tag.
 * @param {{
 *   connectOrigin?: string,
 *   referrerPolicy?: string,
 *   hstsPreload?: boolean,
 *   crossOriginResource?: boolean,
 * }} options  `crossOriginResource`: Datei darf von anderen Websites eingebunden werden (OG-Bilder)
 * @returns {[string, string][]}
 */
export function securityHeaders({
  connectOrigin = '',
  referrerPolicy = 'strict-origin-when-cross-origin',
  hstsPreload = false,
  crossOriginResource = false,
} = {}) {
  const connect = ["'self'", connectOrigin].filter(Boolean).join(' ');
  const csp = [
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `connect-src ${connect}`,
    'upgrade-insecure-requests',
  ].join('; ');
  return [
    ['Content-Security-Policy', csp],
    // Vorsichtig beginnen: ein Tag, nur diese Domain. Subdomains und Preload erst nach stabilem
    // Betrieb und einer Bestandsaufnahme der Subdomains (docs/DEPLOY.md).
    [
      'Strict-Transport-Security',
      hstsPreload ? 'max-age=31536000; includeSubDomains; preload' : 'max-age=86400',
    ],
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', referrerPolicy],
    ['Permissions-Policy', PERMISSIONS_POLICY],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['Cross-Origin-Resource-Policy', crossOriginResource ? 'cross-origin' : 'same-origin'],
  ];
}

/**
 * Header als nginx-Include (`add_header … always;`). nginx erbt `add_header` nicht in
 * `location`-Blöcke mit eigenen `add_header`: Darum bindet jede Location diese Datei ein.
 * @param {Parameters<typeof securityHeaders>[0]} options
 */
export function nginxHeaders(options = {}) {
  const escape = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return [
    '# Generiert von @luescher/config/security (scripts/nginx-headers.mjs). Nicht von Hand ändern.',
    '# Skript- und Style-Hashes stehen im CSP-Meta-Tag jeder Seite (Astro security.csp).',
    ...securityHeaders(options).map(
      ([name, value]) => `add_header ${name} "${escape(value)}" always;`,
    ),
    '',
  ].join('\n');
}
