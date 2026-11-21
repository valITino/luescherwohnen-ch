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
 * Ein Bild öffnet sich erst, wenn ein Viertel seines Rahmens im Bild ist, bei hohen Rahmen (das
 * Porträt) schon bei einem Achtel der Fensterhöhe. Früher, gleich am unteren Rand, stiege es
 * grösstenteils unter dem Rand auf: Zu sehen wäre nur, wie zuletzt seine Oberkante ankommt. Später
 * stünde ein hoher Rahmen lange leer im Bild.
 */
const UNVEIL_AT = 0.25;
const UNVEIL_VIEW = 0.12;
/** Feine Stufen, damit der Observer auch den Anteil eines hohen Rahmens rechtzeitig meldet. */
const UNVEIL_STEPS = Array.from({ length: 26 }, (_, step) => step / 100);
/**
 * Bleibt ein Rahmen knapp darunter stehen, öffnet sich das Bild nach dieser Zeit trotzdem. Kurz:
 * Länger zu warten zeigt vom Aufsteigen nicht mehr, der Rahmen stünde nur länger leer da.
 */
const UNVEIL_PARK_MS = 250;
/**
 * So lange darf ein Bild, das noch lädt (langsames Netz, schnelles Wischen), seinen Auftritt
 * hinauszögern. Danach verzichtet es darauf (`late`) und blendet ein, sobald es geladen ist
 * (`loaded`), statt dass der Ausschnitt über einen leeren Rahmen steigt und das Foto nachspringt.
 */
const IMAGE_WAIT_MS = 500;
/**
 * Kommt das Foto auch danach nicht (das Netz hängt), zeigt der Rahmen nach dieser Zeit wieder
 * seine Sandfläche wie ohne Auftritt, statt leer zu bleiben.
 */
const IMAGE_GIVE_UP_MS = 3000;
/**
 * Hält man an, während etwas Wartendes erst im untersten Streifen steht, beginnt es nach dieser
 * Ruhe trotzdem, sofern mindestens REST_MIN_PX davon zu sehen sind (openResting).
 */
const REST_MS = 300;
const REST_MIN_PX = 16;
/** Der leichte Zoom, aus dem sich ein Bild setzt (components.css, @keyframes unveil). */
const UNVEIL_ZOOM = 1.1;

