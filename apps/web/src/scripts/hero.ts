/**
 * Hero: Uhrzeit in Baden und Öffnungsstatus.
 *
 * Was sich am Hero beim Scrollen bewegt (das runde Foto rückt näher, der Hero bleibt unter dem
 * nächsten Bogen zurück), steht in CSS und hängt an der Scrollposition (scroll.css). Dieses Skript
 * hält darum nichts an und rechnet beim Scrollen nichts. Alles hier ist Zugabe: Die Inhalte
 * stehen im Markup.
 */
import { onceInView, onMotionPausedChange } from '@luescher/ui/motion';
import { hours } from '../config/hours.ts';
import { statusAt, statusText } from '../lib/opening-hours.ts';
import { startClock } from './clock.ts';

/**
 * «Geöffnet bis 18:30» bzw. «Geschlossen · öffnet morgen 10:00», jede Minute neu.
 * Ohne Skript bleibt die Anzeige verborgen; die Öffnungszeiten stehen im Kontakt als Liste.
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
  startClock(root.querySelector<HTMLElement>('[data-local-time]'));
  // Hält jemand die Bewegung an, ist der Auftakt vorbei: Er steht sofort am Ende und spielt auch
  // nach dem Fortsetzen nicht weiter (Hero.astro, data-rested).
  const stopOverture = onMotionPausedChange((paused) => {
    if (!paused) return;
    stopOverture();
    root.dataset.rested = '';
  });
}
