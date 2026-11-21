/**
 * «Eins wählen, eins sehen»: Eine Liste von Einträgen mit je einem Kopf (Name) und einer Tafel
 * (Bild, Text) wird zu einem Index mit einer Bühne. Genutzt vom Sortiment («Raum für Raum») und
 * von der Firmengeschichte («Jahr für Jahr»).
 *
 * Alles steht im Markup (Astro): Köpfe, Tafeln, Texte und Bilder. Ohne dieses Skript bleibt es
 * eine gewöhnliche Liste. Das Skript macht aus jedem Kopf einen Knopf (Muster «Accordion» der
 * APG, eine Tafel offen), setzt `data-ready` (erst dann gilt das Layout der Bühne) und läuft vor
 * dem ersten Bild (early-script.mjs), es springt also nichts um.
 *
 * Gewechselt wird nur durch eine Wahl: Klick, Tippen, Tasten oder, mit feinem Zeiger, kurzes
 * Verweilen. Nie durch Scrollen (das wäre eine gescrubbte Galerie, DESIGN.md «Bewusst nicht»).
 * Die neue Tafel erscheint in der Sprache der Bild-Enthüllung (`data-anim`, CSS); die alte bleibt
 * sichtbar (`data-leaving`), bis die neue sie deckt. Bei reduzierter oder angehaltener Bewegung
 * wechselt sie sofort. Eine Adresse mit der Marke eines Eintrags (#raum-betten) öffnet ihn.
 */
import { motionAllowed, motionPaused, onMotionPausedChange } from '@luescher/ui/motion';

export interface ChoiceItem {
  element: HTMLElement;
  button: HTMLButtonElement;
  panel: HTMLElement;
  /** Name für «Weiter» (aus data-choice-name oder dem Text des Kopfs) */
  name: string;
}

export interface ChoiceOptions {
  /** Pfeiltasten: ↑/↓ in einer Liste, ←/→ auf einer Achse */
  orientation: 'vertical' | 'horizontal';
  /** Beschriftung des Weiter-Knopfs; `wraps`: Er führt vom letzten zurück zum ersten. */
  next(to: ChoiceItem, wraps: boolean): { text: string; label: string };
  /** Mit feinem Zeiger zeigt schon das Verweilen auf einem Kopf seine Tafel. */
  preview?: boolean;
  /** Nach jedem Wechsel (auch dem ersten), etwa für einen Fortschritt. */
  changed?(index: number, items: ChoiceItem[]): void;
}

/** So lange muss ein feiner Zeiger auf einem Kopf verweilen, bevor er ihn zeigt. */
const DWELL_MS = 120;

