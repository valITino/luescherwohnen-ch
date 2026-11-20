/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WEB_URL?: string;
  /** `mock` (simuliert), https-Adresse (POST) oder leer (kein Formular) */
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
  /** `true`: Vorschau (z. B. GitHub Pages) mit noindex und Hinweis */
  readonly PUBLIC_PREVIEW?: string;
  readonly PUBLIC_HSTS_PRELOAD?: string;
  /** `true`: Bereich «Projekte» auch ausserhalb der Vorschau zeigen (Inhalte freigegeben) */
  readonly PUBLIC_SHOW_PROJECTS?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
  readonly PUBLIC_BING_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
