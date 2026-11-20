import type { AstroUserConfig } from 'astro';

type CspConfig = Exclude<NonNullable<NonNullable<AstroUserConfig['security']>['csp']>, boolean>;

/** Direktiven in der Form, die Astros `security.csp.directives` erwartet */
export type CspDirectives = NonNullable<CspConfig['directives']>;

export declare const PERMISSIONS_POLICY: string;

export declare function cspDirectives(options?: { connectOrigin?: string }): CspDirectives;

/** Vollständige Einstellung für `security.csp` (mit `'self'` für Skripte und Styles) */
export declare function cspConfig(options?: { connectOrigin?: string }): CspConfig;

export interface HeadersOptions {
  connectOrigin?: string;
  referrerPolicy?: string;
  /** HSTS mit `preload` (erst nach stabilem Betrieb) */
  hstsPreload?: boolean;
  /** Datei darf von anderen Websites eingebunden werden (Vorschaubilder) */
  crossOriginResource?: boolean;
}

export declare function securityHeaders(options?: HeadersOptions): [string, string][];

export declare function nginxHeaders(options?: HeadersOptions): string;
