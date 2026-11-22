/**
 * Firmengeschichte «Jahr für Jahr»: Die Jahre gehen mit dem Scrollen weiter.
 *
 * Im HTML steht eine Zeitleiste mit allen sechs Momenten; so bleibt sie ohne dieses Skript, bei
 * reduzierter Bewegung, im Druck und wo die Bühne nicht ins Fenster passt. Sonst wird sie zur
 * Bühne (scroll.css, `data-deck`): Sie bleibt unter dem Header stehen, solange die Jahre
 * durchlaufen, und die Karte des nächsten Jahrs schiebt sich über die des vorherigen. Niemand
 * muss dafür etwas anklicken.
 *
 * Was sich dabei bewegt, rechnet der Browser selbst aus der Scrollposition (scroll.css). Dieses
 * Skript führt nur nach, welches Jahr gerade gilt: für die Achse (Punkt, `aria-current`), für
 * «Weiter» und für Browser ohne scrollgekoppelte Animationen. Dort und bei angehaltener Bewegung
 * wechseln die Karten in Schritten statt mit dem Finger.
 *
 * Die Knöpfe der Achse und «Weiter» bleiben als Abkürzung: Sie scrollen an die Stelle ihres
 * Jahrs. Der Zustand hängt also immer an der Scrollposition, ob gescrollt oder geklickt wurde.
 *
 * Ob Bewegung erwünscht ist, entscheidet das CSS; das Skript liest es an `--yr-deck` ab, statt
 * die Bedingung zu wiederholen. Ob die Bühne ins Fenster passt, misst das Skript (Handy quer,
 * niedriges Fenster, starker Zoom): Passt sie nicht, bleibt die Zeitleiste, und nichts wird
 * abgeschnitten. Mit oder ohne Bühne ist die Seite verschieden lang. Darum gilt:
 * - Entschieden wird, sobald der Abschnitt ausgelegt ist (home.ts, `data-laid`), also bevor
 *   jemand dort ankommt und bevor ein Sprung zu einer Marke sein Ziel rechnet.
 * - Gemessen wird am Layout, ohne Verschiebungen: Beim Hereinscrollen steht der Inhalt der Bühne
 *   noch etwas tiefer (scroll.css), das zählte sonst als «passt nicht».
 * - Neu entschieden wird nur, wenn sich etwas ändert, woran die Passform hängt (Breite, Höhe des
 *   kleinsten Fensters, Schriftgrösse): Die Adressleiste am Handy ändert nichts davon.
 * - Schaltet die Bühne später um (Handy gedreht), bleibt der Leser an seiner Stelle.
 */
import { motionPaused, onMotionPausedChange, whileInView } from '@luescher/ui/motion';
import type { SmoothScroll } from '@luescher/ui/motion/smooth';
import { blockOf, rememberedView, scrollTopFor } from './position.ts';

/** Im Schrittbetrieb gilt das nächste Jahr, sobald seine Karte halb gestiegen wäre. */
const fallback = { span: 5.5, rise: 0.75 };

/** Mit dem Finger geführt gilt es, sobald die Linie seinen Punkt erreicht (ein Hauch davor). */
const ARRIVAL = 0.04;

interface Track {
  /** Scrollposition, an der die Bühne stehen bleibt */
  start: number;
  /** Scrollweg, auf dem die Jahre durchlaufen */
  distance: number;
  span: number;
  rise: number;
}

