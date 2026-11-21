import type { AstroIntegration } from 'astro';

/** Die Module, die eine Datei statisch einbindet (relative Pfade). */
export declare function staticImports(code: string): string[];
/** Verschiebt das Modul der Seite blockierend in den Kopf, mit `modulepreload` davor. */
export declare function moveModuleToHead(
  html: string,
  importsOf: (src: string) => string[],
): string;
/** Astro-Integration: wendet moveModuleToHead im Build auf jede Seite an. */
export declare function earlyScript(): AstroIntegration;
