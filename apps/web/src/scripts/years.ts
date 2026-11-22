/**
 * Firmengeschichte «Jahr für Jahr»: Die Jahre gehen mit dem Scrollen weiter.
 *
 * Im HTML steht eine Zeitleiste mit allen sechs Momenten; so bleibt sie ohne dieses Skript, bei
 * reduzierter Bewegung, in niedrigen Fenstern und im Druck. Sonst wird sie zur Bühne (scroll.css,
 * `data-deck`): Sie bleibt unter dem Header stehen, solange die Jahre durchlaufen, und die Karte
 * des nächsten Jahrs schiebt sich über die des vorherigen. Niemand muss dafür etwas anklicken.
 *
 * Was sich dabei bewegt, rechnet der Browser selbst aus der Scrollposition (scroll.css). Dieses
 * Skript führt nur nach, welches Jahr gerade gilt: für die Achse (Punkt, `aria-current`), für
 * «Weiter» und für Browser ohne scrollgekoppelte Animationen. Dort und bei angehaltener Bewegung
 * wechseln die Karten in Schritten statt mit dem Finger.
 *
 * Die Knöpfe der Achse und «Weiter» bleiben als Abkürzung: Sie scrollen an die Stelle ihres
 * Jahrs. Der Zustand hängt also immer an der Scrollposition, ob gescrollt oder geklickt wurde.
 *
 * Ob die Bühne gilt, entscheidet allein das CSS (Bewegung erwünscht, Fenster hoch genug); das
 * Skript liest es an `--yr-deck` ab, statt die Bedingungen zu wiederholen. Passt die Bühne einmal
 * nicht in ihr Fenster (starker Zoom, sehr lange Zeilen), nimmt das Skript sie zurück: Dann steht
 * wieder die Zeitleiste da, und nichts wird abgeschnitten.
 */
import { motionPaused, onMotionPausedChange, whileInView } from '@luescher/ui/motion';
import type { SmoothScroll } from '@luescher/ui/motion/smooth';

/** Im Schrittbetrieb gilt das nächste Jahr, sobald seine Karte halb gestiegen wäre. */
const fallback = { span: 5.5, rise: 0.75 };

/** Mit dem Finger geführt gilt es, sobald die Linie seinen Punkt erreicht (ein Hauch davor). */
const ARRIVAL = 0.04;

