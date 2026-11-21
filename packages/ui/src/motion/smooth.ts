import Lenis from 'lenis';
import { motionAllowed, motionPaused, onMotionPausedChange } from './reduced.ts';

export interface SmoothScroll {
  /**
   * Lenis-Instanz; `null` bei reduzierter Bewegung, auf Touch-Geräten und solange die Bewegung
   * angehalten ist (natives Scrollen). Immer frisch lesen, nicht zwischenspeichern.
   */
  readonly lenis: Lenis | null;
  /** Scrollen sperren, z. B. solange ein Vollbild-Overlay offen ist */
  stop(): void;
  start(): void;
}

/** Klasse am <html>, solange ein Vollbild-Overlay (Menü) die Seite sperrt */
const LOCKED = 'scroll-locked';

/** Geräte, die man nur mit dem Finger bedient (Handy, Tablet) */
const TOUCH_ONLY = '(hover: none) and (pointer: coarse)';

/** Tasten, mit denen der Browser selbst scrollt */
const SCROLL_KEYS = new Set(['Home', 'End', 'PageUp', 'PageDown', ' ', 'ArrowUp', 'ArrowDown']);

const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** Bedienelemente, die die Leertaste auslösen, statt die Seite zu scrollen */
const PRESSABLE =
  'button, summary, [role="button"], [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"]';
const pressed = (event: KeyboardEvent) =>
  event.key === ' ' && event.target instanceof Element && event.target.closest(PRESSABLE) !== null;

/**
 * Lenis-Smooth-Scroll (lerp 0.1). Was sich beim Scrollen bewegt, hängt in CSS an der
 * Scrollposition (scroll.css) und folgt dem sanften Scrollen darum von selbst.
 * Bei `prefers-reduced-motion` wird Lenis gar nicht erst gestartet, ebenso auf Geräten, die man
 * nur mit dem Finger bedient: Dort scrollt Lenis ohnehin nicht selbst (syncTouch aus), hängt sich
 * aber mit blockierenden Zuhörern (passive: false) an jede Berührung. Jedes Wischen müsste dann
 * auf den Hauptthread warten. Ohne Lenis scrollt der Browser frei; Sprünge zu Marken sind dort
 * sofort am Ziel (unter dem Menü-Vorhang ohnehin unsichtbar).
 *
 * Der Abstand für den festen Header kommt aus CSS (`scroll-padding-top` am <html>);
 * Lenis und der Browser werten denselben Wert aus.
 *
 * Overlays mit eigenem Scrollen (Menü) tragen `data-lenis-prevent`: Ein gestopptes
 * Lenis schluckt sonst jedes Rad- und Wischereignis, und das Overlay liesse sich nicht scrollen.
 *
 * Hält jemand die Bewegung an (Schalter, `data-motion="off"`), scrollt bis zum Fortsetzen der
 * Browser selbst: kein Ausgleiten, Sprünge sind sofort am Ziel, wie bei reduzierter Bewegung.
 */
export function initSmoothScroll(): SmoothScroll {
  const root = document.documentElement;

  if (!motionAllowed() || window.matchMedia(TOUCH_ONLY).matches) {
    return {
      lenis: null,
      stop: () => root.classList.add(LOCKED),
      start: () => root.classList.remove(LOCKED),
    };
  }

  let lenis: Lenis | null = null;

  const create = () => {
    if (lenis) return;
    lenis = new Lenis({
      lerp: 0.1,
      // Lenis rechnet in jedem Bild selbst weiter und hört damit auf, wenn es beendet wird.
      autoRaf: true,
      anchors: true,
      stopInertiaOnNavigate: true,
    });
    // Ist schon ein Overlay offen (jemand war schneller als das Nachladen), bleibt die Seite stehen.
    if (root.classList.contains(LOCKED)) lenis.stop();
  };
  // Mitten im Ausgleiten angehalten: Die Seite bleibt, wo sie gerade ist.
  const destroy = () => {
    lenis?.destroy();
    lenis = null;
  };

  /*
   * Scrollt jemand mit der Tastatur (Pos1, Ende, Bild auf/ab, Leertaste, Pfeile), während Lenis
   * noch vom Mausrad ausgleitet, endet das Ausgleiten: Sonst zöge Lenis die Seite nach der Taste
   * zurück an sein altes Ziel. Das Ziel springt dafür auf die aktuelle Lage, ohne Lenis anzuhalten
   * (Anhalten setzte kurz `overflow: clip` am <html>, mit klassischen Bildlaufleisten rechnete
   * der Browser dafür das ganze Layout neu). Ein offenes Menü (gestopptes Lenis) bleibt gesperrt.
   * Die Leertaste auf einem Knopf löst den Knopf aus und scrollt nicht: Dann gleitet die Seite
   * weiter.
   */
  window.addEventListener('keydown', (event) => {
    if (!lenis || !SCROLL_KEYS.has(event.key) || event.altKey || event.ctrlKey || event.metaKey)
      return;
    if (event.defaultPrevented || editable(event.target) || pressed(event)) return;
    if (lenis.isStopped || lenis.isScrolling !== 'smooth') return;
    lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });
  });

  if (!motionPaused()) create();
  onMotionPausedChange((paused) => (paused ? destroy() : create()));

  return {
    get lenis() {
      return lenis;
    },
    stop() {
      lenis?.stop();
      root.classList.add(LOCKED);
    },
    start() {
      root.classList.remove(LOCKED);
      lenis?.start();
    },
  };
}
