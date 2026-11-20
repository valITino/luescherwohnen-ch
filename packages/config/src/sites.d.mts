export declare const PROD_URL: string;
export declare const DEV_URL: string;

export interface ContactTarget {
  /** `mock`: simuliert, `post`: sendet an `endpoint`, `off`: kein Formular */
  mode: 'mock' | 'post' | 'off';
  /** Adresse für POST; leer bei `mock` und `off` */
  endpoint: string;
  /** Origin für connect-src; leer bei `mock` und `off` */
  origin: string;
}

export interface Sites {
  web: string;
  preview: boolean;
  contact: ContactTarget;
  /** HSTS-Header mit `preload` ausliefern */
  hstsPreload: boolean;
  /** Bestätigungscodes für Search Console und Bing Webmaster Tools; leer, wenn nicht gesetzt */
  verification: { google: string; bing: string };
}

/** Entfernt Schrägstriche am Ende (linear, ohne regulären Ausdruck). */
export declare function stripTrailingSlashes(value: string): string;

export declare function resolveContact(value: unknown): ContactTarget;

export declare function resolveSites(
  env: Record<string, string | boolean | undefined>,
  options?: { dev?: boolean },
): Sites;

export declare function splitSiteUrl(url: string): { site: string; base: string };

export declare function joinPath(base: string, path?: string): string;