export function initYears(root: HTMLElement, smooth: () => SmoothScroll | null): void {
  const stage = root.querySelector<HTMLElement>('.history-stage');
  const axis = root.querySelector<HTMLElement>('[data-years-axis]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-years-to]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-years-item]')];
  const next = root.querySelector<HTMLButtonElement>('[data-years-next]');
  const nextText = next?.querySelector<HTMLElement>('[data-years-next-text]');
  if (!stage || !axis || items.length < 2 || buttons.length !== items.length) return;

  const count = items.length;
  const names = buttons.map((button) => (button.textContent ?? '').trim());
  const scrubs = CSS.supports('animation-timeline: view()');

  // Meldung für Screenreader, wenn ein Knopf das Jahr gewechselt hat: «1959, 3 von 6».
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  root.append(status);

  let index = -1;
  const show = (to: number) => {
    if (to === index) return;
    index = to;
    items.forEach((item, at) => {
      item.toggleAttribute('data-on', at === to);
      item.toggleAttribute('data-past', at < to);
    });
    buttons.forEach((button, at) => {
      if (at === to) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.toggleAttribute('data-past', at < to);
    });
    // Schrittbetrieb: Die Linie wächst bis zum aktuellen Jahr (CSS-Übergang).
    axis.style.setProperty('--yr-p', String(to / (count - 1)));
    if (next && nextText) {
      const wraps = to === count - 1;
      const text = wraps ? `Zurück zu ${names[0]}` : `Weiter: ${names[to + 1]}`;
      nextText.textContent = text;
      next.setAttribute('aria-label', text);
    }
  };

  /** Gilt die Bühne (CSS)? Und führt der Finger die Karten, oder wechseln sie in Schritten? */
  let deck = false;
  let led = false;
  /** Lage und Länge der Strecke im Layout; `null`: neu vermessen. */
  let track: { start: number; distance: number; span: number; rise: number } | null = null;

  const measure = () => {
    let top = 0;
    for (
      let node: HTMLElement | null = root;
      node;
      node = node.offsetParent as HTMLElement | null
    ) {
      top += node.offsetTop;
    }
    const style = getComputedStyle(root);
    const number = (name: string, otherwise: number) =>
      Number.parseFloat(style.getPropertyValue(name)) || otherwise;
    return {
      // Die Bühne bleibt stehen, sobald ihre Oberkante unter dem Header ankommt.
      start: top - (Number.parseFloat(getComputedStyle(stage).top) || 0),
      distance: Math.max(1, root.offsetHeight - stage.offsetHeight),
      span: number('--yr-span', fallback.span),
      rise: number('--yr-rise', fallback.rise),
    };
  };

  const update = () => {
    if (!deck) return;
    track ??= measure();
    const done = Math.min(1, Math.max(0, (window.scrollY - track.start) / track.distance));
    const lead = led ? ARRIVAL : track.rise / 2;
    show(Math.min(count - 1, Math.max(0, Math.floor(done * track.span + lead))));
  };

  let ticking = false;
  let near = false;
  const onScroll = () => {
    if (ticking || !near || !deck) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  /** Grösse des Fensters, in der die Bühne nicht passte: Bis sie sich ändert, bleibt die Zeitleiste. */
  let unfit = '';
  const size = () => `${window.innerWidth}x${window.innerHeight}`;

  /** Nach allem, was die Bühne ein- oder ausschalten oder verschieben kann. */
  const refresh = () => {
    const before = deck ? track : null;
    track = null;
    deck = getComputedStyle(root).getPropertyValue('--yr-deck').trim() === '1';
    led = deck && scrubs && !motionPaused();
    /*
     * Die Bühne ist weg (Handy gedreht, Fenster verkleinert) und die Seite darum um ihre ganze
     * Strecke kürzer: Wer auf der Bühne stand, stünde sonst plötzlich weit unten im Kontakt.
     * Er bleibt in der Firmengeschichte, am Anfang der Zeitleiste.
     */
    if (before && !deck) {
      const y = window.scrollY;
      if (y >= before.start && y <= before.start + before.distance + stage.offsetHeight) {
        const header =
          Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const top = Math.max(0, Math.round(measure().start - header));
        const lenis = smooth()?.lenis;
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: 'instant' });
      }
    }
    if (near) update();
  };

  /** Ragt etwas aus der stehenden Bühne, wäre es unerreichbar: zurück zur Zeitleiste. */
  const fit = () => {
    if (!deck || stage.scrollHeight <= stage.clientHeight + 1) return;
    unfit = size();
    delete root.dataset.deck;
    refresh();
  };

  /** An die Stelle eines Jahrs scrollen; `instant`: ohne Gleiten (Adresse mit Marke). */
  const go = (to: number, instant = false) => {
    if (!deck) return;
    track ??= measure();
    // Ein Pixel hinter der Stelle, an der die Karte ganz angekommen ist.
    const top = Math.round(track.start + (track.distance * to) / track.span) + (to > 0 ? 1 : 0);
    const still = instant || motionPaused();
    const lenis = smooth()?.lenis;
    if (lenis) lenis.scrollTo(top, { immediate: still, force: true });
    else window.scrollTo({ top, behavior: still ? 'instant' : 'smooth' });
  };

  const announce = (to: number) => {
    status.textContent = `${names[to]}, ${to + 1} von ${count}`;
  };

  buttons.forEach((button, at) => {
    button.addEventListener('click', () => {
      announce(at);
      go(at);
    });
    // Pfeile, Pos1 und Ende wandern auf der Achse (wie in einer Werkzeugleiste).
    button.addEventListener('keydown', (event) => {
      const to =
        event.key === 'ArrowRight'
          ? at + 1
          : event.key === 'ArrowLeft'
            ? at - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? count - 1
                : null;
      if (to === null) return;
      event.preventDefault();
      buttons[(to + count) % count]!.focus();
    });
  });
  next?.addEventListener('click', () => {
    const to = (Math.max(0, index) + 1) % count;
    announce(to);
    go(to);
  });

  // Eine Marke in der Adresse (#jahr-1983) zeigt ihr Jahr. Als Zeitleiste erledigt das der Browser.
  const fromHash = () => {
    const at = items.findIndex((item) => item.id === window.location.hash.slice(1));
    if (at < 0) return;
    requestAnimationFrame(() => {
      refresh();
      go(at, true);
    });
  };

  /*
   * Auf der Bühne wartet jede Karte verborgen unter dem Rahmen, bis sie dran ist. Der Browser
   * lüde ihr Foto (loading="lazy") darum erst, wenn sie schon steigt. Kommt die Firmengeschichte
   * in die Nähe, laden die Fotos gleich alle.
   */
  let photosWanted = false;
  const loadPhotos = () => {
    if (photosWanted) return;
    photosWanted = true;
    for (const image of root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
      image.loading = 'eager';
    }
  };

  show(0);
  root.dataset.deck = '';
  axis.hidden = false;
  if (next) next.hidden = false;
  // Nur Stil gelesen, nichts vermessen: Der Abschnitt ist beim Laden noch gar nicht ausgelegt.
  deck = getComputedStyle(root).getPropertyValue('--yr-deck').trim() === '1';
  led = deck && scrubs && !motionPaused();

  window.addEventListener('scroll', onScroll, { passive: true });
  // Erst rechnen, wenn die Firmengeschichte in die Nähe kommt (eine Fensterhöhe vorher).
  whileInView(
    root,
    (inView) => {
      near = inView;
      if (!inView) return;
      loadPhotos();
      refresh();
      fit();
    },
    { rootMargin: '100% 0px' },
  );
  window.addEventListener(
    'resize',
    () => {
      // Neues Fenster, neuer Versuch: Vielleicht passt die Bühne jetzt.
      if (unfit && unfit !== size()) {
        unfit = '';
        root.dataset.deck = '';
      }
      refresh();
      if (near) fit();
    },
    { passive: true },
  );
  // Die Seite über der Bühne wird länger (spät ausgelegte Teile, Schrift): neu vermessen.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      track = null;
    }).observe(document.body);
  }
  void document.fonts.ready.then(() => {
    track = null;
    if (near) fit();
  });
  onMotionPausedChange(refresh);
  window.addEventListener('hashchange', fromHash);
  fromHash();
}
