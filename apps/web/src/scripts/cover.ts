/**
 * Bogen über Bogen (scroll.css): Sobald der nächste Bogen ins Bild kommt, bleibt der aktuelle
 * zurück, und der nächste schiebt sich über ihn. Was dabei schon unter dem nächsten Bogen liegt,
 * steht geometrisch noch im Fenster. Der Browser hält ein Bedienelement dort für sichtbar und
 * scrollt nicht hin, wenn es den Tastaturfokus bekommt (etwa mit Umschalt+Tab zurück). Der Fokus
 * wäre dann nicht zu sehen (WCAG 2.2, 2.4.11).
 *
 * Darum: Bekommt ein Element den Tastaturfokus, das der nächste Bogen verdeckt, scrollt die Seite
 * so weit zurück, dass sein Bogen wieder frei steht (Unterkante am unteren Fensterrand).
 */
import { motionAllowed, motionPaused } from '@luescher/ui/motion';
import type { SmoothScroll } from '@luescher/ui/motion/smooth';

export function initCoverFocus(smooth: () => SmoothScroll | null): void {
  // Ohne scrollgekoppelte Bewegung bleibt kein Bogen zurück: nichts zu tun.
  if (!motionAllowed() || !CSS.supports('animation-timeline: view()')) return;

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || motionPaused()) return;
    if (!target.matches(':focus-visible')) return;
    const sheet = target.closest<HTMLElement>('main > *');
    // Der letzte Bogen bleibt nicht zurück (nach ihm kommt keiner, der ihn deckte).
    if (!sheet || !sheet.nextElementSibling) return;
    // Lage des Bogens im Layout, ohne seine Verschiebung: Liegt die Unterkante über dem unteren
    // Fensterrand, schiebt sich gerade der nächste Bogen darüber.
    const bottom = sheet.offsetTop + sheet.offsetHeight - window.scrollY;
    if (bottom >= window.innerHeight) return;
    // Der nächste Bogen deckt alles unterhalb seiner Oberkante, also unterhalb dieser Unterkante
    // (seine runden Ecken reichen noch etwas höher: zwei Zeilen Abstand).
    if (target.getBoundingClientRect().bottom < bottom - 48) return;
    // Ein Pixel vor der Stelle, an der der nächste Bogen hereinkommt: Dort ruht dieser ganz.
    const top = Math.max(0, sheet.offsetTop + sheet.offsetHeight - window.innerHeight - 1);
    const lenis = smooth()?.lenis;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: 'instant' });
  });
}
