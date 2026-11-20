/**
 * Überschriften der Sektionen fahren einmal zeilenweise hinter einer Maske herein, sobald sie
 * ins Bild kommen. Danach wird die Aufteilung zurückgenommen: Das Markup ist wieder wie zuvor.
 * Was beim Start schon sichtbar ist (oder darüber liegt), bleibt einfach stehen.
 *
 * Geteilt wird erst im Moment des Erscheinens, eine Überschrift nach der anderen. Alle auf
 * einmal zu teilen, würde den Browser beim Laden für jede einzelne das Layout neu rechnen lassen.
 *
 * Nichts wartet, wenn es nicht soll:
 * - Bewegung pausiert (`data-motion="off"`): kein Auftritt mehr, laufende Zeilen stehen sofort.
 * - Sprung zu einer Marke (`data-jump` am <html>, home.ts): Was unterwegs oder am Ziel ins Bild
 *   kommt, steht einfach da. So landet der Sprung auf fertigem Inhalt, und mitten im Scrollen
 *   wird nichts geteilt.
 */
import { motionPaused, onMotionPausedChange } from '@luescher/ui/motion';
import { DUR, EASE, gsap, STAGGER } from '@luescher/ui/motion/smooth';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/** Läuft gerade ein Sprung zu einer Marke (home.ts)? */
const jumping = () => 'jump' in document.documentElement.dataset;

/**
 * Erste Meldung: Steht das Element schon im Bild (auch nur am unteren Rand) oder darüber?
 * Gemessen am ganzen Fenster, nicht am verkleinerten Bereich des Observers: Was nach einem
 * Direktlink oder einer wiederhergestellten Position unten schon zu sehen ist, soll nicht
 * nachträglich verschwinden und neu auftreten. Noch nicht ausgelegte Teile (data-lazy) meldet
 * der Observer mit leerem Rechteck; sie liegen weiter unten und warten.
 * Liest nur, was der Observer schon gemessen hat.
 */
const alreadySeen = (entry: IntersectionObserverEntry) => {
  const { top, bottom, height } = entry.boundingClientRect;
  return entry.isIntersecting || bottom < 0 || (height > 0 && top < window.innerHeight);
};

/** Letzter Platz einer Folge (gezählt ab 0): Weitere Bilder starten zusammen mit ihm. */
const MAX_INDEX = 3;