/** Steht genug vom Rahmen im Bild, dass sein Bild sich öffnen darf? Liest nur Gemessenes. */
const unveilReached = (entry: IntersectionObserverEntry) =>
  entry.intersectionRect.height >=
  Math.min(entry.boundingClientRect.height * UNVEIL_AT, window.innerHeight * UNVEIL_VIEW) - 1;

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
        // Der Name für Screenreader bleibt der Text ohne den sichtbar gesetzten Trennstrich.
        const name = (title.textContent ?? '')
          .replace(/\u00AD/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const restore = holdLines(title);
        const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' });
        if (title.hasAttribute('aria-label')) title.setAttribute('aria-label', name);
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
 * (`wait`) und bekommen `in`, sobald sie hereinkommen, Bilder erst, wenn genug vom Rahmen zu
 * sehen ist (unveilReached). Was beim Start schon zu sehen ist, bleibt einfach stehen. Ohne
 * dieses Skript (reduzierte Bewegung, kein JavaScript) ist alles von Anfang an sichtbar.
 */
function initEntrances(): { resolveAll(): void } {
  const elements = document.querySelectorAll<HTMLElement>('main [data-enter]');
  // Rahmen knapp unter der Schwelle und ihr gemeinsamer Zeitgeber (eine Folge je Meldung)
  const parked = new Map<HTMLElement, number>();
  // Wartende, die schon im Fenster stehen, aber noch im untersten Streifen (openResting)
  const resting = new Set<HTMLElement>();
  let rest = 0;
  let first = true;

  /** Nicht mehr auf eine Schwelle, eine Ruhepause oder einen Zeitgeber warten. */
  const release = (element: HTMLElement) => {
    parked.delete(element);
    resting.delete(element);
    observer.unobserve(element);
    edge.unobserve(element);
  };

  /*
   * Zustand setzen. Ein Auftritt, der ein Bild umschliesst (der Sucher um das Porträt), folgt
   * dem Bild: Ecken, Linie und Bildtext beginnen, wenn das Foto aufsteigt. Kommt das Foto zu spät
   * (`late`), stehen sie einfach da.
   */
  const settle = (element: HTMLElement, state: '' | 'in' | 'late') => {
    element.dataset.enter = state;
    if (!element.classList.contains('enter-unveil')) return;
    const outer = element.parentElement?.closest<HTMLElement>('main [data-enter="wait"]');
    if (!outer) return;
    release(outer);
    outer.dataset.enter = state === 'in' ? 'in' : '';
  };

  const awaitImage = (element: HTMLElement, image: HTMLImageElement) => {
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    };
    const onLoad = () => {
      stop();
      // Inzwischen angehalten (resolveAll): Es steht schon alles.
      if (element.dataset.enter === 'wait') {
        if (jumping()) return settle(element, '');
        riseFromFold(element, image);
        settle(element, 'in');
      } else if (element.dataset.enter === 'late') {
        element.dataset.enter = 'loaded';
      }
    };
    const onError = () => {
      stop();
      if (element.dataset.enter === 'wait' || element.dataset.enter === 'late') {
        settle(element, '');
      }
    };
    timer = window.setTimeout(() => {
      if (element.dataset.enter !== 'wait') return;
      settle(element, 'late');
      // Kommt es gar nicht (das Netz hängt), zeigt der Rahmen wieder seine Sandfläche. Das Foto
      // erscheint darauf, sobald es doch noch ankommt, wie ohne Auftritt.
      timer = window.setTimeout(() => {
        if (element.dataset.enter !== 'late') return;
        stop();
        settle(element, '');
      }, IMAGE_GIVE_UP_MS);
    }, IMAGE_WAIT_MS);
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
  };

  /** Auftritt beginnen; `index`: Platz in einer Folge gemeinsam hereinkommender Bilder */
  const enter = (element: HTMLElement, index: number) => {
    release(element);
    // Mitten in einem Sprung: kein Auftritt, das Ziel steht bei der Ankunft fertig da.
    if (jumping()) return settle(element, '');
    if (!element.classList.contains('enter-unveil')) return settle(element, 'in');
    const image = element.querySelector('img');
    if (image && !image.complete) return awaitImage(element, image);
    placeInRow(element, Math.min(index, MAX_INDEX));
    if (image) riseFromFold(element, image);
    settle(element, 'in');
  };

  /** Umschliesst es ein Bild, das noch wartet? Dann beginnt es mit diesem (settle). */
  const followsImage = (element: HTMLElement) =>
    !element.classList.contains('enter-unveil') &&
    element.querySelector('.enter-unveil[data-enter="wait"]') !== null;

  /*
   * Rahmen, die in derselben Meldung knapp unter der Schwelle bleiben, teilen sich einen
   * Zeitgeber: Öffnen sie sich, dann wie eine Folge nacheinander. Wer inzwischen gegangen oder
   * schon aufgetreten ist, fällt heraus.
   */
  const park = (batch: HTMLElement[]) => {
    const timer = window.setTimeout(() => {
      let index = 0;
      for (const element of batch) if (parked.get(element) === timer) enter(element, index++);
    }, UNVEIL_PARK_MS);
    for (const element of batch) parked.set(element, timer);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      // Eine Meldung, die erst nach dem Pausieren eintrifft, lässt nichts mehr warten.
      if (motionPaused()) return;
      // Bilder, die in derselben Meldung hereinkommen, öffnen sich nacheinander (in der
      // Reihenfolge des Dokuments, also von links nach rechts). Ein einzelnes Bild startet sofort.
      let index = 0;
      const parking: HTMLElement[] = [];
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (first) {
          // Beim ersten Bericht schon zu sehen oder darüber: kein Auftritt, es steht ja schon da.
          // Alles darunter wartet ausserhalb des Bildes auf seinen Auftritt.
          if (alreadySeen(entry)) {
            observer.unobserve(element);
          } else {
            element.dataset.enter = 'wait';
            edge.observe(element);
          }
          continue;
        }
        if (!entry.isIntersecting) {
          parked.delete(element);
          continue;
        }
        // Schon mit seinem Bild erledigt (settle), die Meldung war unterwegs.
        if (element.dataset.enter !== 'wait') {
          release(element);
          continue;
        }
        if (jumping()) {
          enter(element, 0);
          continue;
        }
        const unveil = element.classList.contains('enter-unveil');
        if (followsImage(element)) continue;
        if (unveil && !unveilReached(entry)) {
          if (!parked.has(element)) parking.push(element);
          continue;
        }
        enter(element, unveil ? index++ : 0);
      }
      if (parking.length > 0) park(parking);
      first = false;
    },
    { rootMargin: '0px 0px -8% 0px', threshold: UNVEIL_STEPS },
  );

  /*
   * Hält man an, während etwas Wartendes erst im untersten Streifen des Fensters steht (unter der
   * Schwelle des Observers), beginnt es nach einer kurzen Ruhe trotzdem: Was man beim Anhalten
   * sieht, bleibt nicht leer. Solange gescrollt wird, entscheidet die Schwelle, dann kommt mehr
   * vom Rahmen ins Bild, bevor er sich öffnet. Gemessen wird erst in der Ruhe, ein Mal.
   */
  const openResting = () => {
    if (motionPaused() || jumping()) return;
    const ready = [...resting].filter((element) => {
      if (element.dataset.enter !== 'wait') {
        release(element);
        return false;
      }
      if (parked.has(element) || followsImage(element)) return false;
      const { top, bottom } = element.getBoundingClientRect();
      return Math.min(bottom, window.innerHeight) - Math.max(top, 0) >= REST_MIN_PX;
    });
    let index = 0;
    for (const element of ready) {
      enter(element, element.classList.contains('enter-unveil') ? index++ : 0);
    }
  };
  const awaitRest = () => {
    window.clearTimeout(rest);
    if (resting.size > 0) rest = window.setTimeout(openResting, REST_MS);
  };
  // Am ganzen Fenster gemessen, nicht am verkleinerten Bereich des Observers.
  const edge = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (element.dataset.enter !== 'wait') {
        release(element);
      } else if (!entry.isIntersecting) {
        resting.delete(element);
      } else if (jumping()) {
        // Was am Ziel eines Sprungs schon im Bild ist, steht einfach da (wie im Observer oben).
        enter(element, 0);
      } else {
        resting.add(element);
      }
    }
    awaitRest();
  });
  window.addEventListener(
    'scroll',
    () => {
      if (resting.size > 0) awaitRest();
    },
    { passive: true },
  );

  elements.forEach((element) => observer.observe(element));

  return {
    /**
     * Alles, was noch wartet, steht sofort da; beobachtet wird nichts mehr. Auch was schon
     * aufgetreten ist (auch ein spät geladenes Foto), verliert seinen Auftritt: Sonst fänden die
     * Regeln in components.css nach dem Fortsetzen wieder ihren Zustand und spielten ihn ein
     * zweites Mal.
     */
    resolveAll() {
      observer.disconnect();
      edge.disconnect();
      window.clearTimeout(rest);
      resting.clear();
      for (const timer of new Set(parked.values())) window.clearTimeout(timer);
      parked.clear();
      for (const element of document.querySelectorAll<HTMLElement>(
        'main [data-enter]:not([data-enter=""])',
      )) {
        element.dataset.enter = '';
        // Ein Platz in einer Folge (placeInRow) oder ein Beginn an der Fensterkante
        // (riseFromFold), deren Auftritt nie begann, gelten nicht mehr.
        element.style.removeProperty('--enter-i');
        element.style.removeProperty('--unveil-from');
        if (element.style.length === 0) element.removeAttribute('style');
      }
    },
  };
}

