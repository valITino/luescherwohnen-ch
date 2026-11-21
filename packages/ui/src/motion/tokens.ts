/**
 * Motion-Tokens für Skripte (Timer, Web Animations API). Spiegel von `--ease-*`, `--dur-*` und
 * `--stagger*` in `styles/tokens.css`; `packages/ui/test/motion-tokens.test.ts` hält beide Seiten
 * gleich.
 *
 * Bewusst ohne Importe: Jedes Skript kann hier lesen, ohne etwas mitzuladen.
 */

/** Kurven als CSS-Wert; jede bremst ohne Überschwingen. */
export const EASE = {
  /** Standard: Bedienelemente und Auftritte (CSS `--ease-out`, Alias `--ease`) */
  out: { css: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  /** Lange, weiche Landung: Zeilen, Bilder, Signaturmomente */
  expo: { css: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  /** Flächen, die auf- und wieder zufahren */
  inOut: { css: 'cubic-bezier(0.65, 0, 0.35, 1)' },
  /** Kurze Ausgänge */
  in: { css: 'cubic-bezier(0.32, 0, 0.67, 0)' },
} as const;

/** Dauern in Sekunden; für Timer `* 1000` */
export const DUR = { d1: 0.15, d2: 0.25, d3: 0.4, d4: 0.8, d5: 1.2 } as const;

/** Versatz zwischen den Elementen einer Folge, in Sekunden */
export const STAGGER = { base: 0.07, tight: 0.045 } as const;