/** Wo der Leser steht, bevor die Bühne umschaltet */
interface Place {
  /** in der Firmengeschichte selbst */
  inside: boolean;
  /** schon dahinter (Kontakt, Footer) */
  below: boolean;
  /** Oberkante des Abschnitts danach, im Fenster gemessen */
  after: number | null;
}

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
  /** Der Abschnitt nach der Firmengeschichte: An ihm misst sich, ob die Seite verrutscht ist. */
  const after = root.closest('main > *')?.nextElementSibling ?? null;

  // Meldung für Screenreader, wenn ein Knopf das Jahr gewechselt hat: «1959, 3 von 6».
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  root.append(status);

  /*
   * Höhe des kleinsten Fensters (mit eingeblendeter Adressleiste), an der die Bühne hängt (`svh`).
   * Gemessen an einem unsichtbaren Stück ohne Fläche; `window.innerHeight` schwankt am Handy mit
   * der Adressleiste. Ohne `svh` im Browser gilt die Bühne ohnehin nicht (scroll.css).
   */
  const probe = document.createElement('i');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.setProperty('position', 'fixed');
  probe.style.setProperty('top', '0');
  probe.style.setProperty('left', '0');
  probe.style.setProperty('width', '0');
  probe.style.setProperty('height', '100svh');
  probe.style.setProperty('visibility', 'hidden');
  probe.style.setProperty('pointer-events', 'none');
  document.body.append(probe);

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

  /** Gilt die Bühne? Und führt der Finger die Karten, oder wechseln sie in Schritten? */
  let deck = false;
  let led = false;
  /** Die Passform ist gemessen (davor gilt, was das CSS allein sagt). */
  let decided = false;
  /** Lage und Länge der Strecke im Layout; `null`: neu vermessen. */
  let track: Track | null = null;

  /** Sagt das CSS «Bühne» (Skript da, Bewegung erwünscht)? Liest nur Stil, vermisst nichts. */
  const wanted = () => getComputedStyle(root).getPropertyValue('--yr-deck').trim() === '1';
  const setLed = () => {
    led = deck && scrubs && !motionPaused();
  };
  /** Abstand für den Header, unter dem die Seite nach einem Sprung beginnt */
  const header = () =>
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  /** Lage im Layout, ohne Verschiebungen (was am Scrollen hängt, verschöbe sein Ziel selbst). */
  const layoutTop = (element: HTMLElement) => {
    let top = 0;
    for (
      let node: HTMLElement | null = element;
      node;
      node = node.offsetParent as HTMLElement | null
    ) {
      top += node.offsetTop;
    }
    return top;
  };

  const measure = (): Track => {
    const sticky = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const style = getComputedStyle(root);
    const number = (name: string, otherwise: number) =>
      Number.parseFloat(style.getPropertyValue(name)) || otherwise;
    // Solange die Bühne steht: von «Oberkante unter dem Header» bis «Unterkante am Ende».
    const held = Math.max(1, root.offsetHeight - stage.offsetHeight);
    /*
     * Geführt rechnet der Browser die Strecke am Fenster, wie es gerade ist. Am Handy ist es mit
     * ausgeblendeter Adressleiste höher als die Bühne (die mit dem kleinsten Fenster rechnet):
     * Karten und Linie sind dann etwas früher fertig, und das Skript rechnet gleich.
     */
    const guided = Math.max(1, Math.min(held, root.offsetHeight - (window.innerHeight - sticky)));
    return {
      // Die Bühne bleibt stehen, sobald ihre Oberkante unter dem Header ankommt.
      start: layoutTop(root) - sticky,
      distance: led ? guided : held,
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

  /**
   * Passt der Inhalt der Bühne in ihre Höhe? Gemessen an der Lage der Teile im Layout: Beim
   * Hereinscrollen stehen sie noch etwas tiefer (`translate`), und eine Messung über den
   * Überlauf zählte das mit. Wer heranscrollte, bekam dann die Zeitleiste, wer direkt landete,
   * die Bühne.
   */
  const fits = () => {
    const parts = [...stage.children].filter(
      (part): part is HTMLElement => part instanceof HTMLElement && part.offsetHeight > 0,
    );
    if (parts.length === 0) return true;
    const style = getComputedStyle(stage);
    const room =
      stage.clientHeight -
      Number.parseFloat(style.paddingTop) -
      Number.parseFloat(style.paddingBottom);
    const top = Math.min(...parts.map((part) => part.offsetTop));
    const bottom = Math.max(...parts.map((part) => part.offsetTop + part.offsetHeight));
    // Ein Pixel Spiel: Die Lagen im Layout sind auf ganze Pixel gerundet.
    return bottom - top <= room + 1;
  };

  /** Woran die Passform hängt. Ändert sich nichts davon, bleibt die Entscheidung. */
  let basis = '';
  const inputs = () =>
    [
      document.documentElement.clientWidth,
      probe.offsetHeight,
      getComputedStyle(document.documentElement).fontSize,
    ].join('|');

  const remember = (): Place => {
    const line = header() + 1;
    const box = root.getBoundingClientRect();
    return {
      inside: box.top <= line && box.bottom > line,
      below: box.bottom <= line,
      after: after ? after.getBoundingClientRect().top : null,
    };
  };

  const scrollNow = (top: number) => {
    const to = Math.max(0, Math.round(top));
    const lenis = smooth()?.lenis;
    if (lenis) lenis.scrollTo(to, { immediate: true, force: true });
    else window.scrollTo({ top: to, behavior: 'instant' });
  };

  /**
   * Die Bühne hat umgeschaltet, die Seite ist um ihre Strecke länger oder kürzer geworden. Wer
   * oberhalb der Firmengeschichte liest, merkt davon nichts: nichts zu tun. Wer in ihr stand,
   * steht jetzt an ihrem Anfang. Wer schon dahinter las (Kontakt, Footer), behält seine Stelle.
   *
   * Woran die Stelle festmachen? An der Ansicht, die sich die Seite beim letzten Halt gemerkt hat
   * (position.ts: Abschnitt und Lage). Die Lage im Fenster taugt dafür allein nicht: Hat sich
   * auch das Fenster geändert (gedreht, Höhe gezogen), hat der Browser die Seite schon neu
   * umbrochen, bevor dieses Skript etwas erfährt, und der Leser steht längst woanders.
   */
  const restore = (place: Place) => {
    smooth()?.lenis?.resize();
    if (!place.inside && !place.below) return;
    const start = () => layoutTop(root) - header();
    const view = rememberedView();
    const block = view ? blockOf(view) : null;
    if (view && block) {
      // In der Firmengeschichte: Der Abschnitt ist ihrer, und die Linie unter dem Header lag
      // schon in ihr (oder im Rand danach).
      const inHistory =
        block.contains(root) && header() - view.top >= layoutTop(root) - layoutTop(block) - 1;
      const top = inHistory ? start() : scrollTopFor(view);
      if (top !== null) scrollNow(top);
      return;
    }
    // Ohne gemerkte Ansicht: nach der Lage im Fenster vor dem Umschalten.
    if (place.inside) {
      scrollNow(start());
    } else if (after && place.after !== null) {
      const shift = after.getBoundingClientRect().top - place.after;
      if (Math.abs(shift) >= 1) scrollNow(window.scrollY + shift);
    }
  };

  /** Bühne oder Zeitleiste? Misst die Passform und schaltet um, ohne den Leser zu verschieben. */
  const decide = () => {
    decided = true;
    const was = deck;
    const place = remember();
    root.dataset.deck = '';
    let now = wanted();
    if (now && !fits()) {
      delete root.dataset.deck;
      now = false;
    }
    basis = inputs();
    deck = now;
    setLed();
    track = null;
    if (was !== now) restore(place);
    if (near) update();
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
      if (!decided) decide();
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
  deck = wanted();
  setLed();

  /*
   * Die Passform entscheiden, sobald der Abschnitt ausgelegt ist: home.ts legt ihn nach der
   * ersten Regung der Besucherin in einem ruhigen Moment aus und vor jedem Sprung sofort
   * (`data-laid`). So ist die Seite richtig lang, bevor ein Sprung sein Ziel rechnet. Steht der
   * Abschnitt schon (oder wird er nie zurückgestellt), gleich jetzt.
   */
  const section = root.closest<HTMLElement>('[data-lazy]');
  if (!section || 'laid' in section.dataset) {
    decide();
  } else {
    const laid = new MutationObserver(() => {
      if (!('laid' in section.dataset)) return;
      laid.disconnect();
      if (!decided) decide();
    });
    laid.observe(section, { attributes: true, attributeFilter: ['data-laid'] });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Erst rechnen, wenn die Firmengeschichte in die Nähe kommt (eine Fensterhöhe vorher).
  whileInView(
    root,
    (inView) => {
      near = inView;
      if (!inView) return;
      loadPhotos();
      // Sicherheitsnetz: Wer schneller hier ist, als der Abschnitt ausgelegt wurde.
      if (!decided) decide();
      else update();
    },
    { rootMargin: '100% 0px' },
  );
  window.addEventListener(
    'resize',
    () => {
      // Die Strecke hängt auch am Fenster, wie es gerade ist (Adressleiste): neu vermessen.
      track = null;
      if (decided && inputs() !== basis) decide();
      else if (near) update();
    },
    { passive: true },
  );
  // Die Seite über der Bühne wird länger (spät ausgelegte Teile, Schrift): neu vermessen.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      track = null;
    }).observe(document.body);
  }
  // Mit der Schrift ändern sich die Umbrüche auf den Karten: noch einmal messen.
  void document.fonts.ready.then(() => {
    if (decided) decide();
  });
  // Angehalten bleibt die Bühne, nur führt dann das Skript die Karten in Schritten.
  onMotionPausedChange(() => {
    setLed();
    track = null;
    if (near) update();
  });
  // Stellt jemand am Gerät die Bewegung um, gilt sofort die andere Form.
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    if (decided) decide();
    else {
      deck = wanted();
      setLed();
    }
  });
  window.addEventListener('hashchange', fromHash);
  fromHash();
}
