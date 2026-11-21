/**
 * Header: oben volle Leiste, nach dem Scrollen eine schwebende Kapsel; dazu das Vollbild-Menü
 * mit Fokusfalle.
 */
import { DUR, motionAllowed, motionPaused } from '@luescher/ui/motion';

export interface ScrollLock {
  stop(): void;
  start(): void;
}

/** Ab hier wird die Leiste zur Kapsel, darunter wieder zur Leiste (Abstand gegen Flackern). */
const CAPSULE_ON = 96;
const CAPSULE_OFF = 40;
/**
 * Spätestens dann wechselt die Form, falls kein transitionend kommt (etwa wenn nur der Teil mit dem
 * Tastaturfokus zu sehen ist, der nicht abtaucht): das Abtauchen in Header.astro (`--dur-1`) plus
 * etwas Luft.
 */
const MORPH_FALLBACK_MS = DUR.d1 * 1000 + 50;

/** Wird das Element dargestellt? checkVisibility() fehlt in Safari und iOS vor 17.4. */
const canCheckVisibility = typeof Element !== 'undefined' && 'checkVisibility' in Element.prototype;
const shown = (element: Element) =>
  canCheckVisibility ? element.checkVisibility() : element.getClientRects().length > 0;

export function initHeader(lock: () => ScrollLock | null): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const bar = header?.querySelector<HTMLElement>('.bar');
  if (!header || !bar) return;

  // --- Leiste oder Kapsel ---
  let scrolled = false;
  let ticking = false;
  let morph = 0;
  const twoFrames = (callback: () => void) =>
    requestAnimationFrame(() => requestAnimationFrame(callback));

  // Die Teile der Leiste, die beim Wechsel abtauchen und wieder auftauchen.
  const parts = () =>
    bar.querySelectorAll<HTMLElement>(':scope > .bar-logo, :scope > .bar-nav, .bar-actions > *');
  // Ist davon gerade etwas zu sehen? Liest den laufenden Wert der Übergänge.
  const anyVisible = () =>
    [...parts()].some((part) => shown(part) && Number(getComputedStyle(part).opacity) > 0.05);

  /*
   * Der Tastaturfokus bleibt in der Leiste. Gibt es das fokussierte Bedienelement in der neuen Form
   * nicht, übernimmt ein sichtbares Gegenstück, statt dass der Fokus auf <body> fällt (WCAG 2.4.3,
   * 2.4.7): für den Menü-Knopf (oben am Desktop) die Navigation, für die er steht; sonst das
   * nächste sichtbare Bedienelement der Leiste, am Ende das vorherige. So führt Tab danach in der
   * gewohnten Reihenfolge weiter durch die Leiste.
   */
  const standIn = (lost: HTMLElement) => {
    const nav = bar.querySelector<HTMLElement>('.bar-nav a');
    if (lost.matches('[data-menu-toggle]') && nav && shown(nav)) return nav;
    const controls = [...bar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    const at = controls.indexOf(lost);
    return (
      controls.slice(at + 1).find(shown) ?? controls.slice(0, Math.max(0, at)).reverse().find(shown)
    );
  };
  const reshape = () => {
    const active = document.activeElement;
    const focused = active instanceof HTMLElement && bar.contains(active) ? active : null;
    header.classList.toggle('is-scrolled', scrolled);
    if (!focused || shown(focused)) return;
    standIn(focused)?.focus({ preventScroll: true });
  };

  // Zweite Phase: Form wechseln, solange noch alles abgetaucht ist, dann wieder auftauchen.
  const swap = () => {
    window.clearTimeout(morph);
    if (!header.classList.contains('is-morphing')) return;
    reshape();
    // Stil jetzt berechnen: Was erst in der neuen Form erscheint (z. B. Telefon und Menü-Knopf in
    // der Kapsel), startet so unsichtbar und blendet mit den anderen ein, statt aufzuspringen.
    // Kostet kein zusätzliches Layout: Danach ändern sich nur noch Deckkraft und transform.
    bar.getBoundingClientRect();
    header.classList.remove('is-morphing');
    // Das erste Bild in der neuen Form zeigt die Leiste nicht (Header.astro): So zählt der Sprung
    // von Breite und Lage nicht als Layoutverschiebung. Zwei rAF, weil der erste unter Umständen
    // noch vor diesem Bild läuft.
    header.classList.add('is-swapping');
    twoFrames(() => header.classList.remove('is-swapping'));
  };

  /*
   * Ohne Formwechsel in zwei Phasen: bei reduzierter Bewegung, angehaltener Bewegung (Schalter)
   * und bei einem Sprung (Direktlink, wiederhergestellte Position, home.ts), denn dann kommt man
   * an, statt zu scrollen. Die Form steht sofort, und auch die Fläche der Kapsel faltet sich nicht
   * erst nach den Knöpfen auf (is-instant, Header.astro).
   */
  const instant = () =>
    !motionAllowed() || motionPaused() || 'jump' in document.documentElement.dataset;

  const update = (animate = true) => {
    ticking = false;
    const y = window.scrollY;
    const next = scrolled ? y > CAPSULE_OFF : y > CAPSULE_ON;
    if (next === scrolled) return;
    scrolled = next;
    window.clearTimeout(morph);
    if (!animate || instant()) {
      header.classList.remove('is-morphing');
      header.classList.add('is-instant');
      reshape();
      twoFrames(() => header.classList.remove('is-instant'));
      return;
    }
    // Ist gerade nichts zu sehen (etwa bei einer Umkehr direkt nach dem Wechsel, wenn alle Teile
    // noch auf ihr Auftauchen warten), kann nichts abtauchen und kein transitionend kommen:
    // Dann wechselt die Form sofort, statt auf die Notbremse zu warten.
    const visible = anyVisible();
    // Erste Phase: Die Teile der Leiste tauchen ab (Header.astro).
    header.classList.add('is-morphing');
    if (!visible) {
      swap();
      return;
    }
    morph = window.setTimeout(swap, MORPH_FALLBACK_MS);
  };
  // Das Ende des Abtauchens meldet der erste Teil, dessen Deckkraft fertig übergeblendet ist.
  // Übergänge der Fläche (::before, ::after) melden sich an der Leiste selbst und zählen nicht.
  // Es zählt nur ein Teil, der wirklich unsichtbar ist: Chromium meldet mitunter schon beim Start
  // eines Übergangs ein zusätzliches transitionend (elapsedTime 0), während er weiterläuft.
  bar.addEventListener('transitionend', (event) => {
    const part = event.target as HTMLElement;
    if (event.propertyName !== 'opacity' || part === bar) return;
    if (!header.classList.contains('is-morphing')) return;
    if (getComputedStyle(part).opacity === '0') swap();
  });
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => update());
      }
    },
    { passive: true },
  );
  update(false);

  /*
   * Seitenwechsel (View Transition, global.css): Die Leiste bleibt nur stehen, wenn die neue Seite
   * sicher oben beginnt. Führt der Link zu einer Marke (/#kontakt) oder geht es durch den Verlauf
   * zurück oder vor, kann die neue Seite noch während des Übergangs zur Kapsel werden; der Browser
   * zöge die Kapsel dann auf die Breite der alten Leiste (Logo und Knöpfe riesig). In diesen
   * Fällen verliert die alte Leiste ihren Namen (is-leaving) und geht mit der alten Seite, die neue
   * blendet für sich ein. Bei angehaltener Bewegung gibt es keinen Übergang.
   */
  window.addEventListener('pageswap', (event) => {
    const transition = event.viewTransition;
    if (!transition) return;
    if (motionPaused()) {
      // Die Absage meldet sich sonst als unbehandelter Fehler in der alten Seite.
      transition.ready.catch(() => undefined);
      // Chromium führt danach in der alten Seite kein Skript mehr aus (gemessen): Nach
      // skipTransition() darf nichts folgen, und dieser Zuhörer bleibt der einzige für pageswap.
      transition.skipTransition();
      return;
    }
    // Die Kapsel trägt für den Wechsel einen eigenen Namen (Header.astro): Kommt die neue Seite
    // ebenfalls als Kapsel, bilden beide ein Paar, und die Kapsel bleibt stehen (global.css).
    if (scrolled) header.classList.add('is-handing');
    const activation = event.activation;
    // Ohne Navigation API ist das Ziel unbekannt: sicherheitshalber wie bei einer Marke.
    if (
      !activation ||
      activation.navigationType === 'traverse' ||
      new URL(activation.entry.url ?? '', window.location.href).hash
    ) {
      header.classList.add('is-leaving');
    }
  });
  // Aus dem Verlauf zurück (bfcache): wieder wie neu geladen. Nur dann: Nach dem ersten Laden
  // kommt pageshow mit dem load-Ereignis, womöglich mitten im Übergang der neuen Seite.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) header.classList.remove('is-leaving', 'is-handing');
  });

  /*
   * Durch den Verlauf zurück oder vor zu einer Seite, die oben beginnt: Die neue Leiste steht
   * sofort (global.css, Übergangstyp `stand`), die alte geht mit der alten Seite darunter. Ein
   * Überblenden der beiden liesse den Header kurz grau werden. Ohne Navigation API ist die Art des
   * Wechsels unbekannt, und die alte Leiste ging sicherheitshalber (pageswap): ebenso. Mit einem
   * Paar (die alte Leiste blieb) wirkt der Typ nicht, es steht ohnehin.
   */
  const standIfTop = (transition: ViewTransition) => {
    const navigationType = window.navigation?.activation?.navigationType;
    if ((navigationType === 'traverse' || navigationType === undefined) && !scrolled) {
      transition.types?.add('stand');
    }
  };

  /*
   * Erstes Bild der neuen Seite, bevor der Browser sie für den Übergang festhält. Steht sie schon
   * unten (Direktlink zu einer Marke), ist die Kapsel bereits da und kommt mit der Seite, statt
   * dass oben kurz die Leiste erscheint und dann die Kapsel aufspringt; kam auch die alte Seite als
   * Kapsel, bleibt sie stehen (is-handing). Das gelingt nur, wenn dieses Skript vor dem ersten Bild
   * läuft. Der Browser wartet darauf nicht immer (gemessen: bei wiederholtem Besuch meist, beim
   * ersten Besuch und auf langsamen Geräten oft nicht); dann kommt die Seite erst oben an und
   * springt zur Marke, und der Header wechselt mit ihr, wie ohne diesen Zuhörer.
   * Bei angehaltener Bewegung (eine Seite aus dem bfcache behält ihren Schalter) kein Übergang.
   */
  window.addEventListener('pagereveal', (event) => {
    const transition = event.viewTransition;
    if (transition && motionPaused()) {
      transition.ready.catch(() => undefined);
      transition.skipTransition();
    }
    update(false);
    if (!transition || motionPaused()) return;
    standIfTop(transition);
    if (!scrolled) return;
    header.classList.add('is-handing');
    const done = () => header.classList.remove('is-handing');
    transition.finished.then(done, done);
  });
  // Lief dieses Skript erst nach dem ersten Bild, gilt der laufende Übergang: Typen wirken auch
  // nachträglich. Die Form stellte update(false) oben schon ein (die Seite steht da noch oben).
  const running = document.activeViewTransition;
  if (running && !motionPaused()) standIfTop(running);

  // --- Vollbild-Menü ---
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-menu]');
  const label = header.querySelector<HTMLElement>('[data-menu-label]');
  if (!toggle || !menu || !label) return;

  const outside = () => [
    ...document.querySelectorAll<HTMLElement>(
      'main, footer, .skip-link, [data-preview-note], [data-chrome]',
    ),
  ];
  const focusables = () =>
    [...header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
      (element) => element.offsetParent !== null,
    );

  let open = false;

  const setOpen = (next: boolean, restoreFocus = true) => {
    if (open === next) return;
    open = next;
    // Das Menü bleibt beim Schliessen noch so lange sichtbar, wie der Vorhang hochfährt
    // (Header.astro). inert nimmt es sofort aus Tab-Reihenfolge und Bedienung.
    menu.inert = !open;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Schliessen' : 'Menü';
    header.classList.toggle('is-open', open);
    for (const element of outside()) element.inert = open;
    if (open) {
      lock()?.stop();
      document.documentElement.classList.add('scroll-locked');
      menu.scrollTop = 0;
      menu.querySelector<HTMLElement>('[data-menu-link]')?.focus({ preventScroll: true });
    } else {
      document.documentElement.classList.remove('scroll-locked');
      lock()?.start();
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));

  // Links im Menü schliessen es; der Sprung zum Anker passiert danach ganz normal.
  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-menu-link]')) setOpen(false, false);
  });

  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    // Fokus bleibt im Menü: am Ende wieder von vorn.
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