/**
 * Setzt einen Wert am Rahmen für die Dauer der Enthüllung; danach ist das Markup wieder wie
 * zuvor. Gezählt wird nur das Ende der Enthüllung selbst (am Bild darin), nicht das anderer
 * Auftritte (etwa der Ecken oder der Linie im Sucher).
 */
function holdForUnveil(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
  const clear = (event: AnimationEvent) => {
    if (event.animationName !== 'unveil') return;
    element.style.removeProperty(property);
    if (element.style.length === 0) element.removeAttribute('style');
    element.removeEventListener('animationend', clear);
    element.removeEventListener('animationcancel', clear);
  };
  element.addEventListener('animationend', clear);
  element.addEventListener('animationcancel', clear);
}

/**
 * Platz in einer Folge gemeinsam hereinkommender Bilder: `--enter-i` verzögert den Auftritt um
 * je `--stagger` (components.css).
 */
function placeInRow(element: HTMLElement, index: number): void {
  if (index === 0) return;
  holdForUnveil(element, '--enter-i', String(index));
}

/**
 * Steht erst der obere Teil des Bildes im Fenster, beginnt der Ausschnitt an der Fensterkante
 * statt am unteren Rand des Rahmens (`--unveil-from`, components.css): So spielt sich das ganze
 * Aufsteigen dort ab, wo man hinsieht, statt zum grössten Teil darunter. Steht das Bild ganz im
 * Fenster, beginnt es wie immer unten.
 */
function riseFromFold(element: HTMLElement, image: HTMLImageElement): void {
  const { top, height } = image.getBoundingClientRect();
  if (!(height > 0)) return;
  const fold = (window.innerHeight - top) / height;
  if (fold <= 0 || fold >= 1) return;
  // Das Bild setzt sich aus einem Zoom um seine Mitte: Die sichtbare Kante liegt darum um den
  // Zoom weiter von der Mitte entfernt als die Kante des Ausschnitts.
  const from = (fold - 0.5) / UNVEIL_ZOOM + 0.5;
  holdForUnveil(element, '--unveil-from', `${(from * 100).toFixed(2)}%`);
}
