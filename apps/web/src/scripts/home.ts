/**
 * Einstieg der Startseite.
 * Zuerst das Nötige für den ersten Eindruck (Header, Hero mit Uhrzeit und Öffnungsstatus),
 * danach in Ruhe das Beiwerk. Smooth Scroll und die Scroll-Animationen (GSAP, Lenis) laden
 * erst, wenn jemand die Seite benutzt.
 * Das Kontaktformular lädt erst, wenn es in Sicht kommt.
 */
import { motionAllowed, onceInView } from '@luescher/ui/motion';
import type { SmoothScroll } from '@luescher/ui/motion/smooth';
import { initMotionToggle, initProgress } from './chrome.ts';
import { initHeader } from './header.ts';
import { initHero, initOpenStatus } from './hero.ts';
import { rememberView, scrollTopFor, storedView } from './position.ts';

let smooth: SmoothScroll | null = null;

/** Später, wenn der Browser Luft hat: hält die Arbeit beim Start in kleinen Portionen. */
const idle = (callback: () => void) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 1200 });
  else setTimeout(callback, 200);
};

// ---------------------------------------------------------------- Sofort: der erste Eindruck

initHeader(() => smooth);

const hero = document.querySelector<HTMLElement>('[data-hero]');
if (hero) initHero(hero);

// Öffnungsstatus überall dort, wo er steht (Hero und Kontakt)
document.querySelectorAll<HTMLElement>('[data-open-status]').forEach(initOpenStatus);

// --- Kontaktformular: erst laden, wenn es in Sicht kommt ---
const contact = document.querySelector<HTMLFormElement>('[data-contact]');
if (contact) {
  let loading: Promise<void> | null = null;
  let ready = false;
  const loadContact = () =>
    (loading ??= import('./contact.ts').then((module) => {
      module.initContact(contact);
      ready = true;
    }));

  /*
   * Bis das Skript des Formulars da ist, darf «Anfrage senden» nie den Browser selbst senden
   * lassen. Wer so früh klickt, wartet kurz: Sobald das Skript geladen ist, läuft das Absenden
   * normal weiter. Lädt es gar nicht, erscheint die Fehlermeldung mit der Telefonnummer.
   */
  contact.addEventListener('submit', (event) => {
    if (ready) return; // contact.ts hat übernommen
    event.preventDefault();
    loadContact().then(
      () => contact.requestSubmit(),
      () => {
        loading = null;
        const failure = contact.querySelector<HTMLElement>('[data-form-error]');
        if (failure) failure.hidden = false;
      },
    );
  });

  onceInView(
    contact,
    () => {
      loadContact().catch(() => {
        // Beim Absenden wird es nochmals versucht (siehe oben).
        loading = null;
      });
    },
    { rootMargin: '800px 0px' },
  );
}

// ---------------------------------------------------------------- Gleich danach: Beiwerk

// Jedes Stück in einem eigenen ruhigen Moment, damit keines den Browser lange aufhält.
idle(() => {
  // Dauerbewegung gibt es nur im Band; der Schalter erscheint nur, wenn es auf der Seite ist.
  initMotionToggle(document.querySelector('[data-ticker]') !== null);
});

// --- Band: Pause-Button ---
idle(() => {
  const ticker = document.querySelector<HTMLElement>('[data-ticker]');
  const tickerToggle = ticker?.querySelector<HTMLButtonElement>('[data-ticker-toggle]');
  const tickerLabel = ticker?.querySelector<HTMLElement>('[data-ticker-label]');
  if (ticker && tickerToggle && tickerLabel) {
    tickerToggle.addEventListener('click', () => {
      const paused = ticker.classList.toggle('is-paused');
      tickerLabel.textContent = paused ? 'Band fortsetzen' : 'Band anhalten';
    });
  }
});

// --- Fortschritt am Rand ---
idle(initProgress);

// ---------------------------------------------------------------- Der Rest der Seite

