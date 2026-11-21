/**
 * Motion-Tokens für Skripte (GSAP, Timer, Web Animations API). Spiegel von `--ease-*`, `--dur-*`
 * und `--stagger*` in `styles/tokens.css`; `packages/ui/test/motion-tokens.test.ts` hält beide
 * Seiten gleich und misst jede GSAP-Kurve an ihrer CSS-Kurve.
 *
 * Bewusst ohne Importe: Auch Skripte ohne GSAP (z. B. der Header) lesen hier, ohne die
 * Bibliothek mitzuladen.
 */

/**
 * Kurven, je als CSS-Wert und als benannte GSAP-Kurve (Abweichung höchstens 0,012).
 * Achtung, GSAP zählt anders: `power4` ist die Quint-, `power2` die Kubik-Kurve.
 */
export const EASE = {
  /** Standard: Bedienelemente und Auftritte (CSS `--ease-out`, Alias `--ease`) */
  out: { css: 'cubic-bezier(0.22, 1, 0.36, 1)', gsap: 'power4.out' },
  /** Lange, weiche Landung: Zeilen, Bilder, Signaturmomente */
  expo: { css: 'cubic-bezier(0.16, 1, 0.3, 1)', gsap: 'expo.out' },
  /** Flächen, die auf- und wieder zufahren */
  inOut: { css: 'cubic-bezier(0.65, 0, 0.35, 1)', gsap: 'power2.inOut' },
  /** Kurze Ausgänge */
  in: { css: 'cubic-bezier(0.32, 0, 0.67, 0)', gsap: 'power2.in' },
} as const;

/** Dauern in Sekunden (Einheit von GSAP); für Timer `* 1000` */
export const DUR = { d1: 0.15, d2: 0.25, d3: 0.4, d4: 0.8, d5: 1.2 } as const;

/** Versatz zwischen den Elementen einer Folge, in Sekunden */
export const STAGGER = { base: 0.07, tight: 0.045 } as const;
