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

/**
 * Ein Bild öffnet sich erst, wenn ein Viertel seines Rahmens im Bild ist. Früher, gleich am
 * unteren Rand, stiege es grösstenteils unter dem Rand auf: Zu sehen wäre nur, wie zuletzt seine
 * Oberkante ankommt.
 */
const UNVEIL_AT = 0.25;
/** Bleibt ein Rahmen knapp darunter stehen, öffnet sich das Bild nach dieser Zeit trotzdem. */
const UNVEIL_PARK_MS = 700;
/**
 * So lange darf ein Bild, das noch lädt (langsames Netz, schnelles Wischen), seinen Auftritt
 * hinauszögern. Danach steht es ohne Auftritt da und erscheint, sobald es geladen ist, auf der
 * Sandfläche, statt dass der Ausschnitt über einen leeren Rahmen steigt und das Foto nachspringt.
 */
const IMAGE_WAIT_MS = 500;

/**
 * Die Zeilen bleiben während des Auftritts genau so, wie der Browser die Überschrift umbricht.
 * SplitText hält jedes Wort zusammen und bricht ausgewogene Überschriften (text-wrap: balance)
 * mitunter anders um: Bei «Ein Familien­unternehmen aus Baden.» stünde das ganze Wort in der
 * nächsten Zeile, und am Ende des Auftritts spränge der Umbruch zurück. Darum wird jeder Umbruch
 * vorher gemessen und für die Dauer des Auftritts fest gesetzt (an einem weichen Trennstrich mit
 * sichtbarem Strich). Gibt zurück, wie das Markup wiederhergestellt wird.
 */
function holdLines(title: HTMLElement): () => void {
  const breaks: { node: Text; at: number }[] = [];
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let last = Number.NEGATIVE_INFINITY;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    for (let at = 0; at < text.data.length; at++) {
      if (/\s|\u00AD/.test(text.data[at] ?? '')) continue;
      range.setStart(text, at);
      range.setEnd(text, at + 1);
      // Unterkante, nicht Oberkante: Ein Zeichen am Anfang einer Zeile schliesst das Ende der
      // Zeile davor mit ein.
      const bottom = range.getBoundingClientRect().bottom;
      if (bottom > last + 1 && last > Number.NEGATIVE_INFINITY) breaks.push({ node: text, at });
      last = Math.max(last, bottom);
    }
  }
  const original = [...title.childNodes].map((child) => child.cloneNode(true));
  // Von hinten nach vorn: So bleiben die gemerkten Stellen im selben Textknoten gültig.
  for (const { node, at } of breaks.reverse()) {
    node.splitText(at);
    if (node.data.endsWith('\u00AD')) node.data = `${node.data.slice(0, -1)}-`;
    node.after(document.createElement('br'));
  }
  return () => title.replaceChildren(...original);
}

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
        const restore = holdLines(title);
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
            restore();
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
 * (`wait`) und bekommen `in`, sobald sie hereinkommen, Bilder erst ab einem Viertel. Was beim
 * Start schon zu sehen ist, bleibt einfach stehen. Ohne dieses Skript (reduzierte Bewegung, kein
 * JavaScript) ist alles von Anfang an sichtbar.
 */