/*
 * Die Teile weit unter dem ersten Bildschirm hat der Browser übersprungen (global.css, data-lazy).
 * Sie werden nachgeholt, sobald jemand die Seite benutzt: der Reihe nach in ruhigen Momenten.
 * Vor einem Sprung zu einer Marke (Link, Adresse mit #, wiederhergestellte Position) sofort alle,
 * damit das Ziel genau stimmt.
 */
const lazy = [...document.querySelectorAll<HTMLElement>('[data-lazy]')];
let catchingUp = false;

/*
 * Ein Teil gilt zuerst als «neu» ausgelegt: Solange blendet darin nichts über (global.css).
 * Zwei Bilder später ist er fertig; einer pro Bild, damit auch das in kleinen Portionen bleibt.
 */
const fresh: HTMLElement[] = [];
let settling = false;
const settle = () => {
  const element = fresh.shift();
  if (!element) {
    settling = false;
    return;
  }
  element.dataset.laid = '';
  requestAnimationFrame(settle);
};
const layOut = (element: HTMLElement) => {
  element.dataset.laid = 'new';
  fresh.push(element);
  if (settling) return;
  settling = true;
  requestAnimationFrame(() => requestAnimationFrame(settle));
};

const layOutNow = () => {
  if (lazy.length === 0) return;
  for (const element of lazy.splice(0)) layOut(element);
  // Das sanfte Scrollen kennt die Seitenlänge nur von früher: sofort neu vermessen,
  // sonst endet der Sprung an der alten, zu kurzen Grenze.
  smooth?.lenis?.resize();
};

const layOutSoon = () => {
  if (catchingUp) return;
  catchingUp = true;
  const step = () => {
    const element = lazy.shift();
    if (!element) return;
    layOut(element);
    // Layout gleich hier auslösen, damit jeder Teil seine eigene kleine Portion bleibt.
    void element.offsetHeight;
    idle(step);
  };
  idle(step);
};

/*
 * Sprung zu einer Marke (Link, Adresse mit #, wiederhergestellte Position): Solange die Seite
 * dorthin unterwegs ist, trägt <html> `data-jump`. reveal.ts spielt dann keine Auftritte und
 * teilt keine Überschriften, so landet der Sprung auf fertigem Inhalt. Die Marke fällt, sobald
 * Lenis nicht mehr gleitet und zehn Bilder lang kein Scrollen kam, spätestens nach vier Sekunden.
 * Gezählt wird in Bildern, nicht in Millisekunden: Stockt die Darstellung kurz (schwaches Gerät,
 * Speicherbereinigung), lief ein Zeitgeber mitten im Sprung ab, und das Ziel trat doch noch auf.
 */
const JUMP_REST_FRAMES = 10;
const JUMP_MAX_MS = 4000;
let jumpMax = 0;
let restFrames = 0;
let watchingRest = false;
const jumping = () => 'jump' in document.documentElement.dataset;
const endJump = () => {
  window.clearTimeout(jumpMax);
  window.removeEventListener('scroll', resetRest);
  delete document.documentElement.dataset.jump;
};
function resetRest() {
  restFrames = 0;
}
const watchRest = () => {
  if (!jumping()) {
    watchingRest = false;
    return;
  }
  restFrames = smooth?.lenis?.isScrolling === 'smooth' ? 0 : restFrames + 1;
  if (restFrames >= JUMP_REST_FRAMES) {
    watchingRest = false;
    endJump();
    return;
  }
  requestAnimationFrame(watchRest);
};
const markJump = () => {
  document.documentElement.dataset.jump = '';
  restFrames = 0;
  // Derselbe Zuhörer zählt nur einmal, auch wenn ein Sprung den anderen ablöst.
  window.addEventListener('scroll', resetRest, { passive: true });
  window.clearTimeout(jumpMax);
  jumpMax = window.setTimeout(endJump, JUMP_MAX_MS);
  if (watchingRest) return;
  watchingRest = true;
  requestAnimationFrame(watchRest);
};

