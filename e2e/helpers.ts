import type { Page } from '@playwright/test';

/** Sammelt Konsolenfehler, Seitenfehler und CSP-Verstösse einer Seite. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Die Seite darf nie horizontal scrollen. */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/**
 * Sichtbare Inhalte, die über den linken oder rechten Bildrand ragen.
 *
 * `overflow-x: clip` am body verhindert das seitliche Scrollen, schneidet solche Inhalte aber
 * still ab; `scrollWidth` bleibt dabei unverändert. Darum misst diese Prüfung die Kanten selbst:
 * jede Textzeile (auch lange Wörter, die aus ihrem Kasten laufen) und jeden Kasten mit Rahmen
 * oder Grund sowie alle Bedienelemente. Ausgenommen ist, was in einem eigenen Ausschnitt läuft
 * (Band, Bereiche mit eigenem Scrollen) und reine Dekoration (`aria-hidden`).
 */
export async function cutOff(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    // Auch das Element selbst zählt: Wer selbst abschneidet (z. B. mit Auslassungspunkten), hält
    // seinen Text absichtlich im eigenen Ausschnitt.
    const ownViewport = (element: Element): boolean => {
      for (
        let parent: Element | null = element;
        parent && parent !== document.body;
        parent = parent.parentElement
      ) {
        if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(parent).overflowX)) return true;
      }
      return false;
    };
    const visible = (element: Element): boolean =>
      element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
      !element.closest('[aria-hidden="true"], .sr-only, .hp, .skip-link, [inert]');
    const outside = (rect: DOMRect): boolean =>
      rect.width > 0 && rect.height > 0 && (rect.right > width + 0.5 || rect.left < -0.5);
    const boxed = (element: Element): boolean => {
      const style = getComputedStyle(element);
      return (
        parseFloat(style.borderRightWidth) > 0 ||
        parseFloat(style.borderLeftWidth) > 0 ||
        style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      );
    };

    const found = new Map<Element, string>();
    const note = (element: Element, rect: DOMRect): void => {
      if (found.has(element) || ownViewport(element)) return;
      const classes = typeof element.className === 'string' ? element.className.trim() : '';
      const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      found.set(
        element,
        `${element.tagName.toLowerCase()}${classes ? `.${classes.split(/\s+/).join('.')}` : ''} ` +
          `[${Math.round(rect.left)}..${Math.round(rect.right)} von ${width}] «${text}»`,
      );
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!node.textContent?.trim() || !parent || !visible(parent)) continue;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
      range.selectNodeContents(node);
      const rect = [...range.getClientRects()].find(outside);
      if (rect) note(parent, rect);
    }
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element)) continue;
      const control = element.matches('a, button, input, select, textarea, img');
      if (!control && !(boxed(element) && element.textContent?.trim())) continue;
      const rect = element.getBoundingClientRect();
      if (outside(rect)) note(element, rect);
    }
    return [...found.values()];
  });
}

/**
 * Inhalte, die seitlich aus ihrem Kasten ragen: jede sichtbare Textzeile, jedes Bedienelement und
 * jeder Kasten wird am nächsten Vorfahren mit Rahmen oder Grund gemessen (Karte, Bühne, Feld,
 * Knopf). cutOff misst nur am Bildrand: Ein Inhalt, der breiter ist als sein Feld, aber noch im
 * Bild liegt, fällt erst hier auf (so ragten die Öffnungszeiten bei 360 px aus ihrem Feld).
 * Was in einem eigenen Ausschnitt ohne Rahmen läuft (Band, Masken der Überschriften), zählt nicht;
 * reine Dekoration (`aria-hidden`) auch nicht.
 */
export async function boxOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const visible = (element: Element): boolean =>
      element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
      !element.closest('[aria-hidden="true"], .sr-only, .hp, .skip-link, [inert]');
    const boxed = (element: Element): boolean => {
      const style = getComputedStyle(element);
      return (
        parseFloat(style.borderRightWidth) > 0 ||
        parseFloat(style.borderLeftWidth) > 0 ||
        style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      );
    };
    const clips = (element: Element): boolean =>
      /(hidden|clip|auto|scroll)/.test(getComputedStyle(element).overflowX);
    /** Der nächste Kasten ab `start`; null, wenn vorher ein eigener Ausschnitt ohne Rahmen kommt. */
    const boxOf = (start: Element | null): Element | null => {
      for (
        let element: Element | null = start;
        element && element !== document.body;
        element = element.parentElement
      ) {
        if (boxed(element)) return element;
        if (clips(element)) return null;
      }
      return null;
    };
    const name = (element: Element): string => {
      const classes = typeof element.className === 'string' ? element.className.trim() : '';
      return `${element.tagName.toLowerCase()}${classes ? `.${classes.split(/\s+/).join('.')}` : ''}`;
    };
    const found = new Map<Element, string>();
    const check = (element: Element, rects: DOMRect[], box: Element | null): void => {
      if (!box || found.has(element)) return;
      const frame = box.getBoundingClientRect();
      const rect = rects.find(
        (candidate) =>
          candidate.width > 0 &&
          candidate.height > 0 &&
          (candidate.right > frame.right + 1 || candidate.left < frame.left - 1),
      );
      if (!rect) return;
      const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      found.set(
        element,
        `${name(element)} [${Math.round(rect.left)}..${Math.round(rect.right)}] ragt aus ` +
          `${name(box)} [${Math.round(frame.left)}..${Math.round(frame.right)}] «${text}»`,
      );
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!node.textContent?.trim() || !parent || !visible(parent)) continue;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
      range.selectNodeContents(node);
      check(parent, [...range.getClientRects()], boxOf(parent));
    }
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element)) continue;
      const control = element.matches('a, button, input, select, textarea, img');
      if (!control && !(boxed(element) && element.textContent?.trim())) continue;
      // Fest oder absolut gesetzte Teile (Kapsel, schwebende Knöpfe) liegen bewusst frei.
      if (/(fixed|absolute|sticky)/.test(getComputedStyle(element).position)) continue;
      check(element, [element.getBoundingClientRect()], boxOf(element.parentElement));
    }
    return [...found.values()];
  });
}

