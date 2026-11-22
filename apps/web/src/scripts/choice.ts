/**
 * «Eins wählen, eins sehen»: Eine Liste von Einträgen mit je einem Kopf (Name) und einer Tafel
 * (Bild, Text) wird zu einem Index mit einer Bühne. Genutzt vom Sortiment («Raum für Raum»).
 *
 * Alles steht im Markup (Astro): Köpfe, Tafeln, Texte und Bilder. Ohne dieses Skript bleibt es
 * eine gewöhnliche Liste. Das Skript macht aus jedem Kopf einen Knopf (Muster «Accordion» der
 * APG, eine Tafel offen), setzt `data-ready` (erst dann gilt das Layout der Bühne) und läuft vor
 * dem ersten Bild (early-script.mjs), es springt also nichts um.
 *
 * Gewechselt wird nur durch eine Wahl: Klick, Tippen, Tasten oder, mit feinem Zeiger, kurzes
 * Verweilen. Nie durch Scrollen: Die Räume haben keine Reihenfolge, man wählt sie. (Die
 * Firmengeschichte hat eine und geht darum mit dem Scrollen weiter, years.ts.)
 * Die neue Tafel erscheint in der Sprache der Bild-Enthüllung (`data-anim`, CSS); die alte bleibt
 * sichtbar (`data-leaving`), bis alle Auftritte der neuen zu Ende sind und sie die alte ganz
 * deckt. Bei reduzierter oder angehaltener Bewegung wechselt sie sofort. Eine Adresse mit der
 * Marke eines Eintrags (#raum-betten) öffnet ihn.
 *
 * Die neue Tafel liegt über der alten (z-index am Element). Liegen Tafeln übereinander, braucht
 * ihre Liste darum einen eigenen Stapel (CSS: `isolation: isolate`): Sonst geriete nach vielen
 * Wechseln ein Bedienelement auf der Bühne («Weiter») unter die Tafeln.
 *
 * «Weiter» wechselt die Tafel, ohne dass der Fokus den Knopf verlässt. Für Screenreader sagt eine
 * leise Meldung (role="status"), was jetzt zu sehen ist: «Polstermöbel, 2 von 7».
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
  /**
   * Scrollt die Seite an die Stelle `top`. Gesetzt, bringt eine Wahl am Kopf die Bühne ins Bild,
   * wenn sie dort nicht zu sehen ist (am Handy steht sie über dem Index).
   */
  scrollTo?(top: number): void;
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

  // Meldung für Screenreader, nur mit «Weiter»: Bei einer Wahl am Kopf sagt es schon dessen Knopf
  // (aria-expanded). Entsteht hier, ohne Skript gibt es nichts zu melden.
  let status: HTMLElement | null = null;
  if (next) {
    status = document.createElement('p');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    root.append(status);
  }

  /**
   * Was beim Wechsel noch die alte Tafel zeigt, ist erledigt, sobald die neue steht. Der Stapel
   * beginnt dann wieder unten: Nur die offene Tafel behält eine Ebene.
   */
  const settle = () => {
    layer = 1;
    for (const item of items) {
      if (item === current) {
        item.panel.style.setProperty('z-index', '1');
        continue;
      }
      delete item.element.dataset.leaving;
      item.panel.style.removeProperty('z-index');
      if (item.panel.style.length === 0) item.panel.removeAttribute('style');
    }
  };

  /** `announce`: Die Wahl kam von «Weiter», die Meldung für Screenreader sagt, was jetzt steht. */
  const activate = (item: ChoiceItem, animate = true, announce = false) => {
    if (item === current) return;
    const previous = current;
    current = item;
    if (previous) {
      previous.button.setAttribute('aria-expanded', 'false');
      delete previous.element.dataset.on;
      delete previous.element.dataset.anim;
      previous.element.dataset.leaving = '';
    }
    // Wer zurückkommt, während er noch als alte Tafel galt (schnell hin und zurück), ist wieder
    // die neue: Sonst bliebe sein Text verborgen.
    delete item.element.dataset.leaving;
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
    if (status) {
      status.textContent = announce ? `${item.name}, ${index + 1} von ${items.length}` : '';
    }
    options.changed?.(index, items);
    if (!moving || typeof item.panel.getAnimations !== 'function') {
      settle();
      return;
    }
    // Erledigt, wenn alle Auftritte der neuen Tafel zu Ende sind (oder abbrechen): Erst dann deckt
    // das neue Foto das alte ganz. Der Text ist früher fertig als das Foto; nach dem ersten Ende
    // verschwände das alte Foto, während oben noch ein Streifen des neuen fehlt.
    const entrances = item.panel
      .getAnimations({ subtree: true })
      .filter((animation) => animation instanceof CSSAnimation);
    void Promise.allSettled(entrances.map((animation) => animation.finished)).then(() => {
      if (item === current) settle();
    });
  };

  const keys: Record<string, (index: number) => number> =
    options.orientation === 'vertical'
      ? { ArrowDown: (i) => i + 1, ArrowUp: (i) => i - 1 }
      : { ArrowRight: (i) => i + 1, ArrowLeft: (i) => i - 1 };
  keys.Home = () => 0;
  keys.End = () => items.length - 1;

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

  /**
   * Wer am Handy einen Namen im Index antippt, sieht die Bühne darüber nicht: Der Wechsel bliebe
   * unbemerkt. Darum gleitet die Seite so weit hinauf, dass die Tafel unter dem Header steht.
   * Danach stehen Bühne und Index zusammen im Bild, und weitere Wahlen bewegen die Seite nicht
   * mehr. Steht die Tafel schon gut im Bild (am Desktop liegt sie neben dem Index), bleibt die
   * Seite, wo sie ist.
   * Mit der Tastatur gewählt, darf der Knopf mit dem Fokus dabei nicht aus dem Bild rutschen:
   * Dann gleitet die Seite höchstens so weit, dass er unten noch ganz zu sehen ist.
   */
  const reveal = (item: ChoiceItem, byKeyboard: boolean) => {
    if (!options.scrollTo) return;
    const header =
      Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const frame = window.innerHeight - header;
    const top = layoutTop(item.panel) - window.scrollY;
    const height = item.panel.offsetHeight;
    const seen = Math.min(top + height, window.innerHeight) - Math.max(top, header);
    if (seen >= Math.min(height, frame) * 0.6) return;
    const stage = layoutTop(item.panel) - header;
    const keepButton = layoutTop(item.button) + item.button.offsetHeight + 16 - window.innerHeight;
    options.scrollTo(Math.max(0, Math.round(byKeyboard ? Math.max(stage, keepButton) : stage)));
  };

  /*
   * Nach einer Wahl per Klick gilt sie, bis sich der Zeiger wirklich bewegt: Scrollt die Seite
   * danach (von selbst oder mit dem Rad), ziehen andere Köpfe unter dem ruhenden Zeiger durch, und
   * der Browser meldet das wie ein Betreten. Ohne diese Sperre zeigte das Verweilen dann einen
   * anderen Eintrag als den eben gewählten.
   */
  let chosenAt: { x: number; y: number } | null = null;
  let dwell = 0;
  /** Mit feinem Zeiger: Verweilt er auf einem Kopf, zeigt sich dessen Tafel. */
  const hover = (item: ChoiceItem) => {
    window.clearTimeout(dwell);
    dwell = window.setTimeout(() => activate(item), DWELL_MS);
  };
  if (options.preview) {
    root.addEventListener('pointermove', (event) => {
      if (!chosenAt || event.pointerType !== 'mouse') return;
      if (Math.abs(event.clientX - chosenAt.x) + Math.abs(event.clientY - chosenAt.y) <= 6) return;
      chosenAt = null;
      // Die Bewegung, die die Sperre löst, kann schon auf einem anderen Kopf liegen.
      const over = items.find(
        (item) => event.target instanceof Node && item.button.contains(event.target),
      );
      if (over && over !== current) hover(over);
    });
  }

  for (const item of items) {
    item.button.addEventListener('click', (event) => {
      window.clearTimeout(dwell);
      chosenAt = { x: event.clientX, y: event.clientY };
      activate(item);
      // `detail` zählt die Klicks eines Zeigers; von der Tastatur ausgelöst ist es 0.
      reveal(item, event.detail === 0);
    });
    item.button.addEventListener('keydown', (event) => {
      const step = keys[event.key];
      if (!step) return;
      event.preventDefault();
      const to = (step(items.indexOf(item)) + items.length) % items.length;
      items[to]!.button.focus();
    });
    if (!options.preview) continue;
    item.button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && !chosenAt) hover(item);
    });
    item.button.addEventListener('pointerleave', () => window.clearTimeout(dwell));
  }
  next?.addEventListener('click', () => {
    const index = current ? items.indexOf(current) : -1;
    activate(items[(index + 1) % items.length]!, true, true);
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
