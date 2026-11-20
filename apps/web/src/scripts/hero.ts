/**
 * Hero: Uhrzeit in Baden, Öffnungsstatus und der Scroll-Verlauf.
 *
 * Auf grossen Bildschirmen bleibt der Hero kurz stehen (CSS: sticky). Auf dieser Strecke tritt
 * die erste Zeile zurück, und das Bild rückt etwas näher. Auf kleinen Bildschirmen scrollt der
 * Hero normal. Bei reduzierter Bewegung hängt nichts am Scrollen. Alles hier ist Zugabe: Die
 * Inhalte stehen im Markup.
 */
import { motionAllowed, onceInView, onMotionPausedChange } from '@luescher/ui/motion';
import { hours } from '../config/hours.ts';
import { statusAt, statusText } from '../lib/opening-hours.ts';
import { startClock } from './clock.ts';

/**
 * «Geöffnet bis 18:30» bzw. «Geschlossen · öffnet morgen 10:00», jede Minute neu.
 * Ohne Skript bleibt die Anzeige verborgen; die Öffnungszeiten stehen daneben als Tabelle.
 */
export function initOpenStatus(element: HTMLElement): void {
  const label = element.querySelector<HTMLElement>('[data-open-status-text]');
  const dot = element.querySelector<HTMLElement>('.dot');
  if (!label) return;
  const render = () => {
    const now = new Date();
    const status = statusAt(hours, now);
    label.textContent = statusText(status);
    element.dataset.open = String(status.open);
    dot?.classList.toggle('dot-ok', status.open);
    dot?.classList.toggle('dot-off', !status.open);
    element.hidden = false;
  };
  const tick = () => {
    render();
    const now = new Date();
    window.setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  // Erst rechnen, wenn die Anzeige in die Nähe kommt (Zeitzonen-Daten kosten beim ersten Mal).
  // Beobachtet wird der Behälter: Die Anzeige selbst ist bis dahin verborgen und hat keine Fläche.
  onceInView(element.parentElement ?? element, tick, { threshold: 0, rootMargin: '200px 0px' });
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
  const applyPin = () => {
    if (pin.matches) root.dataset.pinned = '';
    else delete root.dataset.pinned;
  };
  applyPin();
  pin.addEventListener('change', () => {
    applyPin();
    update();
  });

  let ticking = false;
  const update = () => {
    ticking = false;
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
  update();
}