export function initReveals(): void {
  if (typeof IntersectionObserver === 'undefined') return;
  // Pausiert: Nichts wird geteilt, nichts wartet. Die Elemente bleiben, wie sie im Markup stehen.
  if (motionPaused()) return;

  const titles = document.querySelectorAll<HTMLElement>('main h2.display, main [data-reveal]');
  const running = new Set<ReturnType<typeof gsap.from>>();
  let first = true;

  const observer = new IntersectionObserver(
    (entries) => {
      // Eine Meldung, die erst nach dem Pausieren eintrifft, ändert nichts mehr.
      if (motionPaused()) return;
      for (const entry of entries) {
        const title = entry.target as HTMLElement;
        // Erste Meldung: Was schon im Bild steht oder darüber liegt, wird nicht mehr animiert.
        // (Bewusst über den Observer und nicht selbst gemessen: Messen würde den Browser zwingen,
        // auch die noch zurückgestellten Sektionen sofort zu berechnen.)
        if (first && alreadySeen(entry)) {
          observer.unobserve(title);
          continue;
        }
        if (!entry.isIntersecting) continue;
        observer.unobserve(title);
        // Unterwegs zu einer Marke: nicht teilen, die Überschrift steht einfach da.
        if (jumping()) continue;
        const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' });
        // Der Kicker führt (SectionHead.astro), die Zeilen folgen 60 ms später.
        const tween = gsap.from(split.lines, {
          yPercent: 118,
          duration: DUR.d4,
          ease: EASE.expo.gsap,
          stagger: STAGGER.base,
          delay: 0.06,
          onComplete: () => {
            running.delete(tween);
            split.revert();
          },
        });
        running.add(tween);
      }
      first = false;
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  titles.forEach((title) => observer.observe(title));
  const entrances = initEntrances();

  // Pausiert jemand die Bewegung, ist sofort alles da. Auch nach dem Fortsetzen folgen keine
  // Auftritte mehr: Die Seite soll sich nicht erneut vor den Augen aufbauen.
  const unsubscribe = onMotionPausedChange((paused) => {
    if (!paused) return;
    unsubscribe();
    observer.disconnect();
    // Ans Ende springen: onComplete nimmt die Aufteilung zurück.
    for (const tween of [...running]) tween.progress(1);
    entrances.resolveAll();
  });
}

/**
 * Kleine Auftritte, die das CSS selbst spielt (Kicker tippt sich ein, Bilder öffnen sich, der
 * Sucher stellt das Porträt scharf): Elemente mit `data-enter` warten ausserhalb des Bildes
 * (`wait`) und bekommen `in`, sobald sie hereinkommen. Was beim Start schon zu sehen ist, bleibt
 * einfach stehen. Ohne dieses Skript (reduzierte Bewegung, kein JavaScript) ist alles von Anfang
 * an sichtbar.
 */
function initEntrances(): { resolveAll(): void } {
  const elements = document.querySelectorAll<HTMLElement>('main [data-enter]');
  let first = true;

  const observer = new IntersectionObserver(
    (entries) => {
      // Eine Meldung, die erst nach dem Pausieren eintrifft, lässt nichts mehr warten.
      if (motionPaused()) return;
      // Bilder, die in derselben Meldung hereinkommen, öffnen sich nacheinander (in der
      // Reihenfolge des Dokuments, also von links nach rechts). Ein einzelnes Bild startet sofort.
      let index = 0;
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (first) {
          // Beim ersten Bericht schon zu sehen oder darüber: kein Auftritt, es steht ja schon da.
          // Alles darunter wartet ausserhalb des Bildes auf seinen Auftritt.
          if (alreadySeen(entry)) observer.unobserve(element);
          else element.dataset.enter = 'wait';
          continue;
        }
        if (!entry.isIntersecting) continue;
        observer.unobserve(element);
        // Mitten in einem Sprung: kein Auftritt, das Ziel steht bei der Ankunft fertig da.
        if (jumping()) {
          element.dataset.enter = '';
          continue;
        }
        if (element.classList.contains('enter-unveil')) {
          placeInRow(element, Math.min(index, MAX_INDEX));
          index += 1;
        }
        element.dataset.enter = 'in';
      }
      first = false;
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  elements.forEach((element) => observer.observe(element));

  return {
    /**
     * Alles, was noch wartet, steht sofort da; beobachtet wird nichts mehr. Auch was schon
     * aufgetreten ist, verliert seinen Auftritt: Sonst fänden die Regeln in components.css nach
     * dem Fortsetzen wieder ihr `in` und spielten ihn ein zweites Mal.
     */
    resolveAll() {
      observer.disconnect();
      for (const element of document.querySelectorAll<HTMLElement>(
        'main [data-enter="wait"], main [data-enter="in"]',
      )) {
        element.dataset.enter = '';
      }
    },
  };
}

/**
 * Platz in einer Folge gemeinsam hereinkommender Bilder: `--enter-i` verzögert den Auftritt um
 * je `--stagger` (components.css). Danach wird der Wert wieder entfernt. Gezählt wird nur das
 * Ende des eigenen Auftritts, nicht das von Kindern (etwa den Ecken im Sucher).
 */
function placeInRow(element: HTMLElement, index: number): void {
  if (index === 0) return;
  element.style.setProperty('--enter-i', String(index));
  const clear = (event: AnimationEvent) => {
    // Auch Animationen der eigenen Pseudo-Elemente (etwa die Linie im Sucher) melden sich hier.
    if (event.target !== element || event.pseudoElement !== '') return;
    element.style.removeProperty('--enter-i');
    if (element.style.length === 0) element.removeAttribute('style');
    element.removeEventListener('animationend', clear);
    element.removeEventListener('animationcancel', clear);
  };
  element.addEventListener('animationend', clear);
  element.addEventListener('animationcancel', clear);
}
