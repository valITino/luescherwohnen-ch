/**
 * Hero: Uhrzeit in Baden, Öffnungsstatus und der Scroll-Verlauf.
 *
 * Auf grossen Bildschirmen bleibt der Hero kurz stehen (CSS: sticky). Auf dieser Strecke tritt
 * die erste Zeile zurück, und das Bild rückt etwas näher. Auf kleinen Bildschirmen scrollt der
 * Hero normal. Bei reduzierter Bewegung hängt nichts am Scrollen, ebenso, solange jemand die
 * Bewegung angehalten hat: Dann steht der Hero auch nicht mehr, und die Scrollposition gleicht
 * aus, dass die Seite kürzer wird. Alles hier ist Zugabe: Die Inhalte stehen im Markup.
 */
import {
  DUR,
  motionAllowed,
  motionPaused,
  onceInView,
  onMotionPausedChange,
} from '@luescher/ui/motion';
import { hours } from '../config/hours.ts';
import { statusAt, statusText } from '../lib/opening-hours.ts';
import { startClock } from './clock.ts';

/**
 * «Geöffnet bis 18:30» bzw. «Geschlossen · öffnet morgen 10:00», jede Minute neu.
 * Ohne Skript bleibt die Anzeige verborgen; die Öffnungszeiten stehen daneben als Tabelle.
 * Gibt eine Funktion zurück, die die Anzeige sofort zeigt (home.ts vor einem Sprung): Erscheint
 * sie erst unterwegs, wird die Seite unter einem laufenden Sprung länger, und er endet zu tief.
 */
export function initOpenStatus(element: HTMLElement): () => void {
  const label = element.querySelector<HTMLElement>('[data-open-status-text]');
  const dot = element.querySelector<HTMLElement>('.dot');
  if (!label) return () => undefined;
  const render = () => {
    const now = new Date();
    const status = statusAt(hours, now);
    label.textContent = statusText(status);
    element.dataset.open = String(status.open);
    dot?.classList.toggle('dot-ok', status.open);
    dot?.classList.toggle('dot-off', !status.open);
    element.hidden = false;
  };
  let started = false;
  const tick = () => {
    started = true;
    render();
    const now = new Date();
    window.setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  const start = () => {
    if (!started) tick();
  };
  // Erst rechnen, wenn die Anzeige in die Nähe kommt (Zeitzonen-Daten kosten beim ersten Mal),
  // eine Bildschirmhöhe vorher: Erscheint sie erst im Bild, schiebt sie, was darunter steht.
  // Beobachtet wird der Behälter: Die Anzeige selbst ist bis dahin verborgen und hat keine Fläche.
  onceInView(element.parentElement ?? element, start, { threshold: 0, rootMargin: '100% 0px' });
  return start;
}

export function initHero(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-hero-track]');
  startClock(root.querySelector<HTMLElement>('[data-local-time]'));
  // Hält jemand die Bewegung an, ist der Auftakt vorbei: Er steht sofort am Ende und spielt auch
  // nach dem Fortsetzen nicht weiter (Hero.astro, data-rested).
  const stopOverture = onMotionPausedChange((paused) => {
    if (!paused) return;
    stopOverture();
    root.dataset.rested = '';
  });
  if (!motionAllowed() || !track) return;

  const pin = window.matchMedia('(min-width: 64rem) and (min-height: 40rem)');
  /*
   * Angepinnt nur mit Bewegung: Angehalten stünde der Hero sonst eine Dreiviertel-Bildschirmhöhe
   * lang still, während man scrollt. `keepView`: Was im Bild ist, bleibt an seinem Platz. Gemessen
   * wird, wohin der Abschnitt unter dem Hero rückt, und die Scrollposition gleicht das aus (hat der
   * Browser es schon selbst getan, Scroll Anchoring, bleibt nichts zu tun). Ganz oben bleibt man
   * oben.
   */
  const applyPin = (keepView = false) => {
    const wanted = pin.matches && !motionPaused();
    if (wanted === 'pinned' in root.dataset) return;
    const below = keepView && window.scrollY > 0 ? root.nextElementSibling : null;
    const before = below?.getBoundingClientRect().top ?? 0;
    if (wanted) root.dataset.pinned = '';
    else delete root.dataset.pinned;
    if (!below) return;
    const shift = below.getBoundingClientRect().top - before;
    if (Math.abs(shift) < 1) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + shift), behavior: 'instant' });
  };
  applyPin();
  pin.addEventListener('change', () => {
    applyPin();
    update();
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    // Angehalten: Der Hero steht wie bei reduzierter Bewegung.
    if (motionPaused()) {
      root.style.removeProperty('--hero-p');
      if (root.style.length === 0) root.removeAttribute('style');
      return;
    }
    const rect = track.getBoundingClientRect();
    if (rect.bottom < 0) return;
    // Angepinnt: die Strecke, auf der der Hero steht. Sonst: gut die halbe Höhe des Heros.
    const range = 'pinned' in root.dataset ? rect.height - window.innerHeight : rect.height * 0.6;
    const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, range)));
    root.style.setProperty('--hero-p', progress.toFixed(3));
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', update, { passive: true });
  /*
   * Fortsetzen: Steht man dabei noch im Hero, ist man nach dem Anpinnen am Ende seiner Strecke
   * (keepView), und die erste Zeile und das Bild stünden in einem Bild an ihrem Endpunkt. So
   * gleiten sie dorthin (Hero.astro, data-settling). Anhalten bleibt sofort.
   */
  let settling = 0;
  const settle = () => {
    window.clearTimeout(settling);
    root.dataset.settling = '';
    settling = window.setTimeout(() => delete root.dataset.settling, DUR.d3 * 1000 + 50);
  };
  // Vor smooth.ts angemeldet: Lenis endet erst danach bzw. beginnt erst an der neuen Stelle.
  onMotionPausedChange((paused) => {
    if (!paused) settle();
    applyPin(true);
    update();
  });
  update();
}