function initEntrances(): { resolveAll(): void } {
  const elements = document.querySelectorAll<HTMLElement>('main [data-enter]');
  const parked = new Map<HTMLElement, number>();
  let first = true;

  const unpark = (element: HTMLElement) => {
    window.clearTimeout(parked.get(element));
    parked.delete(element);
  };

  /*
   * Zustand setzen. Ein Auftritt, der ein Bild umschliesst (der Sucher um das Porträt), folgt
   * dem Bild: Ecken, Linie und Bildtext beginnen, wenn das Foto aufsteigt.
   */
  const settle = (element: HTMLElement, state: '' | 'in') => {
    element.dataset.enter = state;
    if (!element.classList.contains('enter-unveil')) return;
    const outer = element.parentElement?.closest<HTMLElement>('main [data-enter="wait"]');
    if (!outer) return;
    observer.unobserve(outer);
    outer.dataset.enter = state;
  };

  const awaitImage = (element: HTMLElement, image: HTMLImageElement) => {
    let timer = 0;
    const done = (loaded: boolean) => {
      window.clearTimeout(timer);
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      // Inzwischen angehalten (resolveAll): Es steht schon alles.
      if (element.dataset.enter !== 'wait') return;
      settle(element, loaded && !jumping() ? 'in' : '');
    };
    const onLoad = () => done(true);
    const onError = () => done(false);
    timer = window.setTimeout(() => done(false), IMAGE_WAIT_MS);
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
  };

  /** Auftritt beginnen; `index`: Platz in einer Folge gemeinsam hereinkommender Bilder */
  const enter = (element: HTMLElement, index: number) => {
    unpark(element);
    observer.unobserve(element);
    // Mitten in einem Sprung: kein Auftritt, das Ziel steht bei der Ankunft fertig da.
    if (jumping()) return settle(element, '');
    if (!element.classList.contains('enter-unveil')) return settle(element, 'in');
    const image = element.querySelector('img');
    if (image && !image.complete) return awaitImage(element, image);
    placeInRow(element, Math.min(index, MAX_INDEX));
    settle(element, 'in');
  };

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
        if (!entry.isIntersecting) {
          unpark(element);
          continue;
        }
        // Schon mit seinem Bild erledigt (settle), die Meldung war unterwegs.
        if (element.dataset.enter !== 'wait') {
          observer.unobserve(element);
          continue;
        }
        if (jumping()) {
          enter(element, 0);
          continue;
        }
        const unveil = element.classList.contains('enter-unveil');
        // Umschliesst es ein Bild, das noch wartet, beginnt es mit diesem (settle).
        if (!unveil && element.querySelector('.enter-unveil[data-enter="wait"]')) continue;
        if (unveil && entry.intersectionRatio < UNVEIL_AT) {
          if (!parked.has(element)) {
            parked.set(
              element,
              window.setTimeout(() => enter(element, 0), UNVEIL_PARK_MS),
            );
          }
          continue;
        }
        enter(element, unveil ? index++ : 0);
      }
      first = false;
    },
    { rootMargin: '0px 0px -8% 0px', threshold: [0, UNVEIL_AT] },
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
      for (const timer of parked.values()) window.clearTimeout(timer);
      parked.clear();
      for (const element of document.querySelectorAll<HTMLElement>(
        'main [data-enter="wait"], main [data-enter="in"]',
      )) {
        element.dataset.enter = '';
        // Ein Platz in einer Folge (placeInRow), dessen Auftritt nie begann, gilt nicht mehr.
        element.style.removeProperty('--enter-i');
        if (element.style.length === 0) element.removeAttribute('style');
      }
    },
  };
}

/**
 * Platz in einer Folge gemeinsam hereinkommender Bilder: `--enter-i` verzögert den Auftritt um
 * je `--stagger` (components.css). Danach wird der Wert wieder entfernt. Gezählt wird nur das
 * Ende der Enthüllung selbst (am Bild darin), nicht das anderer Auftritte (etwa der Ecken oder
 * der Linie im Sucher).
 */
function placeInRow(element: HTMLElement, index: number): void {
  if (index === 0) return;
  element.style.setProperty('--enter-i', String(index));
  const clear = (event: AnimationEvent) => {
    if (event.animationName !== 'unveil') return;
    element.style.removeProperty('--enter-i');
    if (element.style.length === 0) element.removeAttribute('style');
    element.removeEventListener('animationend', clear);
    element.removeEventListener('animationcancel', clear);
  };
  element.addEventListener('animationend', clear);
  element.addEventListener('animationcancel', clear);
}