export function initChoice(root: HTMLElement, options: ChoiceOptions): ChoiceItem[] {
  const items: ChoiceItem[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('[data-choice-item]')) {
    const head = element.querySelector<HTMLElement>('[data-choice-head]');
    const panel = element.querySelector<HTMLElement>('[data-choice-panel]');
    if (!head || !panel) continue;
    // Der Kopf wird zum Knopf: Sein Inhalt wandert hinein, die Überschrift bleibt aussen.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = head.dataset.choiceButton ?? '';
    button.setAttribute('aria-expanded', 'false');
    panel.id ||= `${element.id}-tafel`;
    button.setAttribute('aria-controls', panel.id);
    button.append(...head.childNodes);
    head.append(button);
    const name =
      element.dataset.choiceName ?? (button.textContent ?? '').replace(/\s+/g, ' ').trim();
    items.push({ element, button, panel, name });
  }
  if (items.length === 0) return items;

  const next = root.querySelector<HTMLButtonElement>('[data-choice-next]');
  const nextText = next?.querySelector<HTMLElement>('[data-choice-next-text]');
  const still = () => !motionAllowed() || motionPaused();
  let current: ChoiceItem | null = null;
  let layer = 1;

  /*
   * Die erste Tafel tritt beim Hereinscrollen auf wie jedes Bild (reveal.ts, data-enter). Mit
   * dem ersten Wechsel gibt sie diesen Auftritt ab: Sonst fände die Regel für den Auftritt beim
   * erneuten Wählen noch ihren Zustand, und die Enthüllung des Wechsels spielte nicht.
   */
  const releaseEntrance = () => {
    for (const element of root.querySelectorAll<HTMLElement>('[data-enter]')) {
      delete element.dataset.enter;
      element.classList.remove('enter-unveil');
      element.style.removeProperty('--enter-i');
      element.style.removeProperty('--unveil-from');
      if (element.style.length === 0) element.removeAttribute('style');
    }
  };

  /** Was beim Wechsel noch die alte Tafel zeigt, ist erledigt, sobald die neue steht. */
  const settle = () => {
    for (const item of items) if (item !== current) delete item.element.dataset.leaving;
  };

  const activate = (item: ChoiceItem, animate = true) => {
    if (item === current) return;
    const previous = current;
    current = item;
    if (previous) {
      releaseEntrance();
      previous.button.setAttribute('aria-expanded', 'false');
      delete previous.element.dataset.on;
      delete previous.element.dataset.anim;
      previous.element.dataset.leaving = '';
    }
    item.button.setAttribute('aria-expanded', 'true');
    // Die neue Tafel liegt über der alten (element.style ist erlaubt, CSP: keine style-Attribute
    // im Markup).
    item.panel.style.setProperty('z-index', String(++layer));
    const moving = animate && !still();
    if (moving) item.element.dataset.anim = '';
    item.element.dataset.on = '';
    const index = items.indexOf(item);
    if (next && nextText) {
      const wraps = index === items.length - 1;
      const target = items[wraps ? 0 : index + 1]!;
      const label = options.next(target, wraps);
      nextText.textContent = label.text;
      next.setAttribute('aria-label', label.label);
    }
    options.changed?.(index, items);
    if (!moving) {
      settle();
      return;
    }
    // Erledigt, wenn die Enthüllung der neuen Tafel endet (oder abbricht).
    const done = (event: AnimationEvent) => {
      if (event.target instanceof Element && !item.panel.contains(event.target)) return;
      item.panel.removeEventListener('animationend', done);
      item.panel.removeEventListener('animationcancel', done);
      if (item === current) settle();
    };
    item.panel.addEventListener('animationend', done);
    item.panel.addEventListener('animationcancel', done);
  };

  const keys: Record<string, (index: number) => number> =
    options.orientation === 'vertical'
      ? { ArrowDown: (i) => i + 1, ArrowUp: (i) => i - 1 }
      : { ArrowRight: (i) => i + 1, ArrowLeft: (i) => i - 1 };
  keys.Home = () => 0;
  keys.End = () => items.length - 1;

  let dwell = 0;
  for (const item of items) {
    item.button.addEventListener('click', () => activate(item));
    item.button.addEventListener('keydown', (event) => {
      const step = keys[event.key];
      if (!step) return;
      event.preventDefault();
      const to = (step(items.indexOf(item)) + items.length) % items.length;
      items[to]!.button.focus();
    });
    if (!options.preview) continue;
    item.button.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(dwell);
      dwell = window.setTimeout(() => activate(item), DWELL_MS);
    });
    item.button.addEventListener('pointerleave', () => window.clearTimeout(dwell));
  }
  next?.addEventListener('click', () => {
    const index = current ? items.indexOf(current) : -1;
    activate(items[(index + 1) % items.length]!);
  });

  // Eine Marke in der Adresse (Direktlink, Verlauf, Link auf der Seite) öffnet ihren Eintrag.
  const fromHash = () => {
    const hash = window.location.hash.slice(1);
    const target = items.find((item) => item.element.id === hash);
    if (target) activate(target, false);
  };
  activate(items[0]!, false);
  fromHash();
  window.addEventListener('hashchange', fromHash);
  // Angehalten: Was noch wechselt, steht sofort.
  onMotionPausedChange((paused) => {
    if (!paused) return;
    for (const item of items) delete item.element.dataset.anim;
    settle();
  });
  if (next) next.hidden = false;
  root.dataset.ready = '';
  return items;
}
