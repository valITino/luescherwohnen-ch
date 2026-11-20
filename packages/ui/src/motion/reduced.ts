/**
 * Bewegungs-Präferenzen.
 * - `prefers-reduced-motion`: keine Autoplay- oder Scrub-Animationen, kein Lenis.
 * - `data-motion="off"` am <html>: vom Menschen angehaltene Bewegung. Dauerbewegung (Band,
 *   Equalizer) steht, Auftritte, Übergänge, der Formwechsel des Headers und der Seitenwechsel
 *   entfallen, es gibt kein sanftes Scrollen, und nichts hängt am Scrollen. Beim Fortsetzen
 *   laufen Dauerbewegung, sanftes Scrollen und die Effekte am Scrollen wieder; Auftritte bleiben
 *   aus. Gilt nur für die aktuelle Seite (kein Web-Speicher).
 */

const QUERY = '(prefers-reduced-motion: reduce)';
const EVENT = 'luescher:motion';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/** Dürfen Animationen überhaupt laufen? */
export function motionAllowed(): boolean {
  return !prefersReducedMotion();
}

/** Hat die Person laufende Bewegung über den Schalter pausiert? */
export function motionPaused(): boolean {
  return document.documentElement.dataset.motion === 'off';
}

export function setMotionPaused(paused: boolean): void {
  document.documentElement.dataset.motion = paused ? 'off' : 'on';
  document.dispatchEvent(new CustomEvent<{ paused: boolean }>(EVENT, { detail: { paused } }));
}

export function onMotionPausedChange(callback: (paused: boolean) => void): () => void {
  const handler = (event: Event) =>
    callback((event as CustomEvent<{ paused: boolean }>).detail.paused);
  document.addEventListener(EVENT, handler);
  return () => document.removeEventListener(EVENT, handler);
}