/*
 * Neu geladen oder über den Verlauf geöffnet: die gemerkte Ansicht wiederherstellen (position.ts).
 * Angesteuert wird sie mehrmals, denn dazwischen kann der Browser seine eigene, ungenaue
 * Wiederherstellung einschieben, und die Seite wächst noch (Anpinnen im Hero). Sobald jemand
 * selbst scrollt, ist Schluss.
 */
const view = storedView();
let restoring = view !== null;
const restoreView = () => {
  if (!restoring || !view) return;
  const top = scrollTopFor(view);
  if (top === null || Math.abs(top - window.scrollY) < 1) return;
  markJump();
  if (smooth?.lenis) {
    smooth.lenis.resize();
    smooth.lenis.scrollTo(top, { immediate: true, force: true });
  } else {
    window.scrollTo({ top, behavior: 'instant' });
  }
};
if (view) {
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
    window.addEventListener(
      type,
      () => {
        restoring = false;
      },
      { once: true, passive: true },
    );
  }
}

if (window.location.hash || window.scrollY > 0 || view) {
  if (window.location.hash || view) markJump();
  layOutNow();
  restoreView();
  if (view) {
    const again = () => {
      restoreView();
      requestAnimationFrame(restoreView);
      setTimeout(restoreView, 300);
    };
    if (document.readyState === 'complete') again();
    else window.addEventListener('load', again, { once: true });
  }
} else {
  for (const type of ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(type, layOutSoon, { once: true, passive: true });
  }
  // Wer nur liest, ohne etwas zu tun: nach einer Weile trotzdem.
  setTimeout(layOutSoon, 12_000);
}
// Ab jetzt die Ansicht merken (nur ein Zuhörer; gerechnet wird erst, wenn das Scrollen ruht).
rememberView();

// Sprung innerhalb der Seite: vor dem Scrollen alles berechnen (läuft vor dem sanften Scrollen).
document.addEventListener(
  'click',
  (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.pathname !== window.location.pathname || link.hash.length < 2) return;
    markJump();
    layOutNow();
    // Lenis erfährt eine neue Seitenlänge nur verzögert (entprellter ResizeObserver). Wurden
    // Teile gerade erst ausgelegt, endete der Sprung sonst an der alten, zu kurzen Grenze.
    smooth?.lenis?.resize();
  },
  true,
);
window.addEventListener('hashchange', () => {
  markJump();
  layOutNow();
});

// ---------------------------------------------------------------- Zuletzt: Smooth Scroll und Scroll-Animationen

/*
 * Lenis und GSAP braucht es erst, wenn jemand die Seite benutzt. Sie laden beim ersten
 * Lebenszeichen (Zeiger, Berührung, Taste, Scrollen), spätestens nach zwölf Sekunden. So bleibt
 * der Browser direkt nach dem Laden frei. Bei reduzierter Bewegung braucht es sie gar nicht:
 * Dann scrollt der Browser selbst, und nichts wird animiert.
 */
let scrollRequested = false;
const loadScroll = () => {
  if (scrollRequested) return;
  scrollRequested = true;
  if (!motionAllowed()) {
    document.documentElement.dataset.scroll = 'ready';
    return;
  }
  void import('./scroll.ts').then((module) => {
    // Sobald alles steht, die gemerkte Ansicht ein letztes Mal ansteuern.
    smooth = module.initScroll(() => {
      restoreView();
      restoring = false;
    });
  });
};

if (!motionAllowed() || window.location.hash || window.scrollY > 0 || view) {
  loadScroll();
} else {
  const wakeOn = (types: string[]) => {
    for (const type of types) {
      window.addEventListener(type, loadScroll, { once: true, passive: true });
    }
  };
  wakeOn(['pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown']);
  // Zeigerbewegungen zählen erst eine Sekunde nach dem Laden: Steht der Zeiger schon über der
  // Seite, meldet der Browser beim Laden von sich aus eine Bewegung.
  const later = () => setTimeout(() => wakeOn(['pointermove']), 1000);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
  setTimeout(loadScroll, 12_000);
}