/**
 * Wörter, die mitten im Wort auf die nächste Zeile umbrechen («Datenschu-tz»). Das passiert, wenn
 * eine Spalte schmaler ist als ihr längstes Wort und `overflow-wrap: anywhere` einspringt.
 * Nicht gemeint sind Trennungen an einem weichen Trennzeichen und Adressen in Mono-Schrift.
 */
export async function brokenWords(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      const text = node.textContent ?? '';
      if (!parent || !text.trim()) continue;
      if (!parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      if (parent.closest('[aria-hidden="true"], .sr-only, script, style, noscript, .mono, code')) {
        continue;
      }
      for (const match of text.matchAll(/[A-Za-zÄÖÜäöüéèàç]{4,}/g)) {
        const start = match.index;
        const end = start + match[0].length;
        if (text[start - 1] === '\u00AD' || text[end] === '\u00AD') continue;
        range.setStart(node, start);
        range.setEnd(node, end);
        const lines = new Set(
          [...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => rect.top),
        );
        if (lines.size > 1) found.add(`${parent.tagName.toLowerCase()}: ${match[0]}`);
      }
    }
    return [...found];
  });
}

/**
 * Text, der auf einem Foto liegt, und Bildquellen, die selbst Platz belegen. Beides passiert bei
 * Spezifitäts- oder Grid-Fehlern lautlos: nichts ragt über den Rand, aber Text wird unlesbar oder
 * über dem Bild klafft eine Lücke. Bildunterschriften im selben Rahmen zählen nicht.
 */
export async function imageCollisions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const source of document.querySelectorAll('picture > source')) {
      const rect = source.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        found.push(`<source> belegt ${Math.round(rect.width)}×${Math.round(rect.height)} px`);
      }
    }
    // Zu sehen: ausgelegt, nicht verborgen (visibility) und nicht in einem zugeklappten Bereich
    // (<details>, content-visibility). Text in verborgenen Tafeln liegt nie über einem Bild.
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        element.checkVisibility({ visibilityProperty: true, opacityProperty: false })
      );
    };
    const images = [...document.querySelectorAll<HTMLImageElement>('main img')].filter(
      (img) => visible(img) && img.getBoundingClientRect().width > 40,
    );
    const texts = [
      ...document.querySelectorAll<HTMLElement>(
        'main :is(p, h1, h2, h3, h4, li, dt, dd, blockquote)',
      ),
    ].filter((element) => element.textContent?.trim() && visible(element));
    for (const img of images) {
      const frame = img.closest('figure') ?? img.parentElement;
      const box = img.getBoundingClientRect();
      for (const text of texts) {
        if (frame?.contains(text) || text.contains(img)) continue;
        // Nur die Zeilen der Textknoten zählen, nicht die Boxen (die können breiter sein).
        const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
        const lines: DOMRect[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          if (node.parentElement && !visible(node.parentElement)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          lines.push(...range.getClientRects());
        }
        const hit = lines.some((line) => {
          const width = Math.min(box.right, line.right) - Math.max(box.left, line.left);
          const height = Math.min(box.bottom, line.bottom) - Math.max(box.top, line.top);
          return width > 4 && height > 4;
        });
        if (hit) {
          const label = text.textContent!.trim().replace(/\s+/g, ' ').slice(0, 40);
          found.push(`«${label}» liegt auf dem Bild «${img.alt}»`);
        }
      }
    }
    return found;
  });
}

/**
 * Die Startseite stellt Sektionen weit unter dem ersten Bildschirm zurück (data-lazy) und rechnet
 * sie erst bei der ersten Interaktion. Für Prüfungen der ganzen Seite hier sofort nachholen.
 */
export async function layOutAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Wie home.ts: erst «neu» (ohne Übergänge), zwei Bilder später fertig.
    const lazy = [...document.querySelectorAll<HTMLElement>('[data-lazy]:not([data-laid])')];
    for (const element of lazy) element.dataset.laid = 'new';
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const element of document.querySelectorAll<HTMLElement>('[data-lazy]')) {
      element.dataset.laid = '';
    }
  });
}

/** Adressen der beiden gebauten Varianten (siehe playwright.config.ts) */
export const PROD = 'http://127.0.0.1:4321';
export const PREVIEW = 'http://127.0.0.1:4322/luescherwohnen-ch';

/** Alle Unterseiten, die es in beiden Varianten gibt */
export const PAGES = ['/', '/impressum', '/datenschutz', '/404', '/styleguide'] as const;
