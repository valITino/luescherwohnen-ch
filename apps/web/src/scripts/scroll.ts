/**
 * Sanftes Scrollen (Lenis) am Desktop. Wird beim ersten Lebenszeichen der Besucherin oder des
 * Besuchers nachgeladen (siehe home.ts). Bei reduzierter Bewegung und auf Geräten, die man nur
 * mit dem Finger bedient, scrollt der Browser selbst.
 *
 * Die Bewegung der Seite beim Scrollen braucht kein Skript: Sie hängt in CSS an der
 * Scrollposition (scroll.css) und folgt darum auch dem sanften Scrollen von selbst.
 */
import { initSmoothScroll, type SmoothScroll } from '@luescher/ui/motion/smooth';

/** Marke für Tests: Das sanfte Scrollen ist eingerichtet, die Schrift ist da, die Höhe steht. */
const markReady = () => {
  document.documentElement.dataset.scroll = 'ready';
};

/** @param onReady läuft, sobald das sanfte Scrollen eingerichtet ist und die Schrift geladen hat */
export function initScroll(onReady?: () => void): SmoothScroll {
  const smooth = initSmoothScroll();
  // Mit der Schrift ändern sich Umbrüche und damit die Länge der Seite: danach neu vermessen.
  void document.fonts.ready.then(() => {
    smooth.lenis?.resize();
    markReady();
    onReady?.();
  });
  return smooth;
}
