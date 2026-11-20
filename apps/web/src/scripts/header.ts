/**
 * Header: oben volle Leiste, nach dem Scrollen eine schwebende Kapsel; dazu das Vollbild-Menü
 * mit Fokusfalle.
 */
import { DUR, motionAllowed } from '@luescher/ui/motion';

export interface ScrollLock {
  stop(): void;
  start(): void;
}

/** Ab hier wird die Leiste zur Kapsel, darunter wieder zur Leiste (Abstand gegen Flackern). */
const CAPSULE_ON = 96;
const CAPSULE_OFF = 40;
/**
 * Spätestens dann wechselt die Form, falls kein transitionend kommt (etwa wenn nichts sichtbar
 * war, das abtauchen konnte): das Abtauchen in Header.astro (`--dur-1`) plus etwas Luft.
 */
const MORPH_FALLBACK_MS = DUR.d1 * 1000 + 50;

export function initHeader(lock: () => ScrollLock | null): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const bar = header?.querySelector<HTMLElement>('.bar');
  if (!header || !bar) return;

  // --- Leiste oder Kapsel ---
  let scrolled = false;
  let ticking = false;
  let morph = 0;
  // Zweite Phase: Form wechseln, solange noch alles abgetaucht ist, dann wieder auftauchen.
  const swap = () => {
    window.clearTimeout(morph);
    if (!header.classList.contains('is-morphing')) return;
    header.classList.toggle('is-scrolled', scrolled);
    // Stil jetzt berechnen: Was erst in der neuen Form erscheint (z. B. Telefon und Menü-Knopf in
    // der Kapsel), startet so unsichtbar und blendet mit den anderen ein, statt aufzuspringen.
    // Kostet kein zusätzliches Layout: Danach ändern sich nur noch Deckkraft und transform.
    bar.getBoundingClientRect();
    header.classList.remove('is-morphing');
    // Das erste Bild in der neuen Form zeigt die Leiste nicht (Header.astro): So zählt der Sprung
    // von Breite und Lage nicht als Layoutverschiebung. Zwei rAF, weil der erste unter Umständen
    // noch vor diesem Bild läuft.
    header.classList.add('is-swapping');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => header.classList.remove('is-swapping')),
    );
  };
  const update = (animate = true) => {
    ticking = false;
    const y = window.scrollY;
    const next = scrolled ? y > CAPSULE_OFF : y > CAPSULE_ON;
    if (next === scrolled) return;
    scrolled = next;
    window.clearTimeout(morph);
    // Bei einem Sprung (Direktlink, wiederhergestellte Position, home.ts) kommt man an, statt zu
    // scrollen: Die Form steht dann sofort, statt sich über dem neuen Inhalt umzubauen.
    if (!animate || !motionAllowed() || 'jump' in document.documentElement.dataset) {
      header.classList.remove('is-morphing');
      header.classList.toggle('is-scrolled', scrolled);
      return;
    }
    // Erste Phase: Die Teile der Leiste tauchen ab (Header.astro).
    header.classList.add('is-morphing');
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
